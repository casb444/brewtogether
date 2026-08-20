-- ══════════════════════════════════════════════════════════════════
-- BrewTogether — Initial schema
-- ══════════════════════════════════════════════════════════════════

-- Profiles: one row per authenticated user, mirrors auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anonymous',
  avatar_seed text not null default substr(md5(random()::text), 1, 6),
  plan text not null default 'free' check (plan in ('free','plus','pro')),
  created_at timestamptz not null default now()
);

-- Rooms: static list of café rooms
create table if not exists public.rooms (
  id text primary key,
  name text not null,
  icon text not null,
  description text not null,
  default_ambience text not null default 'cafe_rain',
  is_premium boolean not null default false,
  sort_order int not null default 0
);

insert into public.rooms (id, name, icon, description, default_ambience, is_premium, sort_order) values
  ('main',    'The Main Café',       '☕', 'Warm, busy, welcoming.',              'cafe_rain', false, 1),
  ('library', 'Late-Night Library',  '📚', 'Quiet and focused.',                  'library',   false, 2),
  ('window',  'Rainy Window',        '🌧️', 'Small and cozy. Rain on glass.',      'cafe_rain', true,  3),
  ('lounge',  'Midnight Lounge',     '🌙', 'Deep focus, late hours.',             'silence',   true,  4)
on conflict (id) do nothing;

-- Sessions: every completed (or abandoned) focus session, for streaks + stats
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id text not null references public.rooms(id),
  task text,
  duration_seconds int not null,
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_started_at_idx on public.sessions(started_at);

-- Murmurs: short ambient messages tied to a room
create table if not exists public.murmurs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  room_id text not null references public.rooms(id),
  display_name text not null,
  text text not null check (char_length(text) <= 90),
  created_at timestamptz not null default now()
);
create index if not exists murmurs_room_id_idx on public.murmurs(room_id, created_at desc);

-- Streaks: derived/cached streak state per user (updated by a function/trigger)
create table if not exists public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_session_date date
);

-- Private rooms (Brew+/Pro feature)
create table if not exists public.private_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.murmurs enable row level security;
alter table public.streaks enable row level security;
alter table public.private_rooms enable row level security;
alter table public.rooms enable row level security;

-- Rooms: public read
create policy "rooms are publicly readable" on public.rooms for select using (true);

-- Profiles: publicly readable (display name/avatar needed for presence), only owner can write
create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Sessions: owner can CRUD their own; sessions are not publicly readable (privacy)
create policy "users can view own sessions" on public.sessions for select using (auth.uid() = user_id);
create policy "users can insert own sessions" on public.sessions for insert with check (auth.uid() = user_id);
create policy "users can update own sessions" on public.sessions for update using (auth.uid() = user_id);

-- Murmurs: publicly readable (it's ambient chat), only authenticated users can post as themselves
create policy "murmurs are publicly readable" on public.murmurs for select using (true);
create policy "users can insert own murmurs" on public.murmurs for insert with check (auth.uid() = user_id);

-- Streaks: owner-only
create policy "users can view own streak" on public.streaks for select using (auth.uid() = user_id);
create policy "users can upsert own streak" on public.streaks for insert with check (auth.uid() = user_id);
create policy "users can update own streak" on public.streaks for update using (auth.uid() = user_id);

-- Private rooms: owner can manage; members would need a join table (kept minimal for MVP)
create policy "owner can view own private rooms" on public.private_rooms for select using (auth.uid() = owner_id);
create policy "owner can create private rooms" on public.private_rooms for insert with check (auth.uid() = owner_id);

-- ══════════════════════════════════════════════════════════════════
-- Function: auto-create profile on signup
-- ══════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous'));
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════════════════════════════════
-- Function: record a completed session + update streak
-- ══════════════════════════════════════════════════════════════════
create or replace function public.complete_session(
  p_room_id text,
  p_task text,
  p_duration_seconds int
)
returns public.sessions as $$
declare
  v_session public.sessions;
  v_today date := current_date;
  v_last date;
  v_current int;
  v_longest int;
begin
  insert into public.sessions (user_id, room_id, task, duration_seconds, completed, ended_at)
  values (auth.uid(), p_room_id, p_task, p_duration_seconds, true, now())
  returning * into v_session;

  select last_session_date, current_streak, longest_streak
    into v_last, v_current, v_longest
    from public.streaks where user_id = auth.uid();

  if v_last is null then
    v_current := 1;
  elsif v_last = v_today then
    -- already logged today, streak unchanged
    v_current := v_current;
  elsif v_last = v_today - 1 then
    v_current := v_current + 1;
  else
    v_current := 1;
  end if;

  v_longest := greatest(coalesce(v_longest,0), v_current);

  update public.streaks
    set current_streak = v_current,
        longest_streak = v_longest,
        last_session_date = v_today
    where user_id = auth.uid();

  return v_session;
end;
$$ language plpgsql security definer;
