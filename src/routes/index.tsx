import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPreferredLang } from "@/lib/origin.functions";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const lang = await getPreferredLang();
    throw redirect({ to: "/$lang", params: { lang } });
  },
  head: () => ({
    meta: [
      { title: "SAVORA — Instagram Downloader" },
      { name: "description", content: "Download Instagram videos, Reels, photos and Stories in HD." },
      { property: "og:title", content: "SAVORA — Instagram Downloader" },
      { property: "og:description", content: "Download Instagram videos, Reels, photos and Stories in HD." },
    ],
  }),
});
