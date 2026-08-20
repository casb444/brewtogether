"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/lib/hooks/usePresence";
import { useMurmurs } from "@/lib/hooks/useMurmurs";
import { useStudySession } from "@/lib/hooks/useStudySession";
import { useAmbience } from "@/lib/hooks/useAmbience";
import { PersonRow } from "@/components/PersonRow";
import { MurmurFeed } from "@/components/MurmurFeed";
import { TimerCard } from "@/components/TimerCard";
import { StatsRow } from "@/components/StatsRow";
import { StreakModal } from "@/components/StreakModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { GroupManageModal } from "@/components/GroupManageModal";
import { Button } from "@/components/Button";
import { LivePill } from "@/components/LivePill";
import { getDonationUrl } from "@/lib/config";
import type { AmbienceId } from "@/lib/audio/ambience";
import type { Room, Profile, Streak } from "@/types/database";

const AMBIENCES: { id: AmbienceId; label: string }[] = [
  { id: "cafe_rain", label: "☕ Café rain" },
  { id: "lofi", label: "🎵 Lo-fi" },
  { id: "library", label: "📚 Library" },
  { id: "silence", label: "🔇 Silence" },
];

interface CafeClientProps {
  room: Room;
  allRooms: Room[];
  userId: string;
  profile: Profile;
  initialStreak: Streak | null;
  pendingRequests: { id: string; user_id: string; display_name: string }[];
  canManage: boolean;
  isOwner: boolean;
}

function computeMinutesAgo(sessionStartedAt: string | null): number {
  if (!sessionStartedAt) return 0;
  return Math.round((Date.now() - new Date(sessionStartedAt).getTime()) / 60000);
}

function usePersonMinutesAgo(sessionStartedAt: string | null): number {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
  return computeMinutesAgo(sessionStartedAt);
}

function PresencePersonRow({
  displayName,
  seed,
  task,
  status,
  sessionStartedAt,
}: {
  displayName: string;
  seed: string;
  task: string;
  status: "active" | "break";
  sessionStartedAt: string | null;
}) {
  const minutesAgo = usePersonMinutesAgo(sessionStartedAt);
  return <PersonRow name={displayName} seed={seed} task={task} status={status} minutesAgo={minutesAgo} />;
}

