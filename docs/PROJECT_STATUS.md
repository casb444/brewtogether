# BrewTogether — project status and development handoff

> **Status date:** 20 August 2026  
> **Current release status:** Application code is prepared for a free public launch. A real Supabase project, applied migrations `0001`–`0003`, and production env vars are still required before strangers can sign in.

This is the canonical handoff document for the project. It records the implemented product, its architecture and data model, how to configure it, all known limitations, review findings, and the recommended work order. Read it together with [DEVELOPMENT.md](./DEVELOPMENT.md), which contains the shorter day-to-day reference.

## 1. Product definition

BrewTogether is a virtual study café for people who focus better alongside others. Users can study without video or direct conversation, use a Pomodoro timer, publish an optional current task through live presence, post short room-scoped "Murmurs," and build a session streak.

The current product direction has two kinds of spaces:

1. **System café rooms** — seeded rooms such as Main Café and Late-Night Library, visible to everyone and free during launch.
2. **User-created study groups** — a shared implementation of public and private study rooms:
   - **Public / open:** discoverable; any signed-in user can join immediately.
   - **Public / approval required:** discoverable; a signed-in user requests access and an owner/admin approves before the user can enter.
   - **Private / invite only:** not discoverable; a user can join only through a valid invite link.

The initial pricing concept has deliberately been retained in source code for a future region-aware launch, but it is hidden during the free launch. The current monetization direction is voluntary donations through an external provider that supports INR settlement.

## 2. Current implementation inventory

| Area | State | Primary locations |
| --- | --- | --- |
| Marketing landing page | Implemented | `app/page.tsx`, `app/LandingClient.tsx` |
| Email/password authentication | Implemented, backend configuration required | `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/auth/callback/route.ts` |
| Auth cookie refresh | Implemented | `middleware.ts`, `lib/supabase/middleware.ts` |
| Café timer, task state, presence, Murmurs, streak display | Implemented | `app/cafe/[roomId]/CafeClient.tsx`, `components/`, `lib/hooks/` |
| Completed-session/streak database RPC | Implemented | `supabase/migrations/0001_init.sql`, overridden in `0002_study_groups.sql` |
| System café rooms | Implemented in initial migration | `supabase/migrations/0001_init.sql` |
| Public and private study-group data model | Implemented in migration; must be applied | `supabase/migrations/0002_study_groups.sql` |
| Group discovery and creation page | Implemented | `app/groups/page.tsx`, `app/groups/GroupsClient.tsx` |
| Open join and approval request UI | Implemented | `app/groups/GroupsClient.tsx`, `app/cafe/[roomId]/CafeClient.tsx` |
| Private invite creation and acceptance | Implemented | `app/cafe/[roomId]/CafeClient.tsx`, `app/invite/[token]/*` |
| Payments / subscriptions | Not implemented | Former pricing UI retained in `app/LandingClient.tsx`; no provider integration |
| Donations | UI hook only | `NEXT_PUBLIC_DONATION_URL`; no provider configured in the current environment |
| Automated tests | Not implemented | No test runner or test files currently exist |

## 3. Technology and repository structure

### Technology

- **Next.js 16.3.0**, App Router, React 19, TypeScript.
- **Tailwind CSS v4** for styling, with custom CSS variables in `app/globals.css`.
- **Supabase** for Auth, Postgres, Row Level Security (RLS), Realtime Presence, and Postgres Changes subscriptions.
- **npm** with `package-lock.json`.

### Important directories and files

```text
app/
  page.tsx                         Server landing page; reads auth state and rooms.
  LandingClient.tsx                Marketing UI, room cards, free-launch donation section.
  layout.tsx                       Global metadata and system-font layout.
  globals.css                      Tailwind import, theme tokens, animations, font variables.
  (auth)/login/page.tsx            Client-side email/password login.
  (auth)/signup/page.tsx           Client-side sign-up and confirmation handling.
  auth/callback/route.ts           Exchanges Supabase email confirmation code for a session.
  cafe/page.tsx                    Redirects to Main Café.
  cafe/[roomId]/page.tsx           Server-side auth/access gate and room data fetch.
  cafe/[roomId]/CafeClient.tsx     Interactive café, group owner controls, modals.
  groups/page.tsx                  Protected server-side study-group data fetch.
  groups/GroupsClient.tsx          Public group discovery, join/request, create-group form.
  invite/[token]/page.tsx          Requires sign-in before accepting an invite.
  invite/[token]/AcceptInvite.tsx  Invokes invite RPC and redirects into the room.

components/                        Reusable presentational components.
lib/hooks/                         Presence, Murmurs, and timer/session hooks.
lib/supabase/                      Browser, server, and middleware Supabase clients.
supabase/migrations/               Ordered SQL migrations; 0001 must run before 0002.
types/database.ts                  Manually maintained TypeScript representation of the schema.
docs/                              Development and status documentation.
```

