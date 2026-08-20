-- Supabase grants EXECUTE on new functions to anon by default.
-- Keep helper + public stats callable without a session; lock privileged RPCs.

revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from public;

grant execute on function public.public_cafe_stats() to anon, authenticated;
grant execute on function public.is_room_member(text, uuid) to anon, authenticated;
grant execute on function public.can_manage_room(text, uuid) to anon, authenticated;

grant execute on function public.complete_session(text, text, integer) to authenticated;
grant execute on function public.preview_room_invite(uuid) to authenticated;
grant execute on function public.update_study_group(text, text, text, text, text) to authenticated;
grant execute on function public.archive_study_group(text) to authenticated;
grant execute on function public.leave_study_group(text) to authenticated;
grant execute on function public.remove_room_member(text, uuid) to authenticated;
grant execute on function public.set_room_member_role(text, uuid, text) to authenticated;
grant execute on function public.revoke_room_invite(uuid) to authenticated;
grant execute on function public.create_study_group(text, text, text, text, text, text) to authenticated;
grant execute on function public.request_to_join_room(text) to authenticated;
grant execute on function public.review_room_join_request(uuid, boolean) to authenticated;
grant execute on function public.create_room_invite(text, timestamptz, integer) to authenticated;
grant execute on function public.accept_room_invite(uuid) to authenticated;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
