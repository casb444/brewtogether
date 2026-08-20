"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { AuthField } from "@/components/AuthFrame";
import { KeepSeatModal } from "@/components/KeepSeatModal";
import { normalizeGuestNickname } from "@/lib/auth/guest";

type InvitePreview = { room_id: string; name: string; icon: string; description: string; visibility: string };
type Step = "choose" | "nick";

export function InviteGate({
  token,
  isSignedIn,
  isAnonymous,
}: {
  token: string;
  isSignedIn: boolean;
  isAnonymous: boolean;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [nickname, setNickname] = useState("");
  const [keepSeatOpen, setKeepSeatOpen] = useState(false);

  useEffect(() => {
    createClient()
      .rpc("preview_room_invite", { p_token: token })
      .then(({ data, error: previewError }) => {
        if (previewError || !data) setError(previewError?.message ?? "This invite is invalid.");
        else setPreview(data);
      });
  }, [token]);

  async function acceptAsCurrentUser() {
    setBusy(true);
    const { data, error: acceptError } = await createClient().rpc("accept_room_invite", { p_token: token });
    if (acceptError || !data) {
      setBusy(false);
      setError(acceptError?.message ?? "This invite is invalid.");
      return;
    }
    router.replace(`/cafe/${data}`);
    router.refresh();
  }

  async function joinAsGuest(event: FormEvent) {
    event.preventDefault();
    const name = normalizeGuestNickname(nickname);
    if (!name) {
      setError("Choose a display name to sit as a guest.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously({
      options: { data: { display_name: name } },
    });
    if (anonError || !anonData.user) {
      setBusy(false);
      setError(anonError?.message ?? "Could not start a guest seat.");
      return;
    }
    await supabase.from("profiles").update({ display_name: name }).eq("id", anonData.user.id);
    const { data, error: acceptError } = await supabase.rpc("accept_room_invite", { p_token: token });
    if (acceptError || !data) {
      await supabase.auth.signOut();
      setBusy(false);
      setError(acceptError?.message ?? "This invite is invalid.");
      return;
    }
    router.replace(`/cafe/${data}`);
    router.refresh();
  }

  const heading = error ? "Invite unavailable" : preview ? `Join ${preview.name}?` : "Checking your invite…";

  return (
    <main className="min-h-screen bg-parchment flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-4xl mb-3">{preview?.icon ?? "☕"}</div>
        <h1 className="font-display text-2xl text-ink">{heading}</h1>
        <p className="text-sm text-ink-soft mt-2">{error ?? preview?.description ?? "One moment while we look up this group."}</p>

        {preview && !error && isSignedIn && (
          <div className="mt-6 space-y-3">
            <div className="flex gap-2 justify-center">
              <Button variant="primary" onClick={acceptAsCurrentUser} disabled={busy}>
                {busy ? "Joining…" : isAnonymous ? "Enter as guest" : "Join group"}
              </Button>
              {isAnonymous ? (
                <Button onClick={() => setKeepSeatOpen(true)}>Keep this seat</Button>
              ) : (
                <Button href="/groups">Cancel</Button>
              )}
            </div>
            {isAnonymous && (
              <p className="text-xs text-ink-muted">
                Guest seats are for one group. Attach an email to join more, or{" "}
                <button
                  type="button"
                  className="text-brand underline"
                  onClick={async () => {
                    await createClient().auth.signOut();
                    router.push(`/signup?next=${encodeURIComponent(`/invite/${token}`)}`);
                    router.refresh();
                  }}
                >
                  start a member account
                </button>
                .
              </p>
            )}
            <KeepSeatModal
              open={keepSeatOpen}
              onClose={() => setKeepSeatOpen(false)}
              nextPath={`/invite/${token}`}
            />
          </div>
        )}

        {preview && !error && !isSignedIn && step === "choose" && (
          <div className="flex flex-col gap-2 mt-6">
            <Button variant="primary" onClick={() => setStep("nick")}>
              Explore as guest
            </Button>
            <Button href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}>Become a member</Button>
            <p className="text-xs text-ink-muted">
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} className="text-brand underline">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {preview && !error && !isSignedIn && step === "nick" && (
          <form onSubmit={joinAsGuest} className="text-left mt-6 space-y-3">
            <AuthField
              label="Display name"
              type="text"
              value={nickname}
              onChange={setNickname}
              placeholder="How you'll appear in this group"
              maxLength={40}
            />
            <p className="text-xs text-ink-muted">
              Guests only sit in this group. Signing out without attaching an email loses this seat.
            </p>
            <Button type="submit" variant="primary" className="w-full" disabled={busy}>
              {busy ? "Joining…" : "Enter as guest"}
            </Button>
            <button type="button" className="w-full text-xs text-ink-muted underline" onClick={() => setStep("choose")}>
              Back
            </button>
          </form>
        )}

        {error && (
          <Link href="/groups" className="inline-block mt-6 text-sm text-brand underline">
            Back to study groups
          </Link>
        )}
      </div>
    </main>
  );
}
