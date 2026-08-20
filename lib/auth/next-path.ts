const FALLBACK = "/cafe/main";

const BLOCKED_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]);

export function safeNextPath(raw: string | null | undefined, fallback = FALLBACK): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (raw.includes("://") || raw.includes("\\")) return fallback;

  const [pathname] = raw.split("?");
  if (!pathname || BLOCKED_PATHS.has(pathname)) return fallback;
  return raw;
}
