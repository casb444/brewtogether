-- BrewTogether — user-created study groups and free-launch access

alter table public.rooms
  add column if not exists created_by uuid references public.profiles(id) on delete cascade,
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  add column if not exists join_policy text not null default 'open'
    check (join_policy in ('open', 'approval_required', 'invite_only')),
  add column if not exists is_system boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz;

-- Existing café rooms remain public, system-managed and free at launch.
update public.rooms
  set is_system = true, visibility = 'public', join_policy = 'open', is_premium = false
  where id in ('main', 'library', 'window', 'lounge');

alter table public.rooms alter column id set default
  ('group-' || replace(gen_random_uuid()::text, '-', ''));

create table if not exists public.room_members (
  room_id text not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index if not exists room_members_user_id_idx on public.room_members(user_id);

create table if not exists public.room_join_requests (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  unique(room_id, user_id)
);

create table if not exists public.room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz,
  max_uses integer,
  uses integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (max_uses is null or max_uses > 0)
);

alter table public.room_members enable row level security;
alter table public.room_join_requests enable row level security;
alter table public.room_invites enable row level security;

create or replace function public.is_room_member(p_room_id text, p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.room_members where room_id = p_room_id and user_id = p_user_id); $$;

create or replace function public.can_manage_room(p_room_id text, p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.room_members where room_id = p_room_id and user_id = p_user_id and role in ('owner', 'admin')); $$;

-- System/open rooms can be discovered by everyone; private rooms are visible only to members.
drop policy if exists "rooms are publicly readable" on public.rooms;
create policy "discover public rooms or view membership" on public.rooms for select
  using ((visibility = 'public' and archived_at is null) or public.is_room_member(id));
create policy "room owners can update their rooms" on public.rooms for update
  using (public.can_manage_room(id)) with check (public.can_manage_room(id));

drop policy if exists "users can update own profile" on public.profiles;

create policy "members can view membership" on public.room_members for select
  using (public.is_room_member(room_id));
create policy "owners can view join requests" on public.room_join_requests for select
  using (user_id = auth.uid() or public.can_manage_room(room_id));

-- Conversations and study records are restricted for user-created private/approval rooms.
drop policy if exists "murmurs are publicly readable" on public.murmurs;
create policy "users can read accessible room murmurs" on public.murmurs for select
  using (exists (select 1 from public.rooms r where r.id = room_id and (r.join_policy = 'open' or public.is_room_member(room_id))));
drop policy if exists "users can insert own murmurs" on public.murmurs;
create policy "members can insert own murmurs" on public.murmurs for insert
  with check (auth.uid() = user_id and exists (select 1 from public.rooms r where r.id = room_id and (r.join_policy = 'open' or public.is_room_member(room_id))));

create or replace function public.create_study_group(
  p_name text, p_description text, p_icon text, p_default_ambience text,
  p_visibility text, p_join_policy text
)
returns public.rooms
language plpgsql security definer set search_path = public
as $$
declare v_room public.rooms;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_visibility not in ('public', 'private') then raise exception 'Invalid visibility'; end if;
  if (p_visibility = 'private' and p_join_policy <> 'invite_only')
     or (p_visibility = 'public' and p_join_policy not in ('open', 'approval_required')) then
    raise exception 'Invalid join policy for visibility';
  end if;
  insert into public.rooms (name, description, icon, default_ambience, created_by, visibility, join_policy, is_system, is_premium, sort_order)
  values (left(trim(p_name), 60), left(trim(p_description), 180), coalesce(nullif(p_icon, ''), '📚'), coalesce(nullif(p_default_ambience, ''), 'cafe_rain'), auth.uid(), p_visibility, p_join_policy, false, false, 999)
  returning * into v_room;
  insert into public.room_members(room_id, user_id, role) values (v_room.id, auth.uid(), 'owner');
  return v_room;
end;
$$;

