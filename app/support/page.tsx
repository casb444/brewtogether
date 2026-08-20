import { LegalShell } from "@/components/LegalShell";

export const metadata = { title: "Support — BrewTogether" };

export default function SupportPage() {
  return (
    <LegalShell title="Support" updated="20 August 2026">
      <p>
        For account help, abuse reports, or privacy requests, email{" "}
        <a className="text-brand underline" href="mailto:hi@brewtogether.app">
          hi@brewtogether.app
        </a>
        .
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Using the café</h2>
      <p>Create an account, pick a room, type what you are working on, and start a timer. Murmurs are optional.</p>
      <p>
        Study groups can be open, approval-only, or private. Private groups need an invite from an owner or admin. Visiting
        an invite link will ask you to confirm before you join.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Operators: connecting Supabase</h2>
      <p>
        Public launch needs a real Supabase project. Copy <code className="text-ink">.env.local.example</code> to{" "}
        <code className="text-ink">.env.local</code>, add the project URL and anon key, and apply migrations{" "}
        <code className="text-ink">0001_init.sql</code>, <code className="text-ink">0002_study_groups.sql</code>, then{" "}
        <code className="text-ink">0003_launch_hardening.sql</code> in that order. Add{" "}
        <code className="text-ink">http://localhost:3000/auth/callback</code> and your production callback URL in Supabase
        Auth redirect settings.
      </p>
      <p>
        Keep <code className="text-ink">NEXT_PUBLIC_PRICING_ENABLED=false</code> until you are ready to charge. Set{" "}
        <code className="text-ink">NEXT_PUBLIC_DONATION_URL</code> only after you have an external donation page. Donations
        must not unlock rooms.
      </p>
    </LegalShell>
  );
}
