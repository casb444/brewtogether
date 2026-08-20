-- Enable Realtime for café Murmurs (idempotent for local/remote re-apply).
do $$
begin
  alter publication supabase_realtime add table public.murmurs;
exception
  when duplicate_object then null;
end
$$;
