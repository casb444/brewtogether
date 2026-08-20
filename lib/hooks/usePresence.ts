"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PresenceState } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UsePresenceOptions {
  roomId: string;
  myId: string;
  myDisplayName: string;
  myAvatarSeed: string;
}

/**
 * Tracks who is currently "in" a room using Supabase's Presence feature
 * (built on Phoenix-style CRDT presence over a Realtime channel).
 * Every connected client sees the same live list without polling.
 */
export function usePresence({ roomId, myId, myDisplayName, myAvatarSeed }: UsePresenceOptions) {
  const [others, setOthers] = useState<PresenceState[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const myStateRef = useRef<PresenceState>({
    user_id: myId,
    display_name: myDisplayName,
    avatar_seed: myAvatarSeed,
    task: "",
    status: "active",
    session_started_at: null,
  });

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: myId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const flattened = Object.values(state)
          .flat()
          .filter((p) => p.user_id !== myId);
        setOthers(flattened);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(myStateRef.current);
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myId]);

  const updateMyState = useCallback((patch: Partial<PresenceState>) => {
    myStateRef.current = { ...myStateRef.current, ...patch };
    channelRef.current?.track(myStateRef.current);
  }, []);

  return { others, updateMyState, count: others.length + 1 };
}
