import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";

export const getRequestOrigin = createServerFn({ method: "GET" }).handler(() => {
  const req = getRequest();
  const url = new URL(req.url);
  const sandboxHost = url.hostname === "localhost" ? req.headers.get("x-forwarded-host") : null;
  return sandboxHost ? `https://${sandboxHost}` : url.origin;
});

export const getPreferredLang = createServerFn({ method: "GET" }).handler(() => {
  const al = (getRequestHeader("accept-language") ?? "").toLowerCase();
  return al.startsWith("pt") ? "pt" : "en";
});
