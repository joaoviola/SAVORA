/**
 * Verifica o Worker Hub atraves do tunel publico, exatamente como o
 * servidor do SAVORA o vai chamar.
 *
 *   node scraper/testar_tunel.mjs https://<tunel> <SCRAPER_API_KEY>
 */
const [base, key] = process.argv.slice(2);
if (!base || !key) { console.error("uso: node testar_tunel.mjs <url-do-tunel> <chave>"); process.exit(1); }

const url = `${base.replace(/\/$/, "")}/api/scrape`;
const casos = [
  ["reel publico", "https://www.instagram.com/reel/Dbn-XJhk0_-/", "reel", true],
  ["inexistente", "https://www.instagram.com/reel/ZZZnaoexiste9/", "reel", false],
];

let falhas = 0;
for (const [nome, alvo, tipo, esperaOk] of casos) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ url: alvo, type: tipo }),
      signal: AbortSignal.timeout(40000),
    });
    const ms = Date.now() - t0;
    const j = await r.json().catch(() => null);
    const ok = r.status === 200 && Array.isArray(j?.items) && j.items.length > 0;
    if (ok !== esperaOk) falhas++;
    console.log(`  ${nome.padEnd(14)} HTTP ${r.status} ${String(ms).padStart(5)}ms  ${ok ? `@${j.author} ${j.items[0].is_video ? "video" : "foto"}` : `(${j?.detail ?? "sem itens"})`}`);
  } catch (e) { falhas++; console.log(`  ${nome.padEnd(14)} FALHOU ${e.name}`); }
}

// chave errada tem de ser recusada
const bad = await fetch(url, {
  method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer errada" },
  body: JSON.stringify({ url: casos[0][1], type: "reel" }), signal: AbortSignal.timeout(20000),
}).catch(() => null);
const protegido = bad?.status === 401;
if (!protegido) falhas++;
console.log(`  ${"chave errada".padEnd(14)} HTTP ${bad?.status ?? "?"}  ${protegido ? "recusada (bom)" : "ACEITE (MAU)"}`);

console.log(falhas ? `\n  ${falhas} verificacao(oes) falharam` : "\n  tudo OK — pode ligar o SCRAPER_URL");
process.exit(falhas ? 1 : 0);
