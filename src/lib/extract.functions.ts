import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { detectInstagramUrl } from "./extract/detect";
import type { ExtractResponse } from "./extract/types";

export const extractMedia = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ url: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data }): Promise<ExtractResponse> => {
    const { extractors, rateLimited } = await import("./extract/engine.server");
    const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0] ?? "anon";
    if (rateLimited(ip)) return { ok: false, error: "rate_limited" };
    const detected = detectInstagramUrl(data.url);
    if (!detected) return { ok: false, error: "invalid_url" };
    const res = await extractors[0]!.extract(detected.url, detected.type);
    if (!res.ok) return res;
    const wrap = (u: string) => `/api/public/file?u=${encodeURIComponent(u)}`;
    return {
      ok: true,
      data: {
        ...res.data,
        items: res.data.items.map((it) => ({
          ...it,
          thumbnail: `${wrap(it.thumbnail)}&inline=1`,
          variants: it.variants.map((v) => ({ ...v, url: wrap(v.url) })),
        })),
      },
    };
  });
