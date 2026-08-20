export function murmurAuthorTag(isGuest: boolean): "anonymous" | null {
  return isGuest ? "anonymous" : null;
}
