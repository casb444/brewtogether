export function shouldPersistCompletedSession(input: {
  userId: string | null;
  isBreak: boolean;
  inFlight: boolean;
}): boolean {
  return Boolean(input.userId) && !input.isBreak && !input.inFlight;
}

export function weekStartIso(now = new Date()): string {
  const date = new Date(now);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date.toISOString();
}
