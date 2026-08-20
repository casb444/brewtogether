# BrewTogether

A virtual study café — real accounts, live presence, Pomodoro streaks, Murmurs, and public/private study groups. Built with Next.js (App Router) and Supabase. **Free during launch.** Paid plans stay off until there is real traction.

For architecture, migrations, and the remaining operator checklist, read [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md). Day-to-day notes: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** — Postgres, Auth, Realtime
- **Vercel** (recommended host)

## 1. Create the Supabase project

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `0002_study_groups.sql`, then `0003_launch_hardening.sql`.
3. Enable email/password auth. Add redirect URLs for `/auth/callback` (local and production).
4. Copy the project URL and anon public key. Never put a service-role key in this app.

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PRICING_ENABLED=false
NEXT_PUBLIC_DONATION_URL=
```

Without real Supabase values the public marketing pages still load; sign-in and rooms wait until the backend is connected.

## 3. Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000. Sign up, enter a café, start a timer, post a Murmur. Use a second browser profile to see live presence.

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## 4. Deploy

```bash
npx vercel
```

Set the `NEXT_PUBLIC_*` variables in the host. Keep pricing disabled. Set `NEXT_PUBLIC_DONATION_URL` only after you have an external INR-capable donation page. Donations must not change room access.

## Product surface

- `/` marketing + public rooms
- `/signup`, `/login`, `/forgot-password`, `/reset-password`
- `/cafe/[roomId]` timer, presence, Murmurs, ambience
- `/groups` discover and create study groups
- `/invite/[token]` confirm-then-join
- `/privacy`, `/terms`, `/community`, `/support`

## Monetization (later)

The café launches free. The old dollar pricing UI is hidden behind `NEXT_PUBLIC_PRICING_ENABLED`. When you do charge, add a provider with trusted webhooks and never let the browser write `profiles.plan`.