### Next.js conventions used

- Pages and layout are Server Components by default. Database reads and redirects occur in server page modules.
- Interactive screens and browser API usage live in Client Components (`"use client"`) or hooks.
- Dynamic routes use the current Next.js 16 async `params` convention: `params: Promise<{ roomId: string }>`.
- `middleware.ts` is still used for Supabase session refresh. Next.js 16 emits a deprecation warning recommending the newer `proxy` file convention; migrate before the next framework upgrade.

## 4. Environment and local setup

### Required environment variables

Copy `.env.local.example` to `.env.local` and configure real values. Never commit `.env.local`.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Keep false for the launch phase. The pricing UI remains in source but is hidden.
NEXT_PUBLIC_PRICING_ENABLED=false

# Optional during development. Set to an INR-capable external donation/payment URL for launch.
NEXT_PUBLIC_DONATION_URL=https://your-donation-provider.example/link
```

### Current local-environment state

At the time of this document, `.env.local` contains the example placeholder Supabase URL and key. Consequently:

- Supabase calls cannot connect to a real project.
- The landing page receives no rooms and displays an empty room-card section.
- Sign-up, sign-in, realtime presence, Murmurs, session persistence, group creation, approvals, and invites cannot be verified end to end.
- This is a configuration blocker, not evidence that the underlying UI flow works against a real database.

### Install and run

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
node_modules/.bin/tsc --noEmit
npm run lint
npm run build
```

The project now uses system fonts (`app/layout.tsx` and `app/globals.css`) rather than fetching Google Fonts during build, so builds do not require Google Fonts network access.

### Supabase setup sequence

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor or through the Supabase CLI.
3. Run `supabase/migrations/0002_study_groups.sql` **after** `0001`.
4. In Supabase Authentication, enable email/password sign-in.
5. For local testing, either disable email confirmation temporarily or configure the redirect URL `http://localhost:3000/auth/callback`.
6. Add the production callback URL before deployment.
7. Put the project URL and anon key in `.env.local` locally and the equivalent environment configuration in the deployment platform.
8. Verify Realtime is enabled/configured for the `murmurs` table if Postgres Changes are required by the Supabase project configuration.

Do not apply `0002` to a database where `0001` has not been applied: it changes tables, policies, and the `complete_session` function created in `0001`.

## 5. User journeys and route behavior

### Landing page: `/`

- Reads the current Supabase user server-side.
- Reads visible rooms server-side.
- Shows sign-up/sign-in actions when signed out; café entry when signed in.
- Shows the pricing section only when `NEXT_PUBLIC_PRICING_ENABLED === "true"`.
- Shows the free-launch donation section otherwise. If `NEXT_PUBLIC_DONATION_URL` is absent, it displays “Donations will open soon.”
- Existing café rooms are rendered from the database, not hard-coded in the landing page.

### Login: `/login`

- Authenticates with `supabase.auth.signInWithPassword`.
- Supports a local `next` destination. It accepts only a path beginning with one slash and rejects values beginning with `//`; otherwise it goes to `/cafe/main`.
- A successful login refreshes the router so Server Components see the new Supabase cookie.

### Sign-up: `/signup`

- Collects display name, email, and a password of at least six characters.
- Sends the display name in Supabase user metadata; the database trigger creates the profile and streak record.
- With confirmation disabled, it routes immediately to `/cafe/main`.
- With confirmation enabled, it shows a check-email state and uses `/auth/callback` as the redirect URL.

### Auth callback: `/auth/callback`

- Exchanges the auth `code` for a session and redirects to `next` or `/cafe/main`.
- On exchange failure, redirects to `/login?error=auth_failed`.

### Café: `/cafe/[roomId]`

- Requires an authenticated user; otherwise redirects to `/login?next=/cafe/[roomId]`.
- Reads the room, user profile, user streak, visible rooms, and, for the room creator only, pending approval requests.
- Open rooms allow any signed-in user to enter.
- Approval-required and invite-only rooms require a `room_members` record; non-members are redirected to `/groups`.
- Mounts `CafeClient`, which opens Realtime Presence and Murmurs subscriptions.

