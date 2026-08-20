# BrewTogether public-launch checklist

Evidence from 20 Aug 2026: ran the app, used Chrome at 1280 and 390px, then implemented and re-verified.

## Done in this pass

- [x] Analyse code + run app + screenshot landing/login/signup/mobile
- [x] Stop placeholder-Supabase from stalling every page (home now ~30ms)
- [x] Honest marketing: no fake live count, session totals, “Free forever”, ambient-engine claim, or fake mobile app
- [x] Legal/trust: Privacy, Terms, Community, Support; signup consent
- [x] Auth: safe `next` on login/signup/callback; forgot/reset password; auth errors
- [x] Café: mobile people/murmurs, compact nav, Web Audio ambience, persist after RPC success, breaks not counted
- [x] Groups: invite confirm, requester names, admin approvals, members/roles/leave/archive/revoke, search, icons
- [x] Security: sessions RLS, profile plan lock, murmur rate limit, group RPCs (`0003_launch_hardening.sql`)
- [x] SEO/errors: not-found, error, robots, sitemap, opengraph image, metadata
- [x] Tests, lint, typecheck, production build
- [x] Docs for connecting a real Supabase project

## Operator step before strangers can sign in

Create a Supabase project, apply migrations `0001`–`0003`, set `NEXT_PUBLIC_SUPABASE_*` and `NEXT_PUBLIC_SITE_URL`, add `/auth/callback` to Auth redirect URLs. Optional: `NEXT_PUBLIC_DONATION_URL`. Keep `NEXT_PUBLIC_PRICING_ENABLED=false`.
