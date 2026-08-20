"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { AuthField, AuthFrame } from "@/components/AuthFrame";
import { ConfigBanner } from "@/components/ConfigBanner";
import { isSupabaseConfigured } from "@/lib/config";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/cafe/main");
    router.refresh();
  }

  return (
    <AuthFrame>
      {!configured && <ConfigBanner />}
      <h1 className="font-display text-2xl text-ink mb-1">Choose a new password</h1>
      <p className="text-sm text-ink-soft mb-6">Use at least 6 characters.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField label="New password" type="password" value={password} onChange={setPassword} placeholder="••••••••" minLength={6} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <Button type="submit" variant="primary" size="lg" disabled={loading || !configured} className="w-full">
          {loading ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthFrame>
  );
}
