"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";

interface StreakModalProps {
  open: boolean;
  onClose: () => void;
  streak: number;
  longestStreak: number;
  sessionsThisWeek: number;
  onUpgradeClick: () => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StreakModal({
  open,
  onClose,
  streak,
  longestStreak,
  sessionsThisWeek,
  onUpgradeClick,
}: StreakModalProps) {
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <Modal open={open} onClose={onClose} maxWidth="380px">
      <div className="text-center">
        <div className="text-6xl mb-2">🔥</div>
        <div className="font-display text-2xl text-ink mb-2">{streak}-day streak</div>
        <div className="text-sm text-ink-soft mb-6 leading-relaxed">
          You&apos;ve studied {sessionsThisWeek} session{sessionsThisWeek === 1 ? "" : "s"} this week. Your longest streak is {longestStreak} days.
        </div>
        <div className="flex gap-1.5 justify-center mb-6">
          {DAYS.map((day, index) => {
            const isToday = index === todayIdx;
            return (
              <div
                key={day}
                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-px text-[11px] font-semibold border ${
                  isToday ? "bg-brand border-brand text-white" : "bg-cream2 border-border text-ink-muted"
                }`}
              >
                <span>{isToday ? "🔥" : "·"}</span>
                <span className="text-[8px] font-normal opacity-70">{day}</span>
              </div>
            );
          })}
        </div>
        <Button variant="primary" size="lg" className="w-full mb-3" onClick={onClose}>
          Back to studying
        </Button>
        <div className="text-xs text-ink-muted">
          Loving the café?{" "}
          <button onClick={onUpgradeClick} className="text-brand underline cursor-pointer">
            Support BrewTogether →
          </button>
        </div>
      </div>
    </Modal>
  );
}
