import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("returns the fallback when empty", () => {
    expect(safeNextPath(null)).toBe("/cafe/main");
    expect(safeNextPath("")).toBe("/cafe/main");
  });

  it("accepts local product paths", () => {
    expect(safeNextPath("/cafe/library")).toBe("/cafe/library");
    expect(safeNextPath("/groups")).toBe("/groups");
    expect(safeNextPath("/invite/abc-123")).toBe("/invite/abc-123");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("https://evil.example")).toBe("/cafe/main");
    expect(safeNextPath("//evil.example")).toBe("/cafe/main");
    expect(safeNextPath("/\\evil.example")).toBe("/cafe/main");
    expect(safeNextPath("/cafe/main://evil")).toBe("/cafe/main");
  });

  it("does not bounce confirmed users back into auth screens", () => {
    expect(safeNextPath("/login")).toBe("/cafe/main");
    expect(safeNextPath("/signup?next=/groups")).toBe("/cafe/main");
  });
});
