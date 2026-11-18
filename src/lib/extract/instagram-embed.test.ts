import { describe, expect, it } from "vitest";
import { cdnAllowed, cdnExpiry, mediaFromContext, parseContextJson, shortcodeOf } from "./instagram-embed.server";

const wrap = (ctx: unknown) => `<script>x={"contextJSON":${JSON.stringify(JSON.stringify(ctx))}}</script>`;
const V = "https://scontent.cdninstagram.com/v.mp4?oe=6745A000";
const I = "https://scontent.cdninstagram.com/i.jpg";

describe("instagram embed", () => {
  it("shortcode", () => expect(shortcodeOf("https://www.instagram.com/reel/AbC_1/")).toBe("AbC_1"));
  it("single video", () => {
    const r = mediaFromContext(parseContextJson(wrap({ gql_data: { shortcode_media: { is_video: true, video_url: V, display_url: I, owner: { username: "ana" } } } })), "AbC");
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({ kind: "video", thumbnail: I, filename: "ana_AbC.mp4" });
  });
  it("carousel", () => {
    const n = (node: object) => ({ node });
    const r = mediaFromContext({ gql_data: { shortcode_media: { owner: { username: "a" }, edge_sidecar_to_children: { edges: [n({ display_url: I }), n({ is_video: true, video_url: V, display_url: I })] } } } }, "X");
    expect(r.items.map((i) => i.filename)).toEqual(["a_X_1.jpg", "a_X_2.mp4"]);
  });
  it("copyright → private", () => expect(() => mediaFromContext({ context: { copyright_blocked: true } }, "X")).toThrow(/copyright/));
  it("missing contextJSON → private", () => expect(() => parseContextJson("<html></html>")).toThrow());
  it("rejects foreign hosts", () => {
    expect(cdnAllowed("https://evil.com/a.jpg")).toBe(false);
    expect(() => mediaFromContext({ gql_data: { shortcode_media: { display_url: "https://evil.com/a.jpg" } } }, "X")).toThrow();
  });
  it("oe expiry", () => expect(cdnExpiry(V)).toBe(0x6745a000 * 1000));
});
