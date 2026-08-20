interface StatsRowProps {
  streak: number;
  sessionsToday: number;
  minutesToday: number;
  onStreakClick: () => void;
}

export function StatsRow({ streak, sessionsToday, minutesToday, onStreakClick }: StatsRowProps) {
  const items = [
    { icon: "🔥", value: streak, label: "Day streak", onClick: onStreakClick },
    { icon: "🍅", value: sessionsToday, label: "Sessions today" },
    { icon: "⏱️", value: `${minutesToday}m`, label: "Focused today" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          disabled={!item.onClick}
          className="bg-cream border border-border rounded-xl px-4 py-3.5 flex flex-col gap-0.5 text-left disabled:cursor-default hover:border-brand-mid transition-colors enabled:cursor-pointer"
        >
          <div className="text-base">{item.icon}</div>
          <div className="font-display text-2xl text-ink">{item.value}</div>
          <div className="text-[11px] text-ink-muted uppercase tracking-wide">{item.label}</div>
        </button>
      ))}
    </div>
  );
}
