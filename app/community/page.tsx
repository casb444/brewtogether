import { LegalShell } from "@/components/LegalShell";

export const metadata = { title: "Community Guidelines — BrewTogether" };

export default function CommunityPage() {
  return (
    <LegalShell title="Community Guidelines" updated="20 August 2026">
      <p>The café works when strangers can sit nearby without bracing for a conversation. Keep that promise.</p>
      <h2 className="font-display text-xl text-ink pt-2">Be a quiet neighbor</h2>
      <p>
        Presence is the product. Share a real task if you want accountability. Do not use the task field for insults,
        spam, or personal data you would not say out loud in a library.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Murmurs are not a chat</h2>
      <p>One line, no threads, no pile-ons. If you would not whisper it, do not post it.</p>
      <h2 className="font-display text-xl text-ink pt-2">Study groups</h2>
      <p>
        Owners and admins should approve people they are willing to sit with. Remove members who harass others. Do not
        create groups to target or exclude people based on protected characteristics.
      </p>
      <h2 className="font-display text-xl text-ink pt-2">Report harm</h2>
      <p>
        If someone is abusive, email{" "}
        <a className="text-brand underline" href="mailto:hi@brewtogether.app">
          hi@brewtogether.app
        </a>{" "}
        with the room, display name, and what happened. We will review and may remove content or accounts.
      </p>
    </LegalShell>
  );
}
