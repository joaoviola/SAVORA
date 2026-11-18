export const LANGS = ["en", "pt"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

export const PAGE_KEYS = [
  "video", "photo", "reels", "story", "highlights", "carousel",
  "about", "contact", "privacy", "terms", "copyright",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];
export const DOWNLOADER_KEYS = ["video", "photo", "reels", "story", "highlights", "carousel"] as const satisfies readonly PageKey[];
export const LEGAL_KEYS = ["about", "contact", "privacy", "terms", "copyright"] as const satisfies readonly PageKey[];

export const SLUGS: Record<PageKey, Record<Lang, string>> = {
  video: { en: "instagram-video-downloader", pt: "baixar-videos-instagram" },
  photo: { en: "instagram-photo-downloader", pt: "baixar-fotos-instagram" },
  reels: { en: "instagram-reels-downloader", pt: "baixar-reels-instagram" },
  story: { en: "instagram-story-downloader", pt: "descarregar-stories-instagram" },
  highlights: { en: "instagram-highlights-downloader", pt: "baixar-destaques-instagram" },
  carousel: { en: "instagram-carousel-downloader", pt: "baixar-carrossel-instagram" },
  about: { en: "about", pt: "sobre" },
  contact: { en: "contact", pt: "contacto" },
  privacy: { en: "privacy-policy", pt: "politica-de-privacidade" },
  terms: { en: "terms-of-service", pt: "termos-de-servico" },
  copyright: { en: "copyright", pt: "direitos-de-autor" },
};

export function pageFromSlug(lang: Lang, slug: string): PageKey | undefined {
  return PAGE_KEYS.find((k) => SLUGS[k][lang] === slug);
}
export const pathFor = (lang: Lang, key?: PageKey) => (key ? `/${lang}/${SLUGS[key][lang]}` : `/${lang}`);
