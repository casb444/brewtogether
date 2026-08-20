export function isAnonymousUser(user: { is_anonymous?: boolean } | null | undefined): boolean {
  return user?.is_anonymous === true;
}

export function normalizeGuestNickname(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ").slice(0, 40);
  return name.length > 0 ? name : null;
}

export function canUseCafeRoom({
  isAnonymous,
  isMember,
  joinPolicy,
}: {
  isAnonymous: boolean;
  isMember: boolean;
  joinPolicy: "open" | "approval_required" | "invite_only";
}): boolean {
  if (isAnonymous) return isMember;
  return isMember || joinPolicy === "open";
}