### Study groups: `/groups`

- Requires authentication; otherwise redirects to `/login?next=/groups`.
- Shows discoverable user-created public rooms, current user memberships, and current user join-request status.
- Lets a signed-in user create a group or join/request entry to a public group.
- Private groups are deliberately excluded from discovery.

### Invite links: `/invite/[token]`

- Requires authentication; otherwise redirects to login with the invite page as the destination.
- Once authenticated, the client calls `accept_room_invite` and redirects to the returned room ID.
- The invite route currently accepts immediately rather than presenting a join confirmation screen.

## 6. Café and real-time behavior

### Presence

- `lib/hooks/usePresence.ts` creates a Supabase Presence channel called `room:{roomId}`.
- Each client tracks `user_id`, display name, avatar seed, task text, status, and session start time.
- Presence is intentionally ephemeral; it is not stored in Postgres.
- Task text is shared with attendees. Do not put sensitive information in the task field.

### Murmurs

- `lib/hooks/useMurmurs.ts` initially loads the latest eight Murmurs for the room, then subscribes to Postgres `INSERT` events.
- Messages are trimmed and limited to 90 characters client-side; the database has a matching `char_length(text) <= 90` constraint.
- Users can read/post in open rooms. Approval and invite-only rooms require membership under the new policy.

### Pomodoro, sessions, and streaks

- `lib/hooks/useStudySession.ts` defaults to 25 minutes and supports 25, 50, and 90-minute durations through the timer component.
- On completion, it calls `complete_session(p_room_id, p_task, p_duration_seconds)`.
- The PostgreSQL function inserts a completed session and atomically recalculates the user’s streak using `current_date` on the database server.
- The function was redefined in migration `0002` to deny session creation in archived or restricted rooms when the user is not a member.
- Completed session values are loaded for the current day by the client hook.

### Current UI-only behavior

- Ambience selection only changes UI state and a toast. It does not play audio.
- Social-share chips show an “Opening…” toast only; they do not open or compose on their respective platforms.
- `LivePill` adds a fixed offset to actual presence in the café screen and the landing page uses a simulated count. These are not production metrics.
- `sessionsThisWeek` is a display approximation (`sessionsToday + 5` when a streak exists), not an accurate weekly query.

## 7. Database schema and access model

### Migration `0001_init.sql`

| Table | Purpose | Key fields / notes |
| --- | --- | --- |
| `profiles` | One identity record per Supabase Auth user | `id`, `display_name`, `avatar_seed`, legacy `plan`, `created_at` |
| `rooms` | Initial static café-room catalogue | string `id`, name, icon, description, ambience, legacy premium flag, sort order |
| `sessions` | Completed/abandoned focus session records | user, room, task, duration, completion state and timestamps |
| `murmurs` | Short shared room messages | user, room, display name, text, creation time |
| `streaks` | Cached streak data | one row per user, current/longest streak, last session date |
| `private_rooms` | Legacy MVP concept | remains in the database but is not used by the group feature or UI |

`0001` also:

- Seeds `main`, `library`, `window`, and `lounge` rooms.
- Enables RLS on all tables.
- Creates the `handle_new_user` trigger, which creates `profiles` and `streaks` rows after user creation.
- Creates the original `complete_session` function.

### Migration `0002_study_groups.sql`

`0002` evolves `rooms` into the unified system-room and study-group model.

#### Added room fields

| Field | Meaning |
| --- | --- |
| `created_by` | Creator profile for user-created groups; `null` for seeded system rooms |
| `visibility` | `public` or `private` |
| `join_policy` | `open`, `approval_required`, or `invite_only` |
| `is_system` | Marks seeded café rooms |
| `created_at` | Creation timestamp for group ordering |
| `archived_at` | Soft-archive timestamp; no archive UI yet |

Migration `0002` sets the seeded rooms to `is_system = true`, `visibility = public`, `join_policy = open`, and `is_premium = false`, making every seeded room free for launch. New room IDs default to `group-` plus a UUID without hyphens.

#### Group tables

| Table | Purpose |
| --- | --- |
| `room_members` | `(room_id, user_id)` membership record with `owner`, `admin`, or `member` role |
| `room_join_requests` | One request per user/room, with pending/approved/rejected/cancelled state and review metadata |
| `room_invites` | UUID capability token with optional expiry, optional maximum uses, usage count, and revocation timestamp |

