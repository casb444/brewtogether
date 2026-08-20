# BrewTogether public-launch implementation plan

> **For agentic workers:** Execute inline in this session. Checkboxes live in `tasks/todo.md`.

**Goal:** Make BrewTogether a complete free-launch product a stranger can use: sign up, sit in a café, run a timer, murmur, create/join groups, and trust the site — without charging money.

**Architecture:** Keep Next.js App Router + Supabase. Add a config gate so missing credentials do not stall the UI. Put authorization in SQL RPCs/RLS. Hide pricing; donations remain an optional external link.

**Tech stack:** Next.js 16.3, React 19, Tailwind v4, Supabase SSR, Vitest for helpers.

## Global constraints

- `NEXT_PUBLIC_PRICING_ENABLED` stays false.
- Donations never change access.
- No service-role key in the browser or repo.
- Next.js 16: async `params`, `error.tsx` uses `retry`, migrate `middleware.ts` → `proxy.ts`.
- System fonts remain (no Google Fonts at build time).

## File map

- Create: `lib/config.ts`, `lib/auth/next-path.ts`, `lib/share.ts`, `lib/audio/ambience.ts`, `lib/session/persist.ts`
- Create: legal/support/auth recovery pages, `app/error.tsx`, `app/not-found.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/opengraph-image.tsx`
- Create: `supabase/migrations/0003_launch_hardening.sql`
- Create: `proxy.ts` (replace middleware)
- Create: Vitest config + `lib/**/*.test.ts`
- Modify: landing, auth, café, groups, invite, Button, hooks, types, docs

## Task order

1. Config gate + proxy + Button-as-link + next-path helper
2. Auth recovery + safe redirects + terms consent
3. SQL 0003 + types
4. Landing honesty + legal pages + empty/error states
5. Café mobile + timer + ambience + share
6. Group management + invite confirm
7. Tests, lint, typecheck, re-run the app
