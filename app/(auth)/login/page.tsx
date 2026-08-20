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

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFrame>Loading…</AuthFrame>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthFrame>
      {!configured && <ConfigBanner />}
      {searchParams.get("error") === "auth_failed" && (
        <p className="text-xs text-red-600 mb-3">That sign-in link was invalid or expired. Try again.</p>
      )}
      <h1 className="font-display text-2xl text-ink mb-1">Welcome back</h1>
      <p className="text-sm text-ink-soft mb-6">Your seat at the café is waiting.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <AuthField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <Button type="submit" variant="primary" size="lg" disabled={loading || !configured} className="w-full mt-1">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="text-center text-xs text-ink-soft mt-5 space-y-2">
        <div>
          <Link href="/forgot-password" className="text-brand underline">
            Forgot password?
          </Link>
        </div>
        <div>
          New here?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-brand underline">
            Create an account
          </Link>
        </div>
      </div>
    </AuthFrame>
  );
}
