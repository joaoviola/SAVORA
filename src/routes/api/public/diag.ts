import { createFileRoute } from "@tanstack/react-router";

/**
 * Diagnóstico do servidor: mostra o que ESTE servidor consegue fazer.
 *
 * Existe porque a extração pode funcionar numa máquina e falhar noutra —
 * o Instagram responde conforme o IP, e o Worker Hub pode estar
 * inalcançável a partir daqui. Sem isto, uma falha em produção é
 * indistinguível de um bug no código.
 *
 *   /api/public/diag                -> Reel público conhecido
 *   /api/public/diag?sc=<shortcode> -> Reel à escolha
 *
 * Nunca devolve valores de secrets: só se existem, o comprimento, e o
 * host/caminho do SCRAPER_URL (para apanhar erros de escrita).
 */
export const Route = createFileRoute("/api/public/diag")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { UA_FALLBACKS, tryFetchEmbed } = await import("@/lib/extract/instagram-embed.server");
        const sc = (new URL(request.url).searchParams.get("sc") ?? "Dbn-XJhk0_-").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);

        // ---- 1. extração direta (instagramEmbed) ----
        const attempts = [];
        for (const ua of UA_FALLBACKS) attempts.push(await tryFetchEmbed(sc, ua));
        const diretoOk = attempts.some((a) => a.hasContext);

        // ---- 2. Worker Hub (customScraper) ----
        const { resolverEndpoint } = await import("@/lib/extract/custom-scraper.server");
        const rawUrl = (await resolverEndpoint()) ?? "";
        const rawKey = process.env["SCRAPER_API_KEY"] ?? "";
        const workerHub: Record<string, unknown> = {
          origem_do_endereco: process.env["SCRAPER_URL"]?.trim() === rawUrl && rawUrl ? "secret SCRAPER_URL" : rawUrl ? "hub.json no repositorio" : "nenhuma",
          SCRAPER_URL_secret_definido: Boolean(process.env["SCRAPER_URL"]),
          SCRAPER_API_KEY_definido: Boolean(rawKey),
          chave_comprimento: rawKey.length,
          chave_tem_espacos_nas_pontas: rawKey !== rawKey.trim(),
          chave_tem_aspas: /^["']|["']$/.test(rawKey),
          chave_tem_prefixo_errado: /^scraper_api_key=/i.test(rawKey.trim()),
        };

        if (!rawUrl) {
          workerHub["veredito"] = "SCRAPER_URL nao esta definido no servidor. O customScraper devolve not_configured e nao ha segunda tentativa.";
        } else {
          try {
            const u = new URL(rawUrl);
            workerHub["url_host"] = u.host;
            workerHub["url_caminho"] = u.pathname;
            workerHub["caminho_parece_certo"] = u.pathname.endsWith("/api/scrape");
          } catch {
            workerHub["url_host"] = "URL INVALIDA";
          }
          const t0 = Date.now();
          try {
            const r = await fetch(rawUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(rawKey ? { Authorization: `Bearer ${rawKey}` } : {}) },
              body: JSON.stringify({ url: `https://www.instagram.com/reel/${sc}/`, type: "reel" }),
              signal: AbortSignal.timeout(45000),
            });
            const txt = await r.text();
            let j: any = null;
            try { j = JSON.parse(txt); } catch { /* resposta nao-JSON */ }
            workerHub["http_status"] = r.status;
            workerHub["ms"] = Date.now() - t0;
            workerHub["itens_recebidos"] = Array.isArray(j?.items) ? j.items.length : 0;
            workerHub["detalhe"] = typeof j?.detail === "string" ? j.detail.slice(0, 300) : txt.slice(0, 200);
            workerHub["veredito"] =
              r.status === 200 && Array.isArray(j?.items) && j.items.length
                ? "Worker Hub OK: este servidor alcanca-o e recebe midia."
                : r.status === 401
                  ? "Worker Hub recusou a chave. Ver 'detalhe' — ele diz o comprimento recebido vs esperado."
                  : `Worker Hub respondeu ${r.status}. Ver 'detalhe'.`;
          } catch (e) {
            workerHub["http_status"] = null;
            workerHub["ms"] = Date.now() - t0;
            workerHub["erro_rede"] = e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 200) : "desconhecido";
            workerHub["veredito"] = "Este servidor NAO consegue alcancar o SCRAPER_URL (rede/tunel em baixo/egress bloqueado).";
          }
        }

        const body = {
          shortcode: sc,
          extracao_direta: {
            ok: diretoOk,
            veredito: diretoOk
              ? "Este servidor extrai sozinho — o Worker Hub nem seria preciso."
              : attempts.some((a) => a.status === 200)
                ? "200 sem conteudo: login wall. O IP deste servidor esta bloqueado; mudar User-Agent nao resolve."
                : "Nao conseguiu alcancar o Instagram.",
            attempts,
          },
          worker_hub: workerHub,
          node: process.version,
          geradoEm: new Date().toISOString(),
        };
        return new Response(JSON.stringify(body, null, 2), {
          headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
