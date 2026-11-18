import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { DOWNLOADER_KEYS, SLUGS, isHidden, isLang, pageFromSlug, pathFor, type Lang } from "@/i18n/pages";
import { t } from "@/i18n/content";
import { seoHead } from "@/lib/seo";
import { Downloader } from "@/components/savora/Downloader";
import { Faq, faqJsonLd } from "@/components/savora/Faq";
import { getRequestOrigin } from "@/lib/origin.functions";

export const Route = createFileRoute("/$lang/$slug")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
    const key = pageFromSlug(params.lang, params.slug);
    // Páginas escondidas devolvem 404 em vez de só sumirem do menu: deixar a
    // rota viva manteria o link indexado e prometendo algo que dá erro.
    if (!key || isHidden(key)) throw notFound();
  },
  loader: async () => ({ origin: await getRequestOrigin() }),
  head: ({ params, loaderData }) => {
    const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
    const key = pageFromSlug(lang, params.slug);
    if (!key) return { meta: [{ title: "Not found | SAVORA" }, { name: "robots", content: "noindex" }] };
    const p = t(lang).pages[key];
    const origin = loaderData?.origin ?? "";
    return seoHead({
      origin, lang, page: key, title: p.title, description: p.description,
      jsonLd: [
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "SAVORA", item: origin + pathFor(lang) },
          { "@type": "ListItem", position: 2, name: p.h1, item: origin + pathFor(lang, key) },
        ] },
        ...(p.faq ? [faqJsonLd(p.faq)] : []),
      ],
    });
  },
  component: Page,
});

function Page() {
  const { lang: l, slug } = Route.useParams();
  const lang = l as Lang;
  const key = pageFromSlug(lang, slug)!;
  const c = t(lang);
  const p = c.pages[key];
  const isTool = (DOWNLOADER_KEYS as readonly string[]).includes(key);
  return (
    <>
      <section className="border-b border-border">
        <div className={`mx-auto max-w-3xl px-4 pb-14 pt-12 ${isTool ? "text-center" : ""}`}>
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
            <Link to="/$lang" params={{ lang }} className="hover:text-foreground">SAVORA</Link> / <span>{p.nav}</span>
          </nav>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{p.h1}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{p.lead}</p>
          {isTool && <div className="mt-10"><Downloader lang={lang} /></div>}
        </div>
      </section>
      <article className="mx-auto max-w-3xl space-y-8 px-4 pt-14">
        {p.sections.map((s) => (
          <section key={s.h}><h2 className="font-display text-2xl font-bold tracking-tight">{s.h}</h2>{s.p.map((x) => <p key={x} className="mt-3 leading-relaxed text-muted-foreground">{x}</p>)}</section>
        ))}
        {isTool && (
          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight">{c.ui.stepsTitle}</h2>
            <ol className="mt-4 space-y-3">{c.ui.steps.map((s, i) => <li key={s.h}><strong className="text-primary">{i + 1}.</strong> <strong>{s.h}</strong> — <span className="text-muted-foreground">{s.p}</span></li>)}</ol>
          </section>
        )}
      </article>
      {p.faq && <Faq title={c.ui.faqTitle} items={p.faq} />}
      {isTool && (
        <section className="mx-auto max-w-3xl px-4 pt-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{c.ui.downloaders}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/$lang" params={{ lang }} className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-foreground">{c.home.h1}</Link>
            {DOWNLOADER_KEYS.filter((k) => k !== key).map((k) => (
              <Link key={k} to="/$lang/$slug" params={{ lang, slug: SLUGS[k][lang] }} className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-foreground">{c.pages[k].h1}</Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
