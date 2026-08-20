import { LegalShell } from "@/components/LegalShell";

export const metadata = { title: "Terms of Use — BrewTogether" };

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Use" updated="20 August 2026">
      <p>
        By creating an account or using BrewTogether, you agree to these terms. If you do not agree, do not use the café.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">The service</h2>
      <p>
        BrewTogether is a virtual study space: public café rooms, optional study groups, a Pomodoro-style timer, live
        presence, and short Murmurs. It is provided as-is during launch, without a guaranteed uptime or academic outcome.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Your account</h2>
      <p>
        You must provide a valid email and keep your password secret. You are responsible for activity on your account.
        Display names must not impersonate others or include illegal content.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Acceptable use</h2>
      <p>
        Do not harass others, spam Murmurs, scrape the service, attempt to bypass room access, share others&apos; private
        invite links without permission, or use the café to break the law. We may remove content, revoke invites, or suspend
        accounts that harm the community.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Groups and invites</h2>
      <p>
        Group owners are responsible for who they admit. Invite links work like keys. Expired, revoked, or exhausted invites
        will not admit new members.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Free launch and donations</h2>
      <p>
        Access is free during launch. Optional donations do not purchase membership, private rooms, or any entitlement. Paid
        plans, if introduced later, will have separate pricing terms.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Limitation of liability</h2>
      <p>
        To the fullest extent allowed by law, BrewTogether is not liable for lost study time, lost data, or indirect damages
        arising from use of the café. The service may change or pause.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Contact</h2>
      <p>
        Questions:{" "}
        <a className="text-brand underline" href="mailto:hi@brewtogether.app">
          hi@brewtogether.app
        </a>
        .
      </p>
    </LegalShell>
  );
}
