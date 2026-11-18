import type { ContentType, ExtractResponse, Extractor, MediaItem } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const str = (v: any) => (typeof v === "string" && v.startsWith("http") ? v : undefined);

function toItem(m: any): MediaItem | null {
  const video = str(m.video_url) ?? str(m.videoUrl) ?? (m.type === "video" ? str(m.url) : undefined);
  const image = str(m.display_url) ?? str(m.image_url) ?? str(m.thumbnail) ?? str(m.thumbnail_url) ?? str(m.url);
  const variants = Array.isArray(m.variants) || Array.isArray(m.qualities)
    ? (m.variants ?? m.qualities).map((v: any) => ({ quality: String(v.quality ?? v.label ?? (v.height ? `${v.height}p` : "HD")), url: str(v.url) })).filter((v: any) => v.url)
    : [];
  if (!variants.length && (video || image)) variants.push({ quality: "HD", url: (video ?? image)! });
  if (!variants.length) return null;
  return { kind: video || m.type === "video" || m.is_video ? "video" : "image", thumbnail: image ?? variants[0].url, variants };
}

/** Adapter for the owner's JSON scraper. Adjust mapping here once the response format is known. */
export const customScraper: Extractor = {
  name: "custom-scraper",
  async extract(url: string, type: ContentType): Promise<ExtractResponse> {
    const endpoint = process.env["SCRAPER_URL"];
    if (!endpoint) return { ok: false, error: "not_configured" };
    const key = process.env["SCRAPER_API_KEY"];
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify({ url, type }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      console.error("scraper fetch failed", e);
      return { ok: false, error: "upstream" };
    }
    if (res.status === 404) return { ok: false, error: "not_found" };
    if (res.status === 403) return { ok: false, error: "private" };
    if (!res.ok) return { ok: false, error: "upstream" };
    const json: any = await res.json().catch(() => null);
    if (!json) return { ok: false, error: "upstream" };
    const err = String(json.error ?? "").toLowerCase();
    if (err.includes("private")) return { ok: false, error: "private" };
    if (err.includes("not found") || err.includes("deleted")) return { ok: false, error: "not_found" };
    const root = json.data ?? json;
    const list: any[] = root.items ?? root.media ?? root.carousel ?? root.children ?? (Array.isArray(root) ? root : [root]);
    const items = list.map(toItem).filter((x): x is MediaItem => !!x);
    if (!items.length) return { ok: false, error: err ? "upstream" : "unsupported" };
    return {
      ok: true,
      data: {
        type: items.length > 1 && type === "post" ? "carousel" : type,
        author: root.author ?? root.username ?? root.owner?.username,
        caption: typeof root.caption === "string" ? root.caption.slice(0, 280) : undefined,
        items,
      },
    };
  },
};
