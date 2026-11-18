import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ClipboardPaste, Loader2, Image as ImageIcon, Film, WifiOff } from "lucide-react";
import { extractMedia } from "@/lib/extract.functions";
import type { ExtractResponse } from "@/lib/extract/types";
import { t } from "@/i18n/content";
import type { Lang } from "@/i18n/pages";

export function Downloader({ lang }: { lang: Lang }) {
  const c = t(lang);
  const run = useServerFn(extractMedia);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<ExtractResponse | null>(null);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => { window.removeEventListener("online", u); window.removeEventListener("offline", u); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true); setRes(null);
    try { setRes(await run({ data: { url } })); }
    catch { setRes({ ok: false, error: "upstream" }); }
    finally { setBusy(false); }
  }
  async function paste() {
    try { setUrl(await navigator.clipboard.readText()); } catch { /* clipboard blocked */ }
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="flex flex-col gap-2 rounded-xl border-2 border-foreground bg-card p-2 shadow-[6px_6px_0_0_var(--color-foreground)] sm:flex-row">
        <label htmlFor="ig-url" className="sr-only">Instagram URL</label>
        <div className="flex flex-1 items-center gap-2 px-2">
          <input id="ig-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={c.ui.placeholder}
            className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground" autoComplete="off" />
          <button type="button" onClick={paste} className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground sm:inline-flex">
            <ClipboardPaste className="h-4 w-4" />{c.ui.paste}
          </button>
        </div>
        <button type="submit" disabled={busy || !online} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowDown className="h-5 w-5" />}
          {busy ? c.ui.loading : c.ui.download}
        </button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">{c.ui.respect}</p>
      {!online && <p className="mt-3 flex items-center gap-2 text-sm text-destructive"><WifiOff className="h-4 w-4" />{c.ui.offline}</p>}
      {res && !res.ok && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{c.ui.errors[res.error]}</p>}
      {res?.ok && (
        <section className="mt-6 text-left" aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm"><span className="rounded bg-foreground px-2 py-0.5 text-xs font-semibold text-background">{c.categories[res.data.type]}</span>
              {res.data.author && <span className="ml-2 text-muted-foreground">{c.ui.result.by} @{res.data.author}</span>}</p>
            {res.data.items.length > 1 && (
              <button type="button" className="text-sm font-semibold text-primary hover:underline"
                onClick={() => res.data.items.forEach((it, i) => setTimeout(() => { window.location.href = it.variants[0]?.url ?? ""; }, i * 800))}>
                {c.ui.result.all} ({res.data.items.length})
              </button>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {res.data.items.map((it, i) => (
              <li key={i} className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative aspect-square bg-secondary">
                  <img src={it.thumbnail} alt={`${c.ui.result.item} ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium">
                    {it.kind === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{it.kind === "video" ? c.ui.result.video : c.ui.result.image}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2">
                  {it.variants.map((v) => (
                    <a key={v.url} href={v.url} className="rounded-md bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background hover:bg-primary">
                      {c.ui.download} {v.quality}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
