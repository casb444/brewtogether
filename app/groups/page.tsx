import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { GroupsClient } from "./GroupsClient";

export default async function GroupsPage() {
  if (!isSupabaseConfigured()) redirect("/login?next=/groups");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/groups");

  const [{ data: publicRooms }, { data: memberships }, { data: requests }] = await Promise.all([
    supabase.from("rooms").select("*").eq("is_system", false).eq("visibility", "public").is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("room_members").select("room_id, role").eq("user_id", user.id),
    supabase.from("room_join_requests").select("id, room_id, status").eq("user_id", user.id),
  ]);

  const memberRoomIds = memberships?.map((member) => member.room_id) ?? [];
  const { data: memberRooms } = memberRoomIds.length
    ? await supabase.from("rooms").select("*").in("id", memberRoomIds).order("created_at", { ascending: false })
    : { data: [] };

  return <GroupsClient publicRooms={publicRooms ?? []} memberRooms={memberRooms ?? []} memberships={memberships ?? []} requests={requests ?? []} />;
}
