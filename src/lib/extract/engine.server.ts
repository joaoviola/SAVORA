import { customScraper } from "./custom-scraper.server";
import { instagramEmbed } from "./instagram-embed.server";
import type { Extractor } from "./types";

/** Tried in order; the next one runs only when the previous fails. */
export const extractors: Extractor[] = [instagramEmbed, customScraper];

const hits = new Map<string, number[]>();
export function rateLimited(ip: string, limit = 12, windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > limit;
}

export function isAllowedMediaHost(u: URL) {
  const h = u.hostname.toLowerCase();
  const extra = (process.env["SCRAPER_MEDIA_HOSTS"] ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return u.protocol === "https:" && [/\.cdninstagram\.com$/, /\.fbcdn\.net$/].some((r) => r.test(h)) || extra.some((e) => h === e || h.endsWith(`.${e}`));
}
