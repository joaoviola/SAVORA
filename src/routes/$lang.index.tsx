import { Link, createFileRoute } from "@tanstack/react-router";
import { Film, Image as ImageIcon, Clapperboard, CircleDot, Star, Layers } from "lucide-react";
import { DOWNLOADER_KEYS, SLUGS, isLang, type Lang } from "@/i18n/pages";
import { t } from "@/i18n/content";
import { seoHead } from "@/lib/seo";
import { Downloader } from "@/components/savora/Downloader";
import { Faq, faqJsonLd } from "@/components/savora/Faq";
import { getRequestOrigin } from "@/lib/origin.functions";

const ICONS = { video: Film, photo: ImageIcon, reels: Clapperboard, story: CircleDot, highlights: Star, carousel: Layers };

export const Route = createFileRoute("/$lang/")({
  loader: async () => ({ origin: await getRequestOrigin() }),
  head: ({ params, loaderData }) => {
    const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
    const c = t(lang);
    const origin = loaderData?.origin ?? "";
    return seoHead({
      origin, lang, title: c.home.title, description: c.home.description,
      jsonLd: [
        { "@context": "https://schema.org", "@type": "WebApplication", name: "SAVORA", url: `${origin}/${lang}`, applicationCategory: "MultimediaApplication", operatingSystem: "Any", inLanguage: lang, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
        { "@context": "https://schema.org", "@type": "Organization", name: "SAVORA", url: origin, logo: `${origin}/icons/icon-512.png`, email: "hello@savora.app" },
        faqJsonLd(c.home.faq),
      ],
    });
  },
  component: Home,
});

function Home() {
  const { lang: l } = Route.useParams();
  const lang = l as Lang;
  const c = t(lang);
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-14 text-center sm:pt-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{c.ui.tagline}</p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">{c.home.h1}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{c.home.lead}</p>
          <div className="mt-10"><Downloader lang={lang} /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <h2 className="font-display text-2xl font-bold tracking-tight">{c.ui.categoriesTitle}</h2>
        <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {DOWNLOADER_KEYS.map((k) => {
            const Icon = ICONS[k];
            return (
              <li key={k} className="bg-background">
                <Link to="/$lang/$slug" params={{ lang, slug: SLUGS[k][lang] }} className="flex h-full flex-col gap-3 p-5 hover:bg-secondary">
                  <Icon className="h-6 w-6 text-primary" /><span className="font-semibold">{c.pages[k].nav}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <h2 className="font-display text-3xl font-bold tracking-tight">{c.ui.stepsTitle}</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {c.ui.steps.map((s, i) => (
            <li key={s.h} className="border-t-2 border-foreground pt-4">
              <span className="font-display text-5xl font-bold text-primary">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{s.h}</h3>
              <p className="mt-1 text-muted-foreground">{s.p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <div className="rounded-xl bg-foreground p-8 text-background sm:p-12">
          <h2 className="font-display text-3xl font-bold tracking-tight">{c.ui.featuresTitle}</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {c.ui.features.map((f) => (
              <div key={f.h}><h3 className="font-semibold text-primary">{f.h}</h3><p className="mt-2 text-sm opacity-80">{f.p}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <h2 className="font-display text-3xl font-bold tracking-tight">{c.ui.downloaders}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DOWNLOADER_KEYS.map((k) => (
            <article key={k} className="rounded-lg border border-border p-6">
              <h3 className="font-display text-xl font-bold">{c.pages[k].h1}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.pages[k].lead}</p>
              <Link to="/$lang/$slug" params={{ lang, slug: SLUGS[k][lang] }} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">{c.pages[k].nav} →</Link>
            </article>
          ))}
        </div>
      </section>

      <Faq title={c.ui.faqTitle} items={c.home.faq} />

      <section className="mx-auto max-w-3xl space-y-8 px-4 pt-20">
        {c.home.sections.map((s) => (
          <div key={s.h}><h2 className="font-display text-2xl font-bold tracking-tight">{s.h}</h2>{s.p.map((p) => <p key={p} className="mt-3 leading-relaxed text-muted-foreground">{p}</p>)}</div>
        ))}
      </section>
    </>
  );
}
