export const LANGS = ["en", "pt"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

export const PAGE_KEYS = [
  "video", "photo", "reels", "story", "highlights", "carousel",
  "about", "contact", "privacy", "terms", "copyright",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

/**
 * Páginas escondidas enquanto não existe caminho de extração.
 *
 * Story e Highlight exigem sessão autenticada no Instagram: o endpoint
 * anónimo responde 404 e o GraphQL responde 403. O scraper devolve 422
 * (`unsupported`) para estes tipos, por isso anunciá-los na UI levaria o
 * utilizador a um erro garantido.
 *
 * Para reativar: esvazie este Set. Rotas, slugs e traduções continuam
 * todas no sítio — só deixam de ser ligadas e deixam de ser indexáveis.
 */
export const HIDDEN_KEYS: ReadonlySet<PageKey> = new Set<PageKey>(["story", "highlights"]);
export const isHidden = (k: PageKey): boolean => HIDDEN_KEYS.has(k);

const ALL_DOWNLOADER_KEYS = ["video", "photo", "reels", "story", "highlights", "carousel"] as const satisfies readonly PageKey[];

/**
 * Mantém a união estreita das 6 chaves de downloader (e não PageKey inteiro):
 * a home indexa um mapa de ícones com esta lista, e alargar o tipo faria
 * entrar 'about', 'contact' e afins, que não existem lá.
 */
export type DownloaderKey = (typeof ALL_DOWNLOADER_KEYS)[number];

/** Alimenta header, footer, home e links relacionados. */
export const DOWNLOADER_KEYS: readonly DownloaderKey[] = ALL_DOWNLOADER_KEYS.filter((k) => !isHidden(k));
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