#### Security helper functions

- `is_room_member(room_id, user_id = auth.uid())`: true when a membership exists.
- `can_manage_room(room_id, user_id = auth.uid())`: true for an owner or admin membership.

Both are `security definer` functions with `search_path = public`, allowing policies and RPCs to check membership securely.

#### Access policies currently intended

- Public non-archived rooms are discoverable.
- Private rooms are visible only to their members.
- Room members can view group membership.
- A user can view their own join request; owners/admins can view requests for rooms they manage.
- Murmurs are readable/writable in open rooms, or by a member in restricted rooms.
- Direct client insertion for the new group tables is not enabled. Membership, requests, and invitations are meant to be mutated only through the RPC functions below.
- The general profile update policy is dropped in `0002`, removing the prior browser-side plan-escalation path. There is currently no profile-edit UI.

#### Public RPC interface

All five group functions below revoke default public execution and grant execution to the `authenticated` role only.

| RPC | Who may call it | Behavior |
| --- | --- | --- |
| `create_study_group(...)` | Authenticated user | Validates visibility/policy pairing, inserts room, creates owner membership, returns room |
| `request_to_join_room(room_id)` | Authenticated user | Joins open public room or creates/resets pending request for approval room |
| `review_room_join_request(request_id, approve)` | Owner/admin | Approves/rejects request; approval inserts membership |
| `create_room_invite(room_id, expires_at, max_uses)` | Owner/admin | Creates an invitation token and returns it |
| `accept_room_invite(token)` | Authenticated user | Validates revocation, expiry and usage; inserts membership and increments usage once |

`complete_session` is redefined in `0002` to reject restricted/archived rooms unless the caller is a member.

## 8. Free launch, donations, and future pricing

### Current behavior

- All rooms are free. The old `is_premium` restriction is no longer used in page routing or room navigation.
- `NEXT_PUBLIC_PRICING_ENABLED=false` hides the `$` pricing section on the landing page but retains the component and pricing copy in source for later reuse.
- `UpgradeModal` has been repurposed visually into a “Keep the café warm” donation modal; its file name remains legacy.
- `NEXT_PUBLIC_DONATION_URL` controls the external donation action. It is intentionally optional so there is no payment integration or access entitlement change yet.
- Donations must remain voluntary and must not alter membership, plan, or room access.

### Future regional pricing requirements

Before enabling paid plans:

1. Choose a provider that supports the intended India/INR settlement and future international usage.
2. Implement server-side checkout/session creation.
3. Verify payment provider webhooks server-side.
4. Update entitlements only from trusted server-side webhook logic; never from a browser `profiles.update` call.
5. Introduce a pricing configuration keyed by region/currency and payment context, rather than only IP detection.
6. Decide what a paid plan changes. Group privacy/access should not be coupled to a browser-editable `plan` field.
7. Add invoices, refund/cancellation treatment, taxes/GST review, and privacy/terms pages before monetary collection.

## 9. Verification completed so far

### Source checks that passed

- `node_modules/.bin/tsc --noEmit` passed after the group-feature implementation.
- `npm run lint` passed.

### Browser review completed

- The development app was opened at `http://localhost:3000`.
- Landing page was reviewed at desktop and mobile widths.
- The sign-up form, sign-in form, and signed-out redirect to `/login?next=/groups` were reviewed.
- The free-launch section correctly hides the old pricing cards when pricing is disabled.
- The current live page has no room cards because the configured Supabase environment is still the example placeholder.

### Build limitation observed

- The initial production build failed because `next/font/google` could not access Google Fonts. System fonts were substituted afterward.
- A subsequent production build in this environment failed inside Turbopack while trying to create/bind a worker process (`Operation not permitted`). This was an execution-environment limitation, not a TypeScript or ESLint failure. Re-run `npm run build` in a normal local/CI environment before release.

### Not yet verified against a real backend

- Auth sign-up, email confirmation, and sign-in.
- Seeded room data and room cards.
- Timer completion RPC and streak updates.
- Realtime Presence with two accounts.
- Realtime Murmurs with two accounts.
- Public open join.
- Approval request, approval, rejection, and re-entry.
- Private invite creation, acceptance, expiry, usage limits, and revocation.
- RLS behavior for members, outsiders, owners, and admins.

## 10. Known issues, gaps, and release blockers

### P0 — must complete before public launch

