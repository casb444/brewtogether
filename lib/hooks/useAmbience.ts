"use client";

import { useEffect, useRef } from "react";
import { createAmbienceEngine, type AmbienceId } from "@/lib/audio/ambience";

export function useAmbience(id: AmbienceId, enabled: boolean) {
  const engineRef = useRef<ReturnType<typeof createAmbienceEngine> | null>(null);

  useEffect(() => {
    engineRef.current ??= createAmbienceEngine();
    const engine = engineRef.current;
    if (!enabled) {
      engine.stop();
      return;
    }
    void engine.play(id);
    return () => engine.stop();
  }, [id, enabled]);
}
