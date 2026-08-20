interface LivePillProps {
  count: number;
  label?: string;
}

export function LivePill({ count, label = "studying now" }: LivePillProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-cream2 border border-border rounded-full text-xs text-ink-soft select-none">
      <div className="w-[7px] h-[7px] rounded-full bg-green animate-pulse-dot" />
      <span>
        {count} {label}
      </span>
    </div>
  );
}
