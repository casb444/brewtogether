import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { CafeClient } from "./CafeClient";
import { canUseCafeRoom, isAnonymousUser } from "@/lib/auth/guest";

export default async function CafePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!isSupabaseConfigured()) redirect("/login?next=/cafe/" + roomId);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/cafe/${roomId}`);

  const guest = isAnonymousUser(user);
  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room) redirect(guest ? "/groups" : "/cafe/main");

  const { data: membership } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!canUseCafeRoom({ isAnonymous: guest, isMember: !!membership, joinPolicy: room.join_policy })) {
    redirect("/groups");
  }

  const canManage = membership?.role === "owner" || membership?.role === "admin";

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: streak } = await supabase.from("streaks").select("*").eq("user_id", user.id).single();
  const { data: allRooms } = guest
    ? await supabase.from("rooms").select("*").eq("id", room.id).is("archived_at", null)
    : await supabase.from("rooms").select("*").is("archived_at", null).order("sort_order");

  const { data: pendingRequests } = canManage
    ? await supabase.from("room_join_requests").select("id, user_id").eq("room_id", room.id).eq("status", "pending")
    : { data: [] };

  const requesterIds = pendingRequests?.map((request) => request.user_id) ?? [];
  const { data: requesterProfiles } = requesterIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", requesterIds)
    : { data: [] };

  const namedRequests = (pendingRequests ?? []).map((request) => ({
    id: request.id,
    user_id: request.user_id,
    display_name: requesterProfiles?.find((profileRow) => profileRow.id === request.user_id)?.display_name ?? "Member",
  }));

  return (
    <CafeClient
      room={room}
      allRooms={allRooms ?? []}
      userId={user.id}
      profile={profile ?? { id: user.id, display_name: "Anonymous", avatar_seed: user.id, plan: "free", created_at: "" }}
      initialStreak={streak}
      pendingRequests={namedRequests}
      canManage={canManage}
      isOwner={membership?.role === "owner" || room.created_by === user.id}
      isAnonymous={guest}
    />
  );
}
