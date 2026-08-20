"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { shouldPersistCompletedSession, weekStartIso } from "@/lib/session/persist";
import type { Streak } from "@/types/database";

interface UseStudySessionOptions {
  roomId: string;
  userId: string | null;
  task: string;
  isBreak: boolean;
  onComplete?: (info: { durationSeconds: number; sessionsToday: number; minutesToday: number }) => void;
  onPersistError?: (message: string) => void;
}

export function useStudySession({
  roomId,
  userId,
  task,
  isBreak,
  onComplete,
  onPersistError,
}: UseStudySessionOptions) {
  const [durationSeconds, setDurationSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [minutesToday, setMinutesToday] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const taskRef = useRef(task);
  const isBreakRef = useRef(isBreak);
  const inFlightRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onPersistErrorRef = useRef(onPersistError);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);
  useEffect(() => {
    isBreakRef.current = isBreak;
  }, [isBreak]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    onPersistErrorRef.current = onPersistError;
  }, [onPersistError]);

  const supabase = createClient();

  const loadStreak = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("streaks").select("*").eq("user_id", userId).single();
    if (data) setStreak(data);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: todaySessions } = await supabase
      .from("sessions")
      .select("duration_seconds")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("started_at", startOfDay.toISOString());

    if (todaySessions) {
      setSessionsToday(todaySessions.length);
      setMinutesToday(Math.round(todaySessions.reduce((sum, session) => sum + session.duration_seconds, 0) / 60));
    }

    const { data: weekSessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("started_at", weekStartIso());

    if (weekSessions) setSessionsThisWeek(weekSessions.length);
  }, [userId, supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadStreak();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStreak]);

  const tick = useCallback(() => {
    setRemaining((value) => {
      if (value > 1) return value - 1;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);

      const persist = shouldPersistCompletedSession({
        userId,
        isBreak: isBreakRef.current,
        inFlight: inFlightRef.current,
      });

      if (persist && userId) {
        inFlightRef.current = true;
        supabase
          .rpc("complete_session", {
            p_room_id: roomId,
            p_task: taskRef.current || null,
            p_duration_seconds: durationSeconds,
          })
          .then(async ({ error }) => {
            if (error) {
              inFlightRef.current = false;
              onPersistErrorRef.current?.(error.message);
              return;
            }
            await loadStreak();
            inFlightRef.current = false;
            onCompleteRef.current?.({
              durationSeconds,
              sessionsToday: sessionsToday + 1,
              minutesToday: minutesToday + Math.round(durationSeconds / 60),
            });
          });
      } else if (!isBreakRef.current) {
        onCompleteRef.current?.({ durationSeconds, sessionsToday, minutesToday });
      }
      return 0;
    });
  }, [userId, roomId, durationSeconds, supabase, loadStreak, sessionsToday, minutesToday]);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [running, tick]);

  const pause = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    pause();
    setRemaining(durationSeconds);
  }, [durationSeconds, pause]);

  const setDuration = useCallback(
    (mins: number) => {
      pause();
      const secs = mins * 60;
      setDurationSeconds(secs);
      setRemaining(secs);
    },
    [pause]
  );

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  return {
    remaining,
    durationSeconds,
    running,
    streak,
    sessionsToday,
    minutesToday,
    sessionsThisWeek,
    start,
    pause,
    reset,
    setDuration,
  };
}
