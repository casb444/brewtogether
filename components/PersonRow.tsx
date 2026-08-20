import { Avatar } from "./Avatar";

interface PersonRowProps {
  name: string;
  seed: string;
  task: string;
  status: "active" | "break";
  minutesAgo: number;
  isMe?: boolean;
}

export function PersonRow({ name, seed, task, status, minutesAgo, isMe }: PersonRowProps) {
  const timeLabel =
    minutesAgo < 60 ? `${minutesAgo}m` : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m`;

  return (
    <div className="flex items-center gap-2.5 px-5 py-2 hover:bg-cream transition-colors animate-fade-up">
      <Avatar name={name} seed={seed} isMe={isMe} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">
          {name}
          {isMe && <span className="text-[10px] text-ink-muted font-normal ml-1">(you)</span>}
        </div>
        <div className="text-[11px] text-ink-muted italic truncate mt-px">{task || "…"}</div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            status === "active" ? "bg-green" : "bg-amber"
          }`}
        />
        <div className="text-[10px] text-ink-muted">{timeLabel}</div>
      </div>
    </div>
  );
}
