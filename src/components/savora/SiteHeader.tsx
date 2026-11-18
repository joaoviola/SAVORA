import { Link, useLocation } from "@tanstack/react-router";
import { DOWNLOADER_KEYS, SLUGS, pageFromSlug, type Lang } from "@/i18n/pages";
import { t } from "@/i18n/content";
import { Logo } from "./Logo";

export function SiteHeader({ lang }: { lang: Lang }) {
  const { pathname } = useLocation();
  const slug = pathname.split("/")[2] ?? "";
  const key = pageFromSlug(lang, slug);
  const other: Lang = lang === "en" ? "pt" : "en";
  const c = t(lang);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/$lang" params={{ lang }} aria-label="SAVORA"><Logo /></Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground lg:flex" aria-label={c.ui.downloaders}>
          {DOWNLOADER_KEYS.map((k) => (
            <Link key={k} to="/$lang/$slug" params={{ lang, slug: SLUGS[k][lang] }} className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {c.pages[k].nav}
            </Link>
          ))}
        </nav>
        <div className="flex items-center rounded-md border border-border p-0.5 text-xs font-semibold" role="group" aria-label={c.ui.language}>
          {(["en", "pt"] as const).map((l) => (
            <Link
              key={l}
              to={key ? "/$lang/$slug" : "/$lang"}
              params={key ? { lang: l, slug: SLUGS[key][l] } : { lang: l }}
              hrefLang={l}
              className={`rounded px-2.5 py-1 uppercase ${l === lang ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              aria-current={l === lang ? "true" : undefined}
            >
              {l}
            </Link>
          ))}
          <span className="sr-only">{other}</span>
        </div>
      </div>
    </header>
  );
}
