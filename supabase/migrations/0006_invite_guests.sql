-- Invite guests: anonymous seats for shared invites only, plus orphan cleanup.

alter table public.murmurs
  add column if not exists is_guest boolean not null default false;

create or replace function public.is_anonymous_user()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

create or replace function public.cleanup_abandoned_guests()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users u
  where u.is_anonymous is true
    and u.created_at < timezone('utc', now()) - interval '1 hour'
    and not exists (select 1 from public.room_members m where m.user_id = u.id);
end;
$$;

create or replace function public.preview_room_invite(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.room_invites;
  v_room public.rooms;
begin
  perform public.cleanup_abandoned_guests();
  select * into v_invite from public.room_invites where token = p_token;
  if not found
     or v_invite.revoked_at is not null
     or (v_invite.expires_at is not null and v_invite.expires_at <= now())
     or (v_invite.max_uses is not null and v_invite.uses >= v_invite.max_uses) then
    raise exception 'Invite is no longer valid';
  end if;
  select * into v_room from public.rooms where id = v_invite.room_id and archived_at is null;
  if not found then raise exception 'Invite is no longer valid'; end if;
  return jsonb_build_object(
    'room_id', v_room.id,
    'name', v_room.name,
    'icon', v_room.icon,
    'description', v_room.description,
    'visibility', v_room.visibility
  );
end;
$$;

create or replace function public.accept_room_invite(p_token uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.room_invites;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform public.cleanup_abandoned_guests();
  select * into v_invite from public.room_invites where token = p_token for update;
  if not found
     or v_invite.revoked_at is not null
     or (v_invite.expires_at is not null and v_invite.expires_at <= now())
     or (v_invite.max_uses is not null and v_invite.uses >= v_invite.max_uses) then
    raise exception 'Invite is no longer valid';
  end if;
  if public.is_anonymous_user()
     and exists (
       select 1 from public.room_members
       where user_id = auth.uid() and room_id <> v_invite.room_id
     ) then
    raise exception 'Guest seats are only for one group. Become a member to join more.';
  end if;
  if not public.is_room_member(v_invite.room_id) then
    insert into public.room_members(room_id, user_id) values (v_invite.room_id, auth.uid()) on conflict do nothing;
    update public.room_invites set uses = uses + 1 where id = v_invite.id;
  end if;
  return v_invite.room_id;
end;
$$;

create or replace function public.create_study_group(
  p_name text, p_description text, p_icon text, p_default_ambience text,
  p_visibility text, p_join_policy text
)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare v_room public.rooms;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if public.is_anonymous_user() then raise exception 'Become a member to create a group'; end if;
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
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_room public.rooms;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if public.is_anonymous_user() then raise exception 'Become a member to join more rooms'; end if;
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

create or replace function public.complete_session(p_room_id text, p_task text, p_duration_seconds int)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions;
  v_today date := current_date;
  v_last date;
  v_current int;
  v_longest int;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.rooms r
    where r.id = p_room_id
      and r.archived_at is null
      and (
        public.is_room_member(p_room_id)
        or (not public.is_anonymous_user() and r.join_policy = 'open')
      )
  ) then
    raise exception 'You cannot enter this room';
  end if;
  insert into public.sessions (user_id, room_id, task, duration_seconds, completed, ended_at)
    values (auth.uid(), p_room_id, p_task, p_duration_seconds, true, now())
    returning * into v_session;
  select last_session_date, current_streak, longest_streak into v_last, v_current, v_longest
    from public.streaks where user_id = auth.uid();
  if v_last is null then v_current := 1;
  elsif v_last = v_today then v_current := v_current;
  elsif v_last = v_today - 1 then v_current := v_current + 1;
  else v_current := 1;
  end if;
  v_longest := greatest(coalesce(v_longest, 0), v_current);
  update public.streaks
    set current_streak = v_current, longest_streak = v_longest, last_session_date = v_today
    where user_id = auth.uid();
  return v_session;
end;
$$;

drop policy if exists "discover public rooms or view membership" on public.rooms;
create policy "discover public rooms or view membership" on public.rooms for select
  using (
    public.is_room_member(id)
    or (
      visibility = 'public'
      and archived_at is null
      and not public.is_anonymous_user()
    )
  );

drop policy if exists "users can insert own accessible sessions" on public.sessions;
create policy "users can insert own accessible sessions" on public.sessions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.archived_at is null
        and (
          public.is_room_member(room_id)
          or (not public.is_anonymous_user() and r.join_policy = 'open')
        )
    )
  );

drop policy if exists "users can read accessible room murmurs" on public.murmurs;
create policy "users can read accessible room murmurs" on public.murmurs for select
  using (
    public.is_room_member(room_id)
    or (
      not public.is_anonymous_user()
      and exists (
        select 1 from public.rooms r
        where r.id = room_id and r.join_policy = 'open'
      )
    )
  );

drop policy if exists "members can insert own murmurs" on public.murmurs;
create policy "members can insert own murmurs" on public.murmurs for insert
  with check (
    auth.uid() = user_id
    and is_guest = public.is_anonymous_user()
    and (
      public.is_room_member(room_id)
      or (not public.is_anonymous_user() and exists (
        select 1 from public.rooms r where r.id = room_id and r.join_policy = 'open'
      ))
    )
  );

revoke all on function public.is_anonymous_user() from public;
revoke all on function public.cleanup_abandoned_guests() from public, anon, authenticated;
grant execute on function public.is_anonymous_user() to anon, authenticated;
grant execute on function public.preview_room_invite(uuid) to anon, authenticated;
grant execute on function public.accept_room_invite(uuid) to authenticated;
grant execute on function public.create_study_group(text, text, text, text, text, text) to authenticated;
grant execute on function public.request_to_join_room(text) to authenticated;
grant execute on function public.complete_session(text, text, integer) to authenticated;
