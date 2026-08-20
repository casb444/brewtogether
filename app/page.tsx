import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { isAnonymousUser } from "@/lib/auth/guest";
import { LandingClient } from "./LandingClient";

export default async function LandingPage() {
  if (!isSupabaseConfigured()) {
    return <LandingClient isAuthed={false} isAnonymous={false} rooms={[]} backendReady={false} sessionCount={0} />;
  }

  const supabase = await createClient();
  const [{ data: userData }, { data: rooms }, statsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("rooms").select("*").eq("visibility", "public").is("archived_at", null).order("sort_order"),
    supabase.rpc("public_cafe_stats"),
  ]);

  const sessionCount =
    statsResult.data && typeof statsResult.data === "object" && "completed_sessions" in statsResult.data
      ? Number(statsResult.data.completed_sessions) || 0
      : 0;

  return (
    <LandingClient
      isAuthed={!!userData.user}
      isAnonymous={isAnonymousUser(userData.user)}
      rooms={rooms ?? []}
      backendReady
      sessionCount={sessionCount}
    />
  );
}
