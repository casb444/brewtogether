-- BrewTogether launch hardening: access control, group management, abuse limits

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous'));
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create or replace function public.protect_profile_entitlements()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.id := old.id;
  new.plan := old.plan;
  return new;
end;
$$;

drop trigger if exists protect_profile_entitlements on public.profiles;
create trigger protect_profile_entitlements
  before update on public.profiles
  for each row execute procedure public.protect_profile_entitlements();

create policy "users can update own display identity" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "users can insert own sessions" on public.sessions;
create policy "users can insert own accessible sessions" on public.sessions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.archived_at is null
        and (r.join_policy = 'open' or public.is_room_member(room_id))
    )
  );

create or replace function public.enforce_murmur_rate()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is not null and exists (
    select 1 from public.murmurs
    where user_id = new.user_id
      and created_at > now() - interval '2 seconds'
  ) then
    raise exception 'Please wait a moment before posting another murmur';
  end if;
  return new;
end;
$$;

drop trigger if exists murmur_rate_limit on public.murmurs;
create trigger murmur_rate_limit
  before insert on public.murmurs
  for each row execute procedure public.enforce_murmur_rate();

create policy "managers can view invites" on public.room_invites
  for select using (public.can_manage_room(room_id));

create or replace function public.public_cafe_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'completed_sessions', (select count(*)::int from public.sessions where completed),
    'public_rooms', (select count(*)::int from public.rooms where archived_at is null and visibility = 'public')
  );
$$;

create or replace function public.preview_room_invite(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_invite public.room_invites;
  v_room public.rooms;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
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

create or replace function public.update_study_group(
  p_room_id text,
  p_name text,
  p_description text,
  p_icon text,
  p_default_ambience text
)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare v_room public.rooms;
begin
  if not public.can_manage_room(p_room_id) then raise exception 'Not allowed'; end if;
  update public.rooms
    set name = left(trim(p_name), 60),
        description = left(trim(p_description), 180),
        icon = coalesce(nullif(p_icon, ''), icon),
        default_ambience = coalesce(nullif(p_default_ambience, ''), default_ambience)
    where id = p_room_id and archived_at is null and is_system = false
    returning * into v_room;
  if not found then raise exception 'Room is not available'; end if;
  return v_room;
end;
$$;

create or replace function public.archive_study_group(p_room_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can archive this group';
  end if;
  update public.rooms set archived_at = now() where id = p_room_id and is_system = false and archived_at is null;
end;
$$;

create or replace function public.leave_study_group(p_room_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_room_member(p_room_id) then raise exception 'Not a member'; end if;
  if exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = auth.uid() and role = 'owner'
  ) and (
    select count(*) from public.room_members where room_id = p_room_id and role = 'owner'
  ) = 1 then
    raise exception 'Transfer ownership or archive the group before leaving';
  end if;
  delete from public.room_members where room_id = p_room_id and user_id = auth.uid();
end;
$$;

create or replace function public.remove_room_member(p_room_id text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_target text;
begin
  if p_user_id = auth.uid() then raise exception 'Use leave instead of removing yourself'; end if;
  if not public.can_manage_room(p_room_id) then raise exception 'Not allowed'; end if;
  select role into v_target from public.room_members where room_id = p_room_id and user_id = p_user_id;
  if v_target is null then raise exception 'Member not found'; end if;
  if v_target = 'owner' then raise exception 'The owner cannot be removed'; end if;
  if v_target = 'admin' and not exists (
    select 1 from public.room_members where room_id = p_room_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can remove an admin';
  end if;
  delete from public.room_members where room_id = p_room_id and user_id = p_user_id;
end;
$$;

create or replace function public.set_room_member_role(p_room_id text, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('admin', 'member') then raise exception 'Invalid role'; end if;
  if not exists (
    select 1 from public.room_members where room_id = p_room_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can change roles';
  end if;
  if p_user_id = auth.uid() then raise exception 'The owner cannot change their own role'; end if;
  update public.room_members set role = p_role where room_id = p_room_id and user_id = p_user_id and role <> 'owner';
  if not found then raise exception 'Member not found'; end if;
end;
$$;

create or replace function public.revoke_room_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_invite public.room_invites;
begin
  select * into v_invite from public.room_invites where id = p_invite_id;
  if not found or not public.can_manage_room(v_invite.room_id) then raise exception 'Not allowed'; end if;
  update public.room_invites set revoked_at = now() where id = p_invite_id and revoked_at is null;
end;
$$;

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
  if (select count(*) from public.rooms where created_by = auth.uid() and archived_at is null) >= 25 then
    raise exception 'You have reached the group limit';
  end if;
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

revoke all on function public.complete_session(text, text, integer) from public;
revoke all on function public.public_cafe_stats() from public;
revoke all on function public.preview_room_invite(uuid) from public;
revoke all on function public.update_study_group(text, text, text, text, text) from public;
revoke all on function public.archive_study_group(text) from public;
revoke all on function public.leave_study_group(text) from public;
revoke all on function public.remove_room_member(text, uuid) from public;
revoke all on function public.set_room_member_role(text, uuid, text) from public;
revoke all on function public.revoke_room_invite(uuid) from public;

grant execute on function public.complete_session(text, text, integer) to authenticated;
grant execute on function public.public_cafe_stats() to anon, authenticated;
grant execute on function public.preview_room_invite(uuid) to authenticated;
grant execute on function public.update_study_group(text, text, text, text, text) to authenticated;
grant execute on function public.archive_study_group(text) to authenticated;
grant execute on function public.leave_study_group(text) to authenticated;
grant execute on function public.remove_room_member(text, uuid) to authenticated;
grant execute on function public.set_room_member_role(text, uuid, text) to authenticated;
grant execute on function public.revoke_room_invite(uuid) to authenticated;
