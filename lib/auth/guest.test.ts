import { describe, expect, it } from "vitest";
import { canUseCafeRoom, isAnonymousUser, normalizeGuestNickname } from "./guest";

describe("isAnonymousUser", () => {
  it("is true only when the Auth user is anonymous", () => {
    expect(isAnonymousUser(null)).toBe(false);
    expect(isAnonymousUser({ is_anonymous: false })).toBe(false);
    expect(isAnonymousUser({ is_anonymous: true })).toBe(true);
  });
});

describe("normalizeGuestNickname", () => {
  it("trims and caps a usable nick", () => {
    expect(normalizeGuestNickname("  Sabari  ")).toBe("Sabari");
    expect(normalizeGuestNickname("a".repeat(50))).toBe("a".repeat(40));
  });

  it("rejects a blank nick", () => {
    expect(normalizeGuestNickname("   ")).toBeNull();
    expect(normalizeGuestNickname("")).toBeNull();
  });
});

describe("canUseCafeRoom", () => {
  it("lets guests sit only in a room they already belong to", () => {
    expect(canUseCafeRoom({ isAnonymous: true, isMember: false, joinPolicy: "open" })).toBe(false);
    expect(canUseCafeRoom({ isAnonymous: true, isMember: true, joinPolicy: "invite_only" })).toBe(true);
  });

  it("lets members use open café rooms without a membership row", () => {
    expect(canUseCafeRoom({ isAnonymous: false, isMember: false, joinPolicy: "open" })).toBe(true);
    expect(canUseCafeRoom({ isAnonymous: false, isMember: false, joinPolicy: "invite_only" })).toBe(false);
    expect(canUseCafeRoom({ isAnonymous: false, isMember: true, joinPolicy: "invite_only" })).toBe(true);
  });
});