1. **Configure Supabase and apply migrations.** The current environment has placeholder credentials. No production feature that depends on Supabase is usable until a real project is configured and migrations `0001` then `0002` are applied.
2. **Add a real donation destination.** Configure `NEXT_PUBLIC_DONATION_URL` after selecting an INR-capable provider. At present no donation can be made.
3. **Perform real multi-account access testing.** The security model is database/RLS-dependent and has not been tested against a deployed Supabase project.
4. **Fix direct `sessions` insert policy.** Migration `0001` retains `users can insert own sessions` with only `auth.uid() = user_id`. A user who knows a restricted room ID can insert their own direct session row for it, bypassing the intended room-access check in `complete_session`. Replace this policy in a follow-up migration with a condition that allows an open room or a real room member only.

### P1 — high-priority before broad adoption

1. **Preserve `next` after sign-up confirmation.** Login preserves a local return path, but sign-up sends all confirmed users to the callback default (`/cafe/main`). A new user following a private invite can lose the invite destination after email confirmation. Validate and preserve a local `next` value in sign-up and callback code.
2. **Validate `next` in the auth callback.** The callback currently concatenates its `next` query value to `origin` without the same local-path validation used by the login page. Centralize validation for both flows.
3. **Complete group management.** Add owner/admin controls to rename/edit group details, archive group, view members, promote/demote admins, remove members, revoke invites, and list active invitations.
4. **Fix admin management visibility.** Database functions support admins, but the café page fetches pending requests only when `room.created_by === user.id`; admins therefore cannot see approval requests in the current UI.
5. **Add requester identity.** The pending-request UI says only “Member request.” Fetch and render requester display name/avatar.
6. **Add invite confirmation.** Visiting a valid invite immediately joins the signed-in visitor. Show group name and a confirm/cancel action first.
7. **Handle errors and loading consistently.** Supabase page queries, realtime subscriptions, clipboard access, session completion, and sign-out mostly lack robust visible failure handling.
8. **Fix timer persistence ordering.** The session-complete overlay is shown before the `complete_session` RPC has succeeded, and RPC errors are ignored. Prevent duplicate completion, await success, and show an error if persistence fails.
9. **Remove invalid nested interactive elements.** Several pages use `Link` around the shared `Button` component, producing `<a><button>…</button></a>`. Use link styling or a dedicated link component for keyboard/accessibility correctness.
10. **Fix mobile navigation overlap.** At a 390px viewport the logo, live-count pill, and join button overlap. Hide/reposition the live pill or use a compact menu at small widths.

### P2 — product quality and credibility

1. Change landing text from “Free forever” to “Free during launch,” because regional pricing is planned later.
2. Do not claim an “Ambient sound engine” until audio files and playback controls exist, or label it “coming soon.”
3. Replace simulated “studying now” and “12,000+ sessions logged” values with real metrics or mark them as illustrative.
4. Replace the hard-coded weekly-session estimate with a real weekly query.
5. Implement social sharing or remove the nonfunctional social chips.
6. Show a useful empty state/error state when rooms cannot load; current landing page leaves a blank rooms grid.
7. Add public group search, filters, capacity/moderation rules, reporting/blocking, and owner notifications if the community grows.
8. Decide whether groups may have custom icons, ambience, tasks/description editing, schedules, and a maximum membership size; the current creation form hard-codes icon `📚` and `cafe_rain`.
9. Decide whether session history needs time-zone-aware “day” logic. Current streak logic uses database `current_date`, which may not match every user’s local day.
10. Replace the legacy `private_rooms` table or formally retire it in a future migration once data migration/compatibility is understood.

## 11. Security and privacy checklist

- Use a real Supabase anon key only in `NEXT_PUBLIC_*`; do not expose Supabase service-role keys to the browser or repository.
- Keep every room-access decision in RLS or a `security definer` function. Client-side redirects are UX, not authorization.
- Apply the follow-up `sessions` RLS fix described above.
- Add `set search_path = public` to any future `security definer` function.
- Keep all future billing entitlements server-controlled.
- Rotate/revoke invites and support expiry/max uses in the management UI; the data model already supports these fields.
- Reconsider public profile visibility as the product grows. It is currently public to support display identity, but only name/avatar fields are needed by the UI.
- Treat invite URLs as bearer credentials: do not include them in analytics, logs, or public previews.
- Add rate limits/abuse controls for Murmurs, group creation, join requests, invites, and sign-up before broad public release.
- Add a privacy policy, terms, and community/moderation rules before collecting a material user base or money.

