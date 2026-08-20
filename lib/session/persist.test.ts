import { describe, expect, it } from "vitest";
import { shouldPersistCompletedSession, weekStartIso } from "./persist";

describe("shouldPersistCompletedSession", () => {
  it("persists a completed focus session once", () => {
    expect(
      shouldPersistCompletedSession({ userId: "user-1", isBreak: false, inFlight: false })
    ).toBe(true);
  });

  it("skips breaks, guests, and in-flight completions", () => {
    expect(
      shouldPersistCompletedSession({ userId: "user-1", isBreak: true, inFlight: false })
    ).toBe(false);
    expect(
      shouldPersistCompletedSession({ userId: null, isBreak: false, inFlight: false })
    ).toBe(false);
    expect(
      shouldPersistCompletedSession({ userId: "user-1", isBreak: false, inFlight: true })
    ).toBe(false);
  });
});

describe("weekStartIso", () => {
  it("returns Monday 00:00 of the current local week", () => {
    const wednesday = new Date("2026-08-19T15:30:00");
    const start = new Date(weekStartIso(wednesday));
    expect(start.getDay()).toBe(1);
    expect(start.getHours()).toBe(0);
  });
});
