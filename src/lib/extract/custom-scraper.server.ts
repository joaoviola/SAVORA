import type { ContentType, ExtractResponse, Extractor, MediaItem } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const str = (v: any) => (typeof v === "string" && v.startsWith("http") ? v : undefined);

function toItem(m: any): MediaItem | null {
  const video = str(m.video_url) ?? str(m.videoUrl) ?? (m.type === "video" ? str(m.url) : undefined);
  const image = str(m.display_url) ?? str(m.image_url) ?? str(m.thumbnail) ?? str(m.thumbnail_url) ?? str(m.url);
  const variants = Array.isArray(m.variants) || Array.isArray(m.qualities)
    ? (m.variants ?? m.qualities).map((v: any) => ({ quality: String(v.quality ?? v.label ?? (v.height ? `${v.height}p` : "HD")), url: str(v.url) })).filter((v: any) => v.url)
    : [];
  if (!variants.length && (video || image)) variants.push({ quality: "HD", url: (video ?? image)! });
  if (!variants.length) return null;
  return { kind: video || m.type === "video" || m.is_video ? "video" : "image", thumbnail: image ?? variants[0].url, variants };
}

/**
 * Descoberta do endereço do Worker Hub.
 *
 * O hub corre atrás de um túnel efémero, cujo endereço muda a cada
 * reinício. Guardá-lo apenas num secret significa que cada troca de túnel
 * deixa a app quebrada até alguém abrir o painel. Por isso o endereço vive
 * em `scraper/hub.json` no repositório: trocar de túnel passa a ser um
 * commit, e a chave — essa sim estável — continua a ser um secret.
 *
 * Ordem: hub.json → `SCRAPER_URL` → não configurado.
 *
 * O hub.json vem primeiro de propósito. Um `SCRAPER_URL` guardado no painel
 * fica desatualizado assim que o túnel muda, e aí um secret obsoleto
 * ganharia da fonte que está correta. O secret serve agora de rede de
 * segurança para quando o GitHub estiver inalcançável.
 */
const HUB_JSON = "https://raw.githubusercontent.com/joaoviola/SAVORA/main/scraper/hub.json";
const DESCOBERTA_TTL = 60_000;
let descoberto: { url: string | null; exp: number } = { url: null, exp: 0 };

export async function resolverEndpoint(): Promise<string | null> {
  const manual = process.env["SCRAPER_URL"]?.trim() || null;

  const agora = Date.now();
  if (descoberto.exp > agora) return descoberto.url ?? manual;
  try {
    const r = await fetch(`${HUB_JSON}?t=${Math.floor(agora / DESCOBERTA_TTL)}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    const j = r.ok ? ((await r.json()) as { url?: unknown }) : null;
    const u = typeof j?.url === "string" && j.url.startsWith("https://") ? j.url : null;
    descoberto = { url: u, exp: agora + DESCOBERTA_TTL };
    return u ?? manual;
  } catch {
    // Mantém o último endereço conhecido em vez de ficar sem hub.
    descoberto = { url: descoberto.url, exp: agora + DESCOBERTA_TTL };
    return descoberto.url ?? manual;
  }
}

/** Adapter for the owner's JSON scraper. Adjust mapping here once the response format is known. */
export const customScraper: Extractor = {
  name: "custom-scraper",
  async extract(url: string, type: ContentType): Promise<ExtractResponse> {
    const endpoint = await resolverEndpoint();
    if (!endpoint) return { ok: false, error: "not_configured" };
    const key = process.env["SCRAPER_API_KEY"];
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify({ url, type }),
        // 55s, nao 25s: no plano gratuito do Render o servico dorme apos
        // inatividade e leva ~50s a acordar. Com 25s o primeiro pedido
        // depois de uma pausa falhava sempre, mesmo estando tudo correto.
        signal: AbortSignal.timeout(55000),
      });
    } catch (e) {
      console.error("scraper fetch failed", e);
      return { ok: false, error: "upstream" };
    }
    if (res.status === 404) return { ok: false, error: "not_found" };
    if (res.status === 403) return { ok: false, error: "private" };
    if (!res.ok) return { ok: false, error: "upstream" };
    const json: any = await res.json().catch(() => null);
    if (!json) return { ok: false, error: "upstream" };
    const err = String(json.error ?? "").toLowerCase();
    if (err.includes("private")) return { ok: false, error: "private" };
    if (err.includes("not found") || err.includes("deleted")) return { ok: false, error: "not_found" };
    const root = json.data ?? json;
    const list: any[] = root.items ?? root.media ?? root.carousel ?? root.children ?? (Array.isArray(root) ? root : [root]);
    const items = list.map(toItem).filter((x): x is MediaItem => !!x);
    if (!items.length) return { ok: false, error: err ? "upstream" : "unsupported" };
    return {
      ok: true,
      data: {
        type: items.length > 1 && type === "post" ? "carousel" : type,
        author: root.author ?? root.username ?? root.owner?.username,
        caption: typeof root.caption === "string" ? root.caption.slice(0, 280) : undefined,
        items,
      },
    };
  },
};
