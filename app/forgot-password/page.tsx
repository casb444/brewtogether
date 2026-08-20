"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { AuthField, AuthFrame } from "@/components/AuthFrame";
import { ConfigBanner } from "@/components/ConfigBanner";
import { isSupabaseConfigured } from "@/lib/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthFrame>
      {!configured && <ConfigBanner />}
      <h1 className="font-display text-2xl text-ink mb-1">Reset your password</h1>
      <p className="text-sm text-ink-soft mb-6">We&apos;ll email a link so you can choose a new one.</p>
      {sent ? (
        <p className="text-sm text-ink-soft">If an account exists for {email}, a reset link is on its way.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          {error && <div className="text-xs text-red-600">{error}</div>}
          <Button type="submit" variant="primary" size="lg" disabled={loading || !configured} className="w-full">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <div className="text-center text-xs text-ink-soft mt-5">
        <Link href="/login" className="text-brand underline">
          Back to sign in
        </Link>
      </div>
    </AuthFrame>
  );
}
