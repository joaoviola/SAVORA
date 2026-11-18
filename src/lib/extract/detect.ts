import type { ContentType } from "./types";

const HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am"]);

/** Validates an Instagram URL and detects its content type. Returns null when invalid/unsupported. */
export function detectInstagramUrl(raw: string): { url: string; type: ContentType } | null {
  let u: URL;
  try {
    u = new URL(raw.trim().startsWith("http") ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return null;
  }
  if (!HOSTS.has(u.hostname.toLowerCase())) return null;
  const p = u.pathname.split("/").filter(Boolean);
  const clean = `https://www.instagram.com/${p.join("/")}/`;
  if (p[0] === "stories" && p[1] === "highlights" && p[2]) return { url: clean, type: "highlight" };
  if (p[0] === "s" && p[1]) return { url: `https://www.instagram.com/s/${p[1]}/${u.search}`, type: "highlight" };
  if (p[0] === "stories" && p[1] && p[2]) return { url: clean, type: "story" };
  const i = p.findIndex((s) => ["p", "reel", "reels", "tv"].includes(s));
  if (i >= 0 && p[i + 1]) {
    const seg = p[i];
    const url = `https://www.instagram.com/${seg === "reels" ? "reel" : seg}/${p[i + 1]}/`;
    if (seg === "reel" || seg === "reels") return { url, type: "reel" };
    if (seg === "tv") return { url, type: "video" };
    return { url, type: "post" };
  }
  return null;
}
