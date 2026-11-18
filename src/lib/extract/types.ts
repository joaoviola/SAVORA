export type ContentType = "post" | "reel" | "video" | "story" | "highlight" | "carousel";
export type MediaVariant = { quality: string; url: string };
export type MediaItem = { kind: "video" | "image"; thumbnail: string; variants: MediaVariant[] };
export type ExtractResult = { type: ContentType; author?: string; caption?: string; items: MediaItem[] };
export type ExtractErrorCode =
  | "invalid_url" | "unsupported" | "private" | "not_found"
  | "not_configured" | "rate_limited" | "upstream";
export type ExtractResponse = { ok: true; data: ExtractResult } | { ok: false; error: ExtractErrorCode };

/** Swap-in interface for any extraction engine. */
export interface Extractor {
  name: string;
  extract(url: string, type: ContentType): Promise<ExtractResponse>;
}
