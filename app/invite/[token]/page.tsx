import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { InviteGate } from "./AcceptInvite";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isSupabaseConfigured()) {
    return <InviteGate token={token} isSignedIn={false} isAnonymous={false} />;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <InviteGate token={token} isSignedIn={!!user} isAnonymous={user?.is_anonymous === true} />;
}