create or replace function public.request_to_join_room(p_room_id text)
returns text language plpgsql security definer set search_path = public as $$
declare v_room public.rooms;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_room from public.rooms where id = p_room_id and archived_at is null;
  if not found or v_room.visibility <> 'public' then raise exception 'Room is not available'; end if;
  if public.is_room_member(p_room_id) then return 'member'; end if;
  if v_room.join_policy = 'open' then
    insert into public.room_members(room_id, user_id) values (p_room_id, auth.uid()) on conflict do nothing;
    return 'joined';
  end if;
  insert into public.room_join_requests(room_id, user_id, status) values (p_room_id, auth.uid(), 'pending')
    on conflict(room_id, user_id) do update set status = 'pending', created_at = now(), reviewed_at = null, reviewed_by = null;
  return 'requested';
end;
$$;

create or replace function public.review_room_join_request(p_request_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_request public.room_join_requests;
begin
  select * into v_request from public.room_join_requests where id = p_request_id for update;
  if not found or not public.can_manage_room(v_request.room_id) then raise exception 'Not allowed'; end if;
  update public.room_join_requests set status = case when p_approve then 'approved' else 'rejected' end, reviewed_at = now(), reviewed_by = auth.uid() where id = p_request_id;
  if p_approve then insert into public.room_members(room_id, user_id) values (v_request.room_id, v_request.user_id) on conflict do nothing; end if;
end;
$$;

create or replace function public.create_room_invite(p_room_id text, p_expires_at timestamptz default null, p_max_uses integer default null)
returns public.room_invites language plpgsql security definer set search_path = public as $$
declare v_invite public.room_invites;
begin
  if not public.can_manage_room(p_room_id) then raise exception 'Not allowed'; end if;
  insert into public.room_invites(room_id, created_by, expires_at, max_uses) values (p_room_id, auth.uid(), p_expires_at, p_max_uses) returning * into v_invite;
  return v_invite;
end;
$$;

create or replace function public.accept_room_invite(p_token uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_invite public.room_invites;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_invite from public.room_invites where token = p_token for update;
  if not found or v_invite.revoked_at is not null or (v_invite.expires_at is not null and v_invite.expires_at <= now()) or (v_invite.max_uses is not null and v_invite.uses >= v_invite.max_uses) then raise exception 'Invite is no longer valid'; end if;
  if not public.is_room_member(v_invite.room_id) then
    insert into public.room_members(room_id, user_id) values (v_invite.room_id, auth.uid()) on conflict do nothing;
    update public.room_invites set uses = uses + 1 where id = v_invite.id;
  end if;
  return v_invite.room_id;
end;
$$;

-- Preserve server-side streak calculations, but refuse study records in rooms the caller cannot enter.
create or replace function public.complete_session(p_room_id text, p_task text, p_duration_seconds int)
returns public.sessions
language plpgsql security definer set search_path = public
as $$
declare v_session public.sessions; v_today date := current_date; v_last date; v_current int; v_longest int;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.rooms r where r.id = p_room_id and r.archived_at is null and (r.join_policy = 'open' or public.is_room_member(p_room_id))) then raise exception 'You cannot enter this room'; end if;
  insert into public.sessions (user_id, room_id, task, duration_seconds, completed, ended_at) values (auth.uid(), p_room_id, p_task, p_duration_seconds, true, now()) returning * into v_session;
  select last_session_date, current_streak, longest_streak into v_last, v_current, v_longest from public.streaks where user_id = auth.uid();
  if v_last is null then v_current := 1; elsif v_last = v_today then v_current := v_current; elsif v_last = v_today - 1 then v_current := v_current + 1; else v_current := 1; end if;
  v_longest := greatest(coalesce(v_longest, 0), v_current);
  update public.streaks set current_streak = v_current, longest_streak = v_longest, last_session_date = v_today where user_id = auth.uid();
  return v_session;
end;
$$;

revoke all on function public.create_study_group(text, text, text, text, text, text) from public;
revoke all on function public.request_to_join_room(text) from public;
revoke all on function public.review_room_join_request(uuid, boolean) from public;
revoke all on function public.create_room_invite(text, timestamptz, integer) from public;
revoke all on function public.accept_room_invite(uuid) from public;
grant execute on function public.create_study_group(text, text, text, text, text, text), public.request_to_join_room(text), public.review_room_join_request(uuid, boolean), public.create_room_invite(text, timestamptz, integer), public.accept_room_invite(uuid) to authenticated;
