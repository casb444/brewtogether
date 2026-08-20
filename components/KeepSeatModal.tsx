"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { AuthField } from "@/components/AuthFrame";

export function KeepSeatModal({
  open,
  onClose,
  nextPath = "/groups",
}: {
  open: boolean;
  onClose: () => void;
  nextPath?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  async function keepSeat(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` }
    );
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-[350] bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-parchment border border-border rounded-2xl p-8 max-w-[380px] w-full shadow-2xl">
        {sent ? (
          <>
            <h2 className="font-display text-2xl text-ink mb-2">Check your email</h2>
            <p className="text-sm text-ink-soft mb-6">
              Confirm the link we sent to keep this guest seat as a member. New murmurs after that won’t carry the anonymous tag.
            </p>
            <Button variant="primary" className="w-full" onClick={onClose}>
              Back to the group
            </Button>
          </>
        ) : (
          <form onSubmit={keepSeat} className="space-y-3">
            <h2 className="font-display text-2xl text-ink mb-1">Keep this seat</h2>
            <p className="text-sm text-ink-soft mb-4">
              Attach an email to become a member. You’ll stay in this group with the same nick.
            </p>
            <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" variant="primary" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send confirmation"}
            </Button>
            <button type="button" className="w-full text-xs text-ink-muted underline" onClick={onClose}>
              Not now
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
