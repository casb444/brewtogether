const PALETTE = [
  { bg: "#E6EEF8", c: "#1A4C8A" },
  { bg: "#E0F3EC", c: "#0C5C3A" },
  { bg: "#FAF0DC", c: "#7A4E0A" },
  { bg: "#EEECFE", c: "#4A3FAA" },
  { bg: "#FAE8E4", c: "#8A2C18" },
  { bg: "#FAE6F0", c: "#8A2550" },
  { bg: "#E8F2DC", c: "#2E5C0A" },
  { bg: "#FDF0E8", c: "#7C4B1A" },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  if (name.toLowerCase() === "you") return "you";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AvatarProps {
  name: string;
  seed: string;
  isMe?: boolean;
  size?: number;
}

export function Avatar({ name, seed, isMe, size = 32 }: AvatarProps) {
  const palette = isMe
    ? { bg: "var(--brand-light)", c: "var(--brand)" }
    : PALETTE[hashSeed(seed) % PALETTE.length];

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: palette.bg,
        color: palette.c,
        fontSize: size * 0.34,
        border: isMe ? "1.5px solid var(--brand)" : "none",
      }}
    >
      {initials(name)}
    </div>
  );
}
