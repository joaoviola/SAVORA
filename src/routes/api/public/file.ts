import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/file")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { isAllowedMediaHost } = await import("@/lib/extract/engine.server");
        const params = new URL(request.url).searchParams;
        let target: URL;
        try {
          target = new URL(params.get("u") ?? "");
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!isAllowedMediaHost(target)) return new Response("Forbidden host", { status: 403 });
        const upstream = await fetch(target.toString(), {
          redirect: "manual",
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", Referer: "https://www.instagram.com/", Accept: "*/*" },
        });
        if (!upstream.ok || !upstream.body) return new Response("Media unavailable", { status: 502 });
        const type = upstream.headers.get("content-type") ?? "application/octet-stream";
        const ext = type.includes("video") ? "mp4" : type.includes("png") ? "png" : "jpg";
        const headers = new Headers({ "Content-Type": type, "Cache-Control": "private, max-age=600" });
        const len = upstream.headers.get("content-length");
        if (len && Number(len) > 500 * 1024 * 1024) return new Response("Too large", { status: 413 });
        if (len) headers.set("Content-Length", len);
        headers.set("X-Content-Type-Options", "nosniff");
        const name = (params.get("name") ?? "").replace(/[^\w.\-]/g, "_").slice(0, 120) || `savora-${Date.now()}.${ext}`;
        if (!params.get("inline")) headers.set("Content-Disposition", `attachment; filename="${name}"`);
        return new Response(upstream.body, { headers });
      },
    },
  },
});
