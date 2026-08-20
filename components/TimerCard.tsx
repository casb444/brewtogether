"use client";

import { Button } from "./Button";

interface TimerCardProps {
  remaining: number;
  durationSeconds: number;
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetDuration: (mins: number) => void;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const DURATIONS = [
  { mins: 25, label: "Pomodoro · 25 minutes" },
  { mins: 50, label: "Deep work · 50 minutes" },
  { mins: 90, label: "Flow state · 90 minutes" },
];

export function TimerCard({
  remaining,
  durationSeconds,
  running,
  onStart,
  onPause,
  onReset,
  onSetDuration,
}: TimerCardProps) {
  const pct = Math.round(((durationSeconds - remaining) / durationSeconds) * 100);
  const isDone = remaining === 0;
  const activeMins = Math.round(durationSeconds / 60);
  const activeLabel =
    DURATIONS.find((d) => d.mins === activeMins)?.label ?? `${activeMins} minute session`;

  return (
    <div className="bg-cream border border-border rounded-2xl px-6 py-8 text-center">
      <div className="text-[11px] uppercase tracking-wider text-ink-muted mb-4 font-medium">
        {isDone ? "session complete ✓" : running ? "focus session" : "focus session"}
      </div>
      <div
        className={`font-display text-6xl sm:text-7xl tracking-tight leading-none transition-colors ${
          isDone ? "text-green" : running ? "text-brand" : "text-ink"
        }`}
      >
        {formatTime(remaining)}
      </div>
      <div className="text-[13px] text-ink-soft mt-2">{activeLabel}</div>

      <div className="max-w-[280px] mx-auto mt-5 h-[3px] bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-1.5 justify-center mt-3.5">
        {DURATIONS.map((d) => (
          <button
            key={d.mins}
            onClick={() => onSetDuration(d.mins)}
            className={`px-3.5 py-1 rounded-full text-xs border transition-colors ${
              activeMins === d.mins
                ? "bg-cream2 border-brand-mid text-brand"
                : "border-border text-ink-soft hover:bg-cream2"
            }`}
          >
            {d.mins} min
          </button>
        ))}
      </div>

      <div className="flex gap-2.5 justify-center mt-5 flex-wrap">
        <Button variant="primary" onClick={running ? onPause : onStart}>
          {running ? "Pause" : remaining === durationSeconds ? "Start session" : "Resume session"}
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
