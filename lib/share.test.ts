import { describe, expect, it } from "vitest";
import { shareLinks } from "./share";

describe("shareLinks", () => {
  it("builds platform share URLs from a café link", () => {
    const links = shareLinks("https://brewtogether.app/cafe/main", "Join me at the café");
    expect(links.twitter).toContain("twitter.com/intent/tweet");
    expect(links.whatsapp).toContain("wa.me");
    expect(links.telegram).toContain("t.me/share");
    expect(links.reddit).toContain("reddit.com/submit");
    expect(links.twitter).toContain(encodeURIComponent("https://brewtogether.app/cafe/main"));
  });
});
