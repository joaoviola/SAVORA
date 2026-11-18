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
        const upstream = await fetch(target.toString(), { redirect: "manual" });
        if (!upstream.ok || !upstream.body) return new Response("Media unavailable", { status: 502 });
        const type = upstream.headers.get("content-type") ?? "application/octet-stream";
        const ext = type.includes("video") ? "mp4" : type.includes("png") ? "png" : "jpg";
        const headers = new Headers({ "Content-Type": type, "Cache-Control": "private, max-age=600" });
        const len = upstream.headers.get("content-length");
        if (len) headers.set("Content-Length", len);
        if (!params.get("inline")) headers.set("Content-Disposition", `attachment; filename="savora-${Date.now()}.${ext}"`);
        return new Response(upstream.body, { headers });
      },
    },
  },
});