## 12. Test plan

### Minimum manual matrix

Use at least three separate browser profiles/accounts: **owner**, **member**, and **outsider**.

| Scenario | Expected result |
| --- | --- |
| Signed-out user opens a café room | Redirected to login with a local `next` path |
| User signs in after room redirect | Returned to that room |
| New user confirms email after invite redirect | Must return to invite flow after the P1 fix |
| Create open public group | Creator becomes owner; group appears in discovery; outsider can join immediately |
| Create approval group | Outsider sees request action; cannot enter before approval; owner/admin approves; outsider can then enter |
| Reject approval request | Requester remains unable to enter; status is clear in UI |
| Create private group | Group does not appear in discovery; outsider direct room route is denied |
| Private invite | Valid invite joins user once; invalid, expired, exhausted, or revoked invite is rejected |
| Invite reuse by an existing member | Does not increment use count again |
| Restricted Murmur | Outsider cannot read or insert; member can read and post |
| Restricted session | Outsider cannot insert directly or through RPC after RLS follow-up fix |
| Presence | Two members in same room see each other’s presence and task/status updates |
| Timer completion | Exactly one session persists; streak/today totals update after confirmed RPC success |
| Donation | External link opens the intended provider; no membership/plan changes occur |
| Responsive UI | Verify 320px, 390px, tablet, and desktop widths; no header overlap or inaccessible controls |

### Automated-test roadmap

1. Add a test runner (Vitest for pure hooks/helpers, plus Playwright for browser flows is a reasonable fit).
2. Unit-test timer transitions, reset/pause behavior, and completion de-duplication.
3. Integration-test auth return paths and callback validation.
4. Test all group RPCs in a dedicated Supabase test project.
5. Test RLS as owner/admin/member/outsider/anonymous for every relevant table.
6. Add browser tests for group creation, requests, private invites, landing free-launch mode, and mobile navigation.

## 13. Recommended execution order

1. **Backend foundation:** create/configure Supabase; apply both migrations; validate seeded rooms and Auth callback URLs.
2. **Security pass:** add a migration to restrict direct `sessions` inserts; validate callback destinations; review all `security definer` functions and RLS under real accounts.
3. **End-to-end verification:** execute the manual multi-account matrix above, including Realtime behavior.
4. **Group-management completion:** invite list/revocation, role management, member removal, request identity, edit/archive/leave controls, invite confirmation.
5. **Launch polish:** configure donations; correct “free during launch” copy; remove/implement misleading feature claims; fix mobile navigation and nested links/buttons.
6. **Reliability:** error states, loading states, session completion robustness, observability, automated tests.
7. **Future monetization:** introduce region-aware pricing only after real usage/traction and trusted billing-webhook infrastructure are in place.

## 14. Deployment checklist

- [ ] Real Supabase URL and anon key configured in the deployment environment.
- [ ] `0001_init.sql` and `0002_study_groups.sql` applied exactly once and recorded.
- [ ] Supabase Auth site URL and allowed redirect URLs include production `/auth/callback`.
- [ ] Realtime configuration verified for Murmurs/Presence.
- [ ] `NEXT_PUBLIC_PRICING_ENABLED=false` for free launch.
- [ ] `NEXT_PUBLIC_DONATION_URL` points to the approved provider.
- [ ] Direct-session RLS policy tightened.
- [ ] All P1 auth/group management issues resolved or consciously deferred with user-facing limitations removed.
- [ ] `npm run lint`, TypeScript check, and production build pass in normal CI.
- [ ] Manual multi-account test matrix completed.
- [ ] Error monitoring, privacy policy, terms, and support contact are ready.
- [ ] Next.js middleware-to-proxy migration scheduled/completed.

## 15. Source-of-truth decisions made so far

- **One `rooms` model:** public and private study groups use `rooms`; the old `private_rooms` table is not the active product path.
- **Database-enforced access:** RLS and server-side RPCs own group authorization. UI checks alone are never sufficient.
- **Free launch:** all rooms are free; former dollar pricing is hidden but deliberately retained for future regional pricing.
- **Donations are not entitlements:** a donation supports the product but does not unlock rooms or plans.
- **System fonts:** maintain predictable offline/CI builds; future local font assets can be introduced through the CSS variables.
- **Manual DB types:** `types/database.ts` is manually updated after migrations today. Move to generated Supabase types when backend tooling is established.

