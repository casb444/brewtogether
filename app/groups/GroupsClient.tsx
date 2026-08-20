"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/types/database";

type Membership = { room_id: string; role: "owner" | "admin" | "member" };
type JoinRequest = { id: string; room_id: string; status: "pending" | "approved" | "rejected" | "cancelled" };

const ICONS = ["📚", "☕", "🧠", "🌙", "✏️", "💻"];

export function GroupsClient({
  publicRooms,
  memberRooms,
  memberships,
  requests,
  isGuest = false,
}: {
  publicRooms: Room[];
  memberRooms: Room[];
  memberships: Membership[];
  requests: JoinRequest[];
  isGuest?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📚");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [approval, setApproval] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const memberIds = new Set(memberships.map((membership) => membership.room_id));
  const requestByRoom = new Map(requests.map((request) => [request.room_id, request.status]));
  const visibleRooms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return publicRooms;
    return publicRooms.filter(
      (room) => room.name.toLowerCase().includes(needle) || room.description.toLowerCase().includes(needle)
    );
  }, [publicRooms, query]);

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("create_study_group", {
      p_name: name,
      p_description: description,
      p_icon: icon,
      p_default_ambience: "cafe_rain",
      p_visibility: visibility,
      p_join_policy: visibility === "private" ? "invite_only" : approval ? "approval_required" : "open",
    });
    setBusy(false);
    if (error || !data) {
      setMessage(error?.message ?? "Could not create the group.");
      return;
    }
    router.push(`/cafe/${data.id}`);
    router.refresh();
  }

  async function join(roomId: string) {
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("request_to_join_room", { p_room_id: roomId });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data === "joined") router.push(`/cafe/${roomId}`);
    else {
      setMessage("Request sent. The group owner will let you know when you are in.");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-5 py-10 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link href="/" className="font-display italic text-xl text-ink">
            brew<span className="text-brand not-italic">together</span>
          </Link>
          {!isGuest && (
            <Button href="/cafe/main" size="sm">
              Main café
            </Button>
          )}
        </div>
        <div className={`grid gap-10 ${isGuest ? "" : "lg:grid-cols-[1fr_360px]"}`}>
          <section>
            <p className="text-[11px] uppercase tracking-wider text-brand font-semibold mb-3">Study groups</p>
            <h1 className="font-display text-4xl text-ink mb-3">
              {isGuest ? "Your invited group" : "Find your people, keep your focus"}
            </h1>
            <p className="text-ink-soft text-sm leading-relaxed mb-6">
              {isGuest
                ? "You're exploring as a guest in the group you were invited to. Become a member from inside the group to join the public café or start a group of your own."
                : "Open groups welcome anyone. Approval groups let the host curate attendance. Private groups are accessible only with an invite."}
            </p>
            {!isGuest && (
              <>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search public groups"
                  className="w-full mb-6 rounded-lg border border-border bg-cream p-2.5 text-sm"
                />
                <h2 className="font-display text-2xl text-ink mb-4">Discover public groups</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {visibleRooms.map((room) => (
                    <article key={room.id} className="border border-border rounded-2xl p-5 bg-cream">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-2xl">{room.icon}</span>
                        <span className="text-[10px] uppercase font-semibold text-brand bg-brand-light rounded-full px-2 py-1">
                          {room.join_policy === "open" ? "Open" : "Approval"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-ink mt-4">{room.name}</h3>
                      <p className="text-xs text-ink-soft mt-1 min-h-9">{room.description}</p>
                      {memberIds.has(room.id) ? (
                        <Button href={`/cafe/${room.id}`} className="w-full mt-4" variant="primary">
                          Enter group
                        </Button>
                      ) : requestByRoom.get(room.id) === "pending" ? (
                        <Button className="w-full mt-4" disabled>
                          Request pending
                        </Button>
                      ) : (
                        <Button className="w-full mt-4" onClick={() => join(room.id)} disabled={busy}>
                          {room.join_policy === "open" ? "Join group" : "Request to join"}
                        </Button>
                      )}
                    </article>
                  ))}
                  {!visibleRooms.length && (
                    <p className="text-sm text-ink-muted">No public groups match that search. Start the first one.</p>
                  )}
                </div>
              </>
            )}
            {memberRooms.length > 0 && (
              <>
                <h2 className={`font-display text-2xl text-ink mb-4 ${isGuest ? "" : "mt-10"}`}>
                  {isGuest ? "Your group" : "Your groups"}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {memberRooms.map((room) => (
                    <Link key={room.id} href={`/cafe/${room.id}`} className="border border-border rounded-xl px-4 py-3 bg-cream hover:border-brand">
                      <span className="mr-2">{room.icon}</span>
                      <span className="text-sm font-medium">{room.name}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {isGuest && memberRooms.length === 0 && (
              <p className="text-sm text-ink-muted">This guest seat is no longer attached to a group. Ask for a fresh invite.</p>
            )}
          </section>
          {!isGuest && (
            <aside className="bg-cream border border-border rounded-2xl p-6 h-fit">
              <p className="text-[11px] uppercase tracking-wider text-brand font-semibold mb-2">Create</p>
              <h2 className="font-display text-2xl text-ink mb-5">Start a study group</h2>
              <form onSubmit={createGroup} className="space-y-4">
                <label className="block text-xs text-ink-soft">
                  Group name
                  <input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-parchment p-2.5 text-sm" placeholder="Monday exam prep" />
                </label>
                <label className="block text-xs text-ink-soft">
                  Description
                  <textarea maxLength={180} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-parchment p-2.5 text-sm resize-none" rows={3} placeholder="What are you studying together?" />
                </label>
                <div className="text-xs text-ink-soft">
                  Icon
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {ICONS.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setIcon(item)}
                        className={`w-10 h-10 rounded-lg border ${icon === item ? "border-brand bg-brand-light" : "border-border"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-xs text-ink-soft">
                  Who can find it?
                  <select value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")} className="mt-1.5 w-full rounded-lg border border-border bg-parchment p-2.5 text-sm">
                    <option value="public">Public — visible to everyone</option>
                    <option value="private">Private — invite only</option>
                  </select>
                </label>
                {visibility === "public" && (
                  <label className="flex gap-2 text-xs text-ink-soft items-start">
                    <input type="checkbox" checked={approval} onChange={(event) => setApproval(event.target.checked)} className="mt-0.5" />
                    Require my approval before someone joins
                  </label>
                )}
                {visibility === "private" && <p className="text-xs text-ink-muted">You&apos;ll create an invite link after the room is made.</p>}
                {message && <p className="text-xs text-brand">{message}</p>}
                <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : "Create group"}
                </Button>
              </form>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
