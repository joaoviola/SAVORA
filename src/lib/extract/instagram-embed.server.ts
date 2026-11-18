import type { ContentType, ExtractResponse, Extractor, MediaItem } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const RE_SHORTCODE = /instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;
const CDN = /(?:^|\.)(?:cdninstagram\.com|fbcdn\.net)$/;
const TTL = 1800_000, MARGIN = 600_000;

export class ExtractError extends Error { constructor(public code: "private" | "not_found", m: string) { super(m); } }

export function shortcodeOf(url: string): string | null {
  return RE_SHORTCODE.exec(url)?.[1] ?? null;
}

/** contextJSON is a JSON string literal holding JSON — parse twice. */
export function parseContextJson(html: string): any {
  const key = '"contextJSON":';
  const k = html.indexOf(key);
  if (k === -1) throw new ExtractError("private", "contextJSON missing");
  const start = k + key.length;
  if (html[start] !== '"') throw new ExtractError("not_found", "bad contextJSON");
  let i = start + 1;
  for (; i < html.length; i++) {
    if (html[i] === "\\") { i++; continue; }
    if (html[i] === '"') break;
  }
  if (i >= html.length) throw new ExtractError("not_found", "unterminated contextJSON");
  try { return JSON.parse(JSON.parse(html.slice(start, i + 1))); }
  catch { throw new ExtractError("not_found", "malformed contextJSON"); }
}

export function cdnAllowed(u: string) {
  try { const x = new URL(u); return x.protocol === "https:" && CDN.test(x.hostname.toLowerCase()); } catch { return false; }
}

export function cdnExpiry(u: string): number | null {
  const m = /[?&]oe=([0-9A-Fa-f]+)/.exec(u);
  return m ? parseInt(m[1]!, 16) * 1000 : null;
}

export function mediaFromContext(ctx: any, sc: string) {
  const media = ctx?.gql_data?.shortcode_media;
  if (!media) {
    if (ctx?.context?.copyright_blocked) throw new ExtractError("private", "copyright blocked");
    throw new ExtractError("not_found", "shortcode_media missing");
  }
  const nodes: any[] = media.edge_sidecar_to_children?.edges?.map((e: any) => e.node) ?? [media];
  const author: string | undefined = media.owner?.username;
  const raw = nodes.map((n) => {
    if (n.is_video && n.video_url) return { kind: "video" as const, url: n.video_url as string, thumb: (n.display_url ?? n.video_url) as string };
    if (n.display_url) return { kind: "image" as const, url: n.display_url as string, thumb: n.display_url as string };
    return null;
  }).filter((x): x is NonNullable<typeof x> => !!x && cdnAllowed(x.url));
  const items: MediaItem[] = raw.map((r, i) => ({
    kind: r.kind,
    thumbnail: cdnAllowed(r.thumb) ? r.thumb : r.url,
    filename: `${author ?? "ig"}_${sc}${raw.length > 1 ? `_${i + 1}` : ""}.${r.kind === "video" ? "mp4" : "jpg"}`,
    variants: [{ quality: "HD", url: r.url }],
  }));
  if (!items.length) throw new ExtractError("not_found", "no media");
  const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text;
  return { author, caption: typeof caption === "string" ? caption.slice(0, 280) : undefined, items };
}

const cache = new Map<string, { exp: number; data: ReturnType<typeof mediaFromContext> }>();

export const instagramEmbed: Extractor = {
  name: "instagram-embed",
  async extract(url: string, type: ContentType): Promise<ExtractResponse> {
    if (type === "story" || type === "highlight") return { ok: false, error: "unsupported" };
    const sc = shortcodeOf(url);
    if (!sc) return { ok: false, error: "invalid_url" };
    const now = Date.now();
    let hit = cache.get(sc);
    if (!hit || hit.exp < now) {
      let res: Response;
      try {
        res = await fetch(`https://www.instagram.com/reel/${sc}/embed/captioned/`, {
          headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", Accept: "text/html" },
          signal: AbortSignal.timeout(20000),
        });
      } catch (e) { console.error("embed fetch failed", e); return { ok: false, error: "upstream" }; }
      if (res.status === 404) return { ok: false, error: "not_found" };
      if (!res.ok) { console.error("embed status", res.status); return { ok: false, error: "upstream" }; }
      try {
        const data = mediaFromContext(parseContextJson(await res.text()), sc);
        let exp = now + TTL;
        for (const it of data.items) { const oe = cdnExpiry(it.variants[0]!.url); if (oe) exp = Math.min(exp, oe - MARGIN); }
        hit = { exp, data };
        if (exp > now) { if (cache.size > 5000) cache.clear(); cache.set(sc, hit); }
      } catch (e) {
        if (e instanceof ExtractError) return { ok: false, error: e.code };
        return { ok: false, error: "upstream" };
      }
    }
    const d = hit.data;
    return { ok: true, data: { type: d.items.length > 1 && type === "post" ? "carousel" : type, author: d.author, caption: d.caption, items: d.items } };
  },
};
