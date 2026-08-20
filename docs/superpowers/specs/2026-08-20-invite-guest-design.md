# Invite guest seats

**Date:** 20 August 2026  
**Status:** Approved

## Intent

Shared group invites can be used without an email account. Guest access exists only on `/invite/...`, only for that group, and is labeled as anonymous in the room. Becoming a member is the existing email sign-in / sign-up flow.

## Invite page (logged out)

A valid invite shows the group, then two choices:

1. **Explore as guest** — ask for a display / nick name (1–40 characters, trimmed). Warn that signing out without attaching an email loses the seat. Then create an anonymous Auth user and accept the invite in the same action.
2. **Become a member** — `/login` or `/signup` with `next=/invite/{token}`, then the current join confirmation.

Logged-in members keep today’s join confirmation. Logged-in guests may enter a group they already belong to; they cannot join a second group until they convert.

## Guest in the café

- Timer, presence, and murmurs work in the invited group only.
- Public café rooms, creating groups, and joining other rooms are blocked (`is_anonymous` JWT claim).
- Presence and murmurs show the nick plus a persistent **anonymous** tag (`murmurs.is_guest`). After convert, new murmurs are untagged; old guest murmurs keep the tag.
- **Keep this seat** in the group attaches an email to the same user id.

## Data hygiene

- Do not create an Auth user until they confirm guest join.
- `cleanup_abandoned_guests()` deletes anonymous users with no `room_members` row after 1 hour (profiles/streaks cascade). Call it from invite preview/accept so orphans do not pile up.
- Enabling Anonymous Sign-Ins is required in the Supabase Auth providers dashboard. RLS still makes invite-less anonymous users unable to sit in public rooms.

## Out of scope

Pricing, CAPTCHA, automatic 30-day deletion of *active* guests, OAuth linking.
