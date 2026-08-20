"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { AuthField, AuthFrame } from "@/components/AuthFrame";
import { ConfigBanner } from "@/components/ConfigBanner";
import { isSupabaseConfigured } from "@/lib/config";
import { safeNextPath } from "@/lib/auth/next-path";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFrame>Loading…</AuthFrame>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!configured) return;
    if (!agreed) {
      setError("Please accept the terms to join the café.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || "Anonymous" },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthFrame>
        <div className="text-center">
          <div className="text-4xl mb-4">☕</div>
          <h1 className="font-display text-2xl text-ink mb-2">Check your email</h1>
          <p className="text-sm text-ink-soft">
            We sent a confirmation link to <strong>{email}</strong>. After you click it, you&apos;ll return to your seat.
          </p>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      {!configured && <ConfigBanner />}
      <h1 className="font-display text-2xl text-ink mb-1">Find your seat</h1>
      <p className="text-sm text-ink-soft mb-6">Free during launch. Takes about 20 seconds.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField label="Display name" type="text" value={displayName} onChange={setDisplayName} placeholder="How you'll appear to others" maxLength={40} />
        <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <AuthField label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" minLength={6} />
        <label className="flex gap-2 text-xs text-ink-soft items-start">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5" />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-brand underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <Button type="submit" variant="primary" size="lg" disabled={loading || !configured} className="w-full mt-1">
          {loading ? "Creating your seat…" : "Join the café"}
        </Button>
      </form>
      <div className="text-center text-xs text-ink-soft mt-5">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand underline">
          Sign in
        </Link>
      </div>
    </AuthFrame>
  );
}
