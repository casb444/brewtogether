"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SHARE_LABELS, shareLinks } from "@/lib/share";
import { Button } from "./Button";
import { Modal } from "./Modal";
import type { Room } from "@/types/database";

type Member = { user_id: string; role: "owner" | "admin" | "member"; display_name: string };
type Invite = { id: string; token: string; uses: number; max_uses: number | null; expires_at: string | null; revoked_at: string | null };
type Request = { id: string; user_id: string; display_name: string };

export function GroupManageModal({
  open,
  onClose,
  room,
  userId,
  canManage,
  isOwner,
  pendingRequests,
  onReviewed,
  showToast,
}: {
  open: boolean;
  onClose: () => void;
  room: Room;
  userId: string;
  canManage: boolean;
  isOwner: boolean;
  pendingRequests: Request[];
  onReviewed: (id: string) => void;
  showToast: (message: string) => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busy, setBusy] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://brewtogether.app";
  const links = shareLinks(shareUrl, `Study with me in ${room.name} on BrewTogether`);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data: memberRows } = await supabase.from("room_members").select("user_id, role").eq("room_id", room.id);
      const ids = memberRows?.map((row) => row.user_id) ?? [];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, display_name").in("id", ids)
        : { data: [] };
      if (!cancelled) {
        setMembers(
          (memberRows ?? []).map((row) => ({
            ...row,
            display_name: profiles?.find((profile) => profile.id === row.user_id)?.display_name ?? "Member",
          }))
        );
      }
      if (canManage) {
        const { data: inviteRows } = await supabase
          .from("room_invites")
          .select("id, token, uses, max_uses, expires_at, revoked_at")
          .eq("room_id", room.id)
          .is("revoked_at", null)
          .order("created_at", { ascending: false });
        if (!cancelled) setInvites(inviteRows ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, room, canManage, supabase]);

  async function copyShareLink() {
    await navigator.clipboard?.writeText(shareUrl);
    showToast("Link copied");
  }

  async function createInvite() {
    setBusy(true);
    const { data, error } = await supabase.rpc("create_room_invite", { p_room_id: room.id });
    setBusy(false);
    if (error || !data) {
      showToast(error?.message ?? "Could not create an invite.");
      return;
    }
    const url = `${window.location.origin}/invite/${data.token}`;
    await navigator.clipboard?.writeText(url);
    setInvites((current) => [data, ...current]);
    showToast("Private invite copied");
  }

  async function revoke(id: string) {
    const { error } = await supabase.rpc("revoke_room_invite", { p_invite_id: id });
    if (error) {
      showToast(error.message);
      return;
    }
    setInvites((current) => current.filter((invite) => invite.id !== id));
    showToast("Invite revoked");
  }

  async function saveDetails() {
    setBusy(true);
    const { error } = await supabase.rpc("update_study_group", {
      p_room_id: room.id,
      p_name: name,
      p_description: description,
      p_icon: room.icon,
      p_default_ambience: room.default_ambience,
    });
    setBusy(false);
    if (error) showToast(error.message);
    else {
      showToast("Group updated");
      router.refresh();
    }
  }

  async function review(id: string, approve: boolean) {
    const { error } = await supabase.rpc("review_room_join_request", { p_request_id: id, p_approve: approve });
    if (error) {
      showToast(error.message);
      return;
    }
    onReviewed(id);
    showToast(approve ? "Member approved" : "Request declined");
    router.refresh();
  }

  async function setRole(userIdToChange: string, role: "admin" | "member") {
    const { error } = await supabase.rpc("set_room_member_role", { p_room_id: room.id, p_user_id: userIdToChange, p_role: role });
    if (error) showToast(error.message);
    else {
      setMembers((current) => current.map((member) => (member.user_id === userIdToChange ? { ...member, role } : member)));
      showToast("Role updated");
    }
  }

  async function remove(userIdToRemove: string) {
    const { error } = await supabase.rpc("remove_room_member", { p_room_id: room.id, p_user_id: userIdToRemove });
    if (error) showToast(error.message);
    else {
      setMembers((current) => current.filter((member) => member.user_id !== userIdToRemove));
      showToast("Member removed");
    }
  }

  async function leave() {
    const { error } = await supabase.rpc("leave_study_group", { p_room_id: room.id });
    if (error) showToast(error.message);
    else router.push("/groups");
  }

  async function archive() {
    const { error } = await supabase.rpc("archive_study_group", { p_room_id: room.id });
    if (error) showToast(error.message);
    else router.push("/groups");
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="460px">
      <div className="font-display text-xl text-ink mb-1.5">{canManage ? "Manage your study group" : "Invite someone to study"}</div>
      <p className="text-sm text-ink-soft mb-5">
        {room.visibility === "private"
          ? "Private groups can only be joined with a valid invite."
          : "Share this room with someone who would like to study alongside you."}
      </p>
      <div className="flex gap-2 mb-4">
        <input readOnly value={shareUrl} className="flex-1 px-3 py-2 rounded-lg border border-border bg-cream2 text-xs text-ink-soft outline-none" />
        <Button variant="primary" onClick={copyShareLink}>
          Copy link
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap mb-5">
        {SHARE_LABELS.map((chip) => (
          <a
            key={chip.id}
            href={links[chip.id]}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-full border border-border text-sm bg-cream2 text-ink-mid hover:bg-brand-light hover:border-brand hover:text-brand transition-colors"
          >
            {chip.label}
          </a>
        ))}
      </div>

      {canManage && !room.is_system && (
        <div className="space-y-3 border-t border-border pt-4 mb-4">
          <label className="block text-xs text-ink-soft">
            Group name
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-parchment p-2.5 text-sm" />
          </label>
          <label className="block text-xs text-ink-soft">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-border bg-parchment p-2.5 text-sm resize-none" />
          </label>
          <Button onClick={saveDetails} disabled={busy} className="w-full">
            Save details
          </Button>
        </div>
      )}

      {(room.visibility === "private" || canManage) && canManage && (
        <div className="border-t border-border pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-ink-muted">Invites</div>
            <Button size="sm" variant="outline" onClick={createInvite} disabled={busy}>
              Create invite
            </Button>
          </div>
          {invites.length === 0 ? (
            <p className="text-xs text-ink-muted">No active invites.</p>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-2 py-2 text-xs text-ink-soft">
                <span className="truncate">
                  {invite.uses}
                  {invite.max_uses ? `/${invite.max_uses}` : ""} uses
                </span>
                <Button size="sm" onClick={() => revoke(invite.id)}>
                  Revoke
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {canManage && room.join_policy === "approval_required" && (
        <div className="border-t border-border pt-4 mb-4">
          <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">Pending requests</div>
          {pendingRequests.length ? (
            pendingRequests.map((request) => (
              <div key={request.id} className="flex justify-between items-center gap-2 py-2 text-xs text-ink-soft">
                <span>{request.display_name}</span>
                <span className="flex gap-1">
                  <Button size="sm" variant="primary" onClick={() => review(request.id, true)}>
                    Approve
                  </Button>
                  <Button size="sm" onClick={() => review(request.id, false)}>
                    Decline
                  </Button>
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-ink-muted">No pending requests.</p>
          )}
        </div>
      )}

      {canManage && (
        <div className="border-t border-border pt-4 mb-4">
          <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">Members</div>
          {members.map((member) => (
            <div key={member.user_id} className="flex justify-between items-center gap-2 py-2 text-xs text-ink-soft">
              <span>
                {member.display_name}
                {member.user_id === userId ? " (you)" : ""} · {member.role}
              </span>
              {isOwner && member.role !== "owner" && member.user_id !== userId && (
                <span className="flex gap-1">
                  {member.role === "member" ? (
                    <Button size="sm" onClick={() => setRole(member.user_id, "admin")}>
                      Make admin
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setRole(member.user_id, "member")}>
                      Make member
                    </Button>
                  )}
                  <Button size="sm" onClick={() => remove(member.user_id)}>
                    Remove
                  </Button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!room.is_system && (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={leave}>
            Leave group
          </Button>
          {isOwner && (
            <Button className="flex-1" onClick={archive}>
              Archive
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