export function CafeClient({
  room,
  allRooms,
  userId,
  profile,
  initialStreak,
  pendingRequests: initialRequests,
  canManage,
  isOwner,
}: CafeClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [task, setTask] = useState("");
  const [ambience, setAmbience] = useState<AmbienceId>((room.default_ambience as AmbienceId) || "cafe_rain");
  const [ambienceOn, setAmbienceOn] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [completeOverlay, setCompleteOverlay] = useState<{ sessions: number; minutes: number } | null>(null);
  const [breakMode, setBreakMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"focus" | "people" | "murmurs">("focus");
  const [pendingRequests, setPendingRequests] = useState(initialRequests);

  useAmbience(ambience, ambienceOn);

  const { others, updateMyState, count } = usePresence({
    roomId: room.id,
    myId: userId,
    myDisplayName: profile.display_name,
    myAvatarSeed: profile.avatar_seed,
  });

  const { murmurs, send: sendMurmur, error: murmurError } = useMurmurs(room.id, userId, profile.display_name);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const session = useStudySession({
    roomId: room.id,
    userId,
    task,
    isBreak: breakMode,
    onComplete: (info) => {
      setCompleteOverlay({
        sessions: info.sessionsToday,
        minutes: Math.round(info.durationSeconds / 60),
      });
      updateMyState({ status: "break" });
    },
    onPersistError: (message) => showToast(message),
  });

  useEffect(() => {
    updateMyState({
      task,
      status: session.running ? "active" : "break",
      session_started_at: session.running ? new Date().toISOString() : null,
    });
  }, [task, session.running, updateMyState]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const peopleList = (
    <>
      <PersonRow
        name="you"
        seed={profile.avatar_seed}
        task={task}
        status={session.running ? "active" : "break"}
        minutesAgo={0}
        isMe
      />
      {others.length === 0 && (
        <div className="px-5 py-6 text-center text-xs text-ink-muted italic">
          It&apos;s just you right now — invite someone to fill the room.
        </div>
      )}
      {others.map((person) => (
        <PresencePersonRow
          key={person.user_id}
          displayName={person.display_name}
          seed={person.avatar_seed}
          task={person.task}
          status={person.status}
          sessionStartedAt={person.session_started_at}
        />
      ))}
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <nav className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-parchment sticky top-0 z-40 flex-shrink-0 gap-2">
        <Link href="/" className="font-display italic text-lg text-ink shrink-0">
          brew<span className="text-brand not-italic">together</span>
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <LivePill count={count} />
          <button
            onClick={() => setStreakModalOpen(true)}
            className="px-3 py-1.5 text-xs rounded-lg border border-transparent text-ink-soft hover:bg-cream2 hover:border-border transition-colors cursor-pointer"
          >
            🔥 {session.streak?.current_streak ?? initialStreak?.current_streak ?? 0}-day streak
          </button>
          <Button variant="ghost" size="sm" onClick={() => setShareModalOpen(true)}>
            {canManage ? "Manage group" : "Share ↗"}
          </Button>
          <Button href="/groups" variant="primary" size="sm">
            Study groups
          </Button>
          <button onClick={handleSignOut} className="text-xs text-ink-muted hover:text-ink ml-1 cursor-pointer">
            Sign out
          </button>
        </div>
        <div className="flex md:hidden items-center gap-2">
          <LivePill count={count} label="here" />
          <button
            className="px-3 py-1.5 text-xs rounded-lg border border-border"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            Menu
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="md:hidden border-b border-border bg-parchment px-4 py-3 flex flex-col gap-2 text-sm">
          <button className="text-left" onClick={() => { setStreakModalOpen(true); setMenuOpen(false); }}>
            Streak
          </button>
          <button className="text-left" onClick={() => { setShareModalOpen(true); setMenuOpen(false); }}>
            {canManage ? "Manage group" : "Share"}
          </button>
          <Link href="/groups" onClick={() => setMenuOpen(false)}>
            Study groups
          </Link>
          <button className="text-left text-ink-muted" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="w-[52px] bg-parchment border-r border-border hidden md:flex flex-col items-center py-3 gap-2 flex-shrink-0">
          {allRooms.map((item) => (
            <Link
              key={item.id}
              href={`/cafe/${item.id}`}
              title={item.name}
              className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-lg cursor-pointer transition-colors relative group ${
                item.id === room.id ? "bg-brand-light border border-border" : "hover:bg-cream2 border border-transparent"
              }`}
            >
              {item.icon}
            </Link>
          ))}
        </div>

        <div className={`flex-1 min-w-0 px-4 sm:px-8 py-6 flex-col gap-5 overflow-y-auto bg-parchment ${mobilePanel === "focus" ? "flex" : "hidden lg:flex"}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-ink-muted mr-1">Ambience</span>
            {AMBIENCES.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setAmbience(item.id);
                  setAmbienceOn(item.id !== "silence");
                  showToast(item.id === "silence" ? "Ambience off" : `Ambience: ${item.label}`);
                }}
                className={`px-3.5 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
                  ambience === item.id && (item.id === "silence" || ambienceOn)
                    ? "bg-brand-light border-brand text-brand"
                    : "border-border text-ink-soft hover:bg-cream2"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <TimerCard
            remaining={session.remaining}
            durationSeconds={session.durationSeconds}
            running={session.running}
            onStart={() => {
              if (breakMode) setBreakMode(false);
              session.start();
            }}
            onPause={session.pause}
            onReset={() => {
              setBreakMode(false);
              session.reset();
            }}
            onSetDuration={(mins) => {
              setBreakMode(false);
              session.setDuration(mins);
            }}
          />
          <div className="bg-cream border border-border rounded-2xl p-5">
            <div className="text-xs text-ink-muted mb-2 font-medium">What are you working on?</div>
            <textarea
              value={task}
              onChange={(event) => setTask(event.target.value)}
              rows={2}
              maxLength={120}
              placeholder="e.g. reading for tomorrow's exam, finishing the quarterly report…"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-parchment text-sm text-ink resize-none outline-none focus:border-brand focus:bg-white transition-colors placeholder:text-ink-muted"
            />
          </div>
          <StatsRow
            streak={session.streak?.current_streak ?? initialStreak?.current_streak ?? 0}
            sessionsToday={session.sessionsToday}
            minutesToday={session.minutesToday}
            onStreakClick={() => setStreakModalOpen(true)}
          />
        </div>

        <aside className={`w-full lg:w-[288px] ${mobilePanel === "people" || mobilePanel === "murmurs" ? "flex" : "hidden"} lg:flex flex-col bg-parchment border-l border-border flex-shrink-0`}>
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-ink-muted">
              {room.icon} {room.name}
            </span>
            <span className="bg-cream2 border border-border rounded-full px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
              {count} here
            </span>
          </div>
          <div className={`flex-1 overflow-y-auto py-1.5 ${mobilePanel === "murmurs" ? "hidden lg:block" : ""}`}>{peopleList}</div>
          <div className={mobilePanel === "people" ? "hidden lg:block" : ""}>
            {murmurError && <p className="px-5 text-xs text-red-600">{murmurError}</p>}
            <MurmurFeed murmurs={murmurs} onSend={sendMurmur} canPost={!!userId} />
          </div>
        </aside>
      </div>

      <div className="lg:hidden h-12 flex items-center justify-around border-t border-border bg-parchment text-xs">
        {(["focus", "people", "murmurs"] as const).map((panel) => (
          <button
            key={panel}
            onClick={() => setMobilePanel(panel)}
            className={mobilePanel === panel ? "text-brand font-semibold" : "text-ink-muted"}
          >
            {panel === "focus" ? "Focus" : panel === "people" ? "People" : "Murmurs"}
          </button>
        ))}
      </div>

      <div className="hidden sm:flex h-11 items-center justify-between px-6 border-t border-border bg-parchment flex-shrink-0">
        <span className="font-display italic text-xs text-ink-muted">everyone here is a stranger — and that&apos;s the point</span>
        <div className="flex items-center gap-3 text-xs">
          <button onClick={() => setUpgradeModalOpen(true)} className="text-brand hover:underline cursor-pointer">
            ☕ Support
          </button>
          <button onClick={() => setShareModalOpen(true)} className="text-brand hover:underline cursor-pointer">
            Share
          </button>
        </div>
      </div>

      <StreakModal
        open={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streak={session.streak?.current_streak ?? initialStreak?.current_streak ?? 0}
        longestStreak={session.streak?.longest_streak ?? initialStreak?.longest_streak ?? 0}
        sessionsThisWeek={session.sessionsThisWeek}
        onUpgradeClick={() => {
          setStreakModalOpen(false);
          setUpgradeModalOpen(true);
        }}
      />
      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} donationUrl={getDonationUrl()} />
      <GroupManageModal
        key={`${room.id}-${shareModalOpen}`}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        room={room}
        userId={userId}
        canManage={canManage}
        isOwner={isOwner}
        pendingRequests={pendingRequests}
        onReviewed={(id) => setPendingRequests((requests) => requests.filter((request) => request.id !== id))}
        showToast={showToast}
      />

      {completeOverlay && !breakMode && (
        <div className="fixed inset-0 z-[350] bg-ink/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-parchment border border-border rounded-2xl p-10 text-center max-w-[360px] w-[90%] shadow-2xl">
            <span className="text-5xl block mb-4">☕</span>
            <div className="font-display text-2xl text-ink mb-2">
              {completeOverlay.sessions === 1 ? "First session complete!" : `Session ${completeOverlay.sessions} done!`}
            </div>
            <div className="text-sm text-ink-soft mb-6 leading-relaxed">
              That&apos;s {completeOverlay.sessions} session{completeOverlay.sessions > 1 ? "s" : ""} today — {completeOverlay.minutes} minutes of focused work.
            </div>
            <div className="flex gap-2.5 justify-center">
              <Button
                variant="primary"
                onClick={() => {
                  setBreakMode(true);
                  session.setDuration(5);
                  session.start();
                  setCompleteOverlay(null);
                }}
              >
                Take a 5-min break
              </Button>
              <Button variant="ghost" onClick={() => setCompleteOverlay(null)}>
                Keep going
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-2.5 rounded-lg text-sm z-[999] shadow-lg animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
