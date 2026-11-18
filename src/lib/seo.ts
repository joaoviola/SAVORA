import { LANGS, pathFor, type Lang, type PageKey } from "@/i18n/pages";

export function seoHead(opts: { origin: string; lang: Lang; page?: PageKey; title: string; description: string; jsonLd?: object[] }) {
  const { origin, lang, page, title, description } = opts;
  const url = origin + pathFor(lang, page);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "SAVORA" },
      { property: "og:locale", content: lang === "pt" ? "pt_PT" : "en_US" },
      { property: "og:image", content: `${origin}/og-image.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${origin}/og-image.png` },
    ],
    links: [
      { rel: "canonical", href: url },
      ...LANGS.map((l) => ({ rel: "alternate", hrefLang: l, href: origin + pathFor(l, page) })),
      { rel: "alternate", hrefLang: "x-default", href: origin + pathFor("en", page) },
    ],
    scripts: (opts.jsonLd ?? []).map((j) => ({ type: "application/ld+json", children: JSON.stringify(j) })),
  };
}
