# BrewTogether development reference

## Product and architecture

BrewTogether is a virtual study café. Authenticated users enter a room, run a Pomodoro timer, publish their current task through Supabase Presence, and post short room-scoped "Murmurs".

| Concern | Location | Notes |
| --- | --- | --- |
| Routes and layout | `app/` | Next.js App Router; room pages are server-rendered and hydrate the interactive café client. |
| Authentication | `app/(auth)/*`, `app/forgot-password`, `app/reset-password`, `app/auth/callback/route.ts` | Email/password, password reset, and confirmation-code exchange with a validated `next` path. |
| Supabase clients | `lib/supabase/`, `proxy.ts` | Separate browser, server, and proxy clients. Proxy refreshes auth cookies when Supabase is configured. |
| Live room presence | `lib/hooks/usePresence.ts` | Supabase Realtime Presence channel named `room:{roomId}`. |
| Murmurs | `lib/hooks/useMurmurs.ts` | Initial Postgres query plus Realtime `INSERT` subscription. |
| Timer and stats | `lib/hooks/useStudySession.ts` | Client countdown; completed focus sessions persist through `complete_session`. Breaks are not stored. |
| Data and access rules | `supabase/migrations/` | `0001` schema, `0002` groups, `0003` launch hardening. |
| Database typing | `types/database.ts` | Manually maintained Supabase database types. Update after schema changes. |

## Request flow

1. `proxy.ts` refreshes the Supabase session when credentials are configured.
2. Public landing page (`/`) loads rooms and detects the current user server-side, or renders without a backend if credentials are still placeholders.
3. `/cafe/[roomId]` requires a user, fetches the room/profile/streak, enforces group membership for restricted rooms, then renders `CafeClient`.
4. The browser client joins both room channels: Presence for attendees and a Postgres changes subscription for Murmurs.
5. Completing a focus timer calls `complete_session`, which inserts a completed session and updates the user's streak atomically. Five-minute breaks do not persist.

## Local setup

### Prerequisites

- Node.js compatible with Next.js 16 (use the project's lockfile via `npm ci` when possible).
- A Supabase project.

### Configure Supabase

1. Run `supabase/migrations/0001_init.sql`, then `0002_study_groups.sql`, then `0003_launch_hardening.sql` in the Supabase SQL editor (or apply them with the Supabase CLI).
2. Enable email/password authentication. Disabling email confirmation simplifies local testing.
3. Copy `.env.local.example` to `.env.local` and set real values:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. In Supabase Auth URL configuration, add the local callback URL: `http://localhost:3000/auth/callback`.

### Run and verify

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Verify signup/sign-in, a free room, a completed timer, and a Murmur. To test Presence or Murmurs, use two distinct accounts in separate browser profiles.

Useful checks:

```bash
npm run lint
npm run build
```

`next/font/google` in `app/layout.tsx` downloads fonts while building; builds need internet access unless those fonts are replaced with local or system fonts.

## Database model

- `profiles`: user display identity and subscription plan; created by `handle_new_user` after Supabase signup.
- `rooms`: static public café-room catalog, seeded by the migration.
- `sessions`: completed focus sessions and their metadata. Users can read only their own sessions.
- `streaks`: one cached, user-owned streak record updated by `complete_session`.
- `murmurs`: short public room messages; inserts must belong to the signed-in user.
- `room_members`, `room_join_requests`, and `room_invites`: group roles, approval queues, and revocable invitation tokens. These are introduced in migration `0002_study_groups.sql`.

RLS is enabled for every table. Any schema update must include the appropriate RLS policy and a matching update to `types/database.ts`. Group access is enforced server-side by the `create_study_group`, `request_to_join_room`, `review_room_join_request`, and invite RPCs; do not insert memberships or trust a room ID from the client.

## Development conventions

- Keep server-side data access in route/page modules using `lib/supabase/server.ts`; use the browser client only in client components and hooks.
- Treat `complete_session` as the source of truth for persisted sessions and streak calculations. Do not write streak values from a client component.
- Keep Presence payloads small and non-sensitive: task text, status, display name, and avatar seed are visible to room attendees.
- Room IDs are string keys in the database and URLs. Add rooms through a migration and preserve `sort_order`.
- UI components are intentionally simple and styled through Tailwind v4 utility classes plus `app/globals.css` tokens.
- This repository has no automated test suite yet. Add focused tests before expanding stateful flows, RLS-sensitive behavior, or the billing path.

## Review findings and recommended backlog

### P0 — preserve server-controlled entitlements before paid launch

The free-launch UI no longer updates plans from the browser and the profile update RLS policy is removed in migration `0002`. When subscriptions are introduced, change entitlements only through a trusted payment webhook or a narrowly scoped `security definer` function. Use the billing provider as the source of truth.

### P1 — preserve post-login destinations

Room redirects send users to `/login?next=/cafe/{roomId}`, but the login page always pushes `/cafe/main` after success. Read and validate the local `next` path, then redirect there after login.

### P1 — make timer completion reliable

The completion UI is shown before the `complete_session` RPC has succeeded, and RPC errors are ignored. Surface failures to the user, prevent duplicate completion requests, and only show persisted streak/session figures after a successful response.

### P2 — improve operational coverage

- Add an error/loading strategy for Supabase reads and Realtime subscriptions.
- Add unit coverage for timer state transitions and integration coverage for auth redirects/RLS behavior.
- Regenerate database types from the deployed Supabase schema rather than maintaining them manually.
- Implement actual audio or remove the ambience feature claim; it currently changes UI state only.
- Implement payment, private-room membership, and external share actions before advertising them as live features.

## Change checklist

Before merging a feature:

1. Confirm server/client component boundaries and current Next.js 16 guidance.
2. Add a migration and RLS policies for every database change.
3. Update `types/database.ts` to match the schema.
4. Exercise both signed-out and signed-in flows.
5. Test a second account when modifying Presence, Murmurs, room access, or subscription state.
6. Run lint and production build with valid environment values.
