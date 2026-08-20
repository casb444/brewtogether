import { describe, expect, it } from "vitest";
import { murmurAuthorTag } from "./guest-tag";

describe("murmurAuthorTag", () => {
  it("tags guest murmurs as anonymous and leaves member murmurs untagged", () => {
    expect(murmurAuthorTag(true)).toBe("anonymous");
    expect(murmurAuthorTag(false)).toBeNull();
  });
});
