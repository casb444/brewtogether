"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";

type InvitePreview = { room_id: string; name: string; icon: string; description: string; visibility: string };

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient()
      .rpc("preview_room_invite", { p_token: token })
      .then(({ data, error: previewError }) => {
        if (previewError || !data) setError(previewError?.message ?? "This invite is invalid.");
        else setPreview(data);
      });
  }, [token]);

  async function join() {
    setBusy(true);
    const { data, error: acceptError } = await createClient().rpc("accept_room_invite", { p_token: token });
    if (acceptError || !data) {
      setBusy(false);
      setError(acceptError?.message ?? "This invite is invalid.");
      return;
    }
    router.replace(`/cafe/${data}`);
  }

  return (
    <main className="min-h-screen bg-parchment flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-3">{preview?.icon ?? "☕"}</div>
        <h1 className="font-display text-2xl text-ink">
          {error ? "Invite unavailable" : preview ? `Join ${preview.name}?` : "Checking your invite…"}
        </h1>
        <p className="text-sm text-ink-soft mt-2">{error ?? preview?.description ?? "One moment while we look up this group."}</p>
        {preview && !error && (
          <div className="flex gap-2 justify-center mt-6">
            <Button variant="primary" onClick={join} disabled={busy}>
              {busy ? "Joining…" : "Join group"}
            </Button>
            <Button href="/groups">Cancel</Button>
          </div>
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
