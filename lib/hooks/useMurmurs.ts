"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Murmur } from "@/types/database";

const MAX_VISIBLE = 8;

export function useMurmurs(roomId: string, userId: string | null, displayName: string) {
  const [murmurs, setMurmurs] = useState<Murmur[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      const { data, error: loadError } = await supabase
        .from("murmurs")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(MAX_VISIBLE);
      if (cancelled) return;
      if (loadError) setError(loadError.message);
      else if (data) setMurmurs(data.reverse());
    }
    loadInitial();

    const channel = supabase
      .channel(`murmurs:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "murmurs", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMurmurs((prev) => [...prev, payload.new as Murmur].slice(-MAX_VISIBLE));
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") setError("Live murmurs are unavailable right now.");
      });

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [roomId, supabase]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim().slice(0, 90);
      if (!trimmed || !userId) return;
      const { error: insertError } = await supabase.from("murmurs").insert({
        user_id: userId,
        room_id: roomId,
        display_name: displayName,
        text: trimmed,
      });
      if (insertError) setError(insertError.message);
      else setError(null);
    },
    [roomId, userId, displayName, supabase]
  );

  return { murmurs, send, error };
}
