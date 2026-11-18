import { Link } from "@tanstack/react-router";
import { DOWNLOADER_KEYS, LEGAL_KEYS, SLUGS, type Lang, type PageKey } from "@/i18n/pages";
import { t } from "@/i18n/content";
import { Logo } from "./Logo";

export function SiteFooter({ lang }: { lang: Lang }) {
  const c = t(lang);
  const col = (title: string, keys: readonly PageKey[]) => (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <ul className="space-y-2 text-sm">
        {keys.map((k) => (
          <li key={k}><Link to="/$lang/$slug" params={{ lang, slug: SLUGS[k][lang] }} className="hover:text-primary">{c.pages[k].nav}</Link></li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="mt-24 border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{c.ui.tagline}</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{c.ui.disclaimer}</p>
          <a href="mailto:hello@savora.app" className="text-sm font-medium hover:text-primary">hello@savora.app</a>
        </div>
        {col(c.ui.downloaders, DOWNLOADER_KEYS)}
        {col(c.ui.legal, LEGAL_KEYS)}
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} SAVORA. {c.ui.rights}</div>
    </footer>
  );
}
