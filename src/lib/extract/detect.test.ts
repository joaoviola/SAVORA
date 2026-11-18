import { describe, expect, it } from "vitest";
import { detectInstagramUrl } from "./detect";

describe("detectInstagramUrl", () => {
  it("detects reels", () => expect(detectInstagramUrl("https://www.instagram.com/reel/Cx12ab/?igsh=1")?.type).toBe("reel"));
  it("detects posts without protocol", () => expect(detectInstagramUrl("instagram.com/p/ABC123")).toEqual({ url: "https://www.instagram.com/p/ABC123/", type: "post" }));
  it("detects stories", () => expect(detectInstagramUrl("https://instagram.com/stories/user/3123/")?.type).toBe("story"));
  it("detects highlights", () => expect(detectInstagramUrl("https://www.instagram.com/stories/highlights/1790/")?.type).toBe("highlight"));
  it("rejects other hosts", () => expect(detectInstagramUrl("https://evil.com/p/ABC/")).toBeNull());
  it("rejects profile pages", () => expect(detectInstagramUrl("https://www.instagram.com/someone/")).toBeNull());
});
