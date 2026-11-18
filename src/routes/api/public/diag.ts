import { createFileRoute } from "@tanstack/react-router";

/**
 * Diagnóstico do servidor: mostra o que ESTE servidor recebe do Instagram.
 *
 * Existe porque a extração pode funcionar numa máquina e falhar noutra —
 * o Instagram responde conforme o IP, a região e o momento. Sem isto, uma
 * falha em produção é indistinguível de um bug no código.
 *
 *   /api/public/diag                -> usa um Reel público conhecido
 *   /api/public/diag?sc=<shortcode> -> usa um Reel à escolha
 *
 * Como ler: `hasContext: true` em alguma tentativa = o servidor consegue
 * extrair. Todas `false` com `length` grande = o IP do servidor está a
 * apanhar login wall, e nenhum User-Agent resolve isso.
 *
 * Não expõe segredos: só estado de rede.
 */
export const Route = createFileRoute("/api/public/diag")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { UA_FALLBACKS, tryFetchEmbed } = await import("@/lib/extract/instagram-embed.server");
        const sc = (new URL(request.url).searchParams.get("sc") ?? "Dbn-XJhk0_-").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);

        const attempts = [];
        for (const ua of UA_FALLBACKS) attempts.push(await tryFetchEmbed(sc, ua));

        const funcionou = attempts.find((a) => a.hasContext);
        const body = {
          shortcode: sc,
          ok: Boolean(funcionou),
          veredito: funcionou
            ? `Este servidor CONSEGUE extrair (UA: ${funcionou.ua}).`
            : attempts.some((a) => a.status === 200)
              ? "Este servidor recebe 200 mas sem conteudo: login wall. O IP do servidor esta bloqueado — trocar User-Agent nao resolve."
              : "Este servidor nao conseguiu sequer alcancar o Instagram. Ver 'error' em cada tentativa.",
          attempts,
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
