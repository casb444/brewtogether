import { LegalShell } from "@/components/LegalShell";

export const metadata = { title: "Privacy Policy — BrewTogether" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="20 August 2026">
      <p>
        BrewTogether is a virtual study café. This policy explains what we collect so people can sit in a room together,
        keep a streak, and post short Murmurs.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">What we collect</h2>
      <p>Account data: email address, password (stored by our auth provider), and the display name you choose.</p>
      <p>
        Café data: rooms you join, completed focus sessions, streak totals, Murmurs you post, and study-group membership,
        join requests, and invites you create or accept.
      </p>
      <p>
        Presence (who is in a room, current task, and focus/break status) is shown live to other people in that room. It is
        not stored as a permanent history after you leave.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">How we use it</h2>
      <p>
        We use this information to run the café: sign you in, enforce room access, show presence, keep streaks honest, and
        operate study groups. We do not sell personal information. We do not use Murmurs or tasks to train public AI models.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Who can see what</h2>
      <p>
        Display names, avatars, tasks, and Murmurs in a room are visible to people who can enter that room. Invite links are
        secrets — anyone with a valid link may join. Do not post invite URLs in public places you do not trust.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Processors</h2>
      <p>
        We host the product on standard web infrastructure and use Supabase for authentication, database, and realtime
        features. Those providers process data on our behalf to keep the café running.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Retention and your choices</h2>
      <p>
        You can sign out at any time. To correct your display name or delete your account, email{" "}
        <a className="text-brand underline" href="mailto:hi@brewtogether.app">
          hi@brewtogether.app
        </a>
        . We will delete or anonymize account data unless we must keep a record of abuse.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Donations and future payments</h2>
      <p>
        The café is free during launch. Optional donations, if offered, go through an external provider and do not change
        room access. If paid plans are introduced later, we will update this policy before collecting payment details.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Contact</h2>
      <p>
        Privacy questions:{" "}
        <a className="text-brand underline" href="mailto:hi@brewtogether.app">
          hi@brewtogether.app
        </a>
        .
      </p>
    </LegalShell>
  );
}
