import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";
import { isLang } from "@/i18n/pages";
import { SiteHeader } from "@/components/savora/SiteHeader";
import { SiteFooter } from "@/components/savora/SiteFooter";
import { getRequestOrigin } from "@/lib/origin.functions";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: async () => ({ origin: await getRequestOrigin() }),
  staleTime: Infinity,
  component: LangLayout,
});

function LangLayout() {
  const { lang } = Route.useParams();
  if (!isLang(lang)) return null;
  return (
    <div lang={lang} className="flex min-h-screen flex-col">
      <SiteHeader lang={lang} />
      <main className="flex-1"><Outlet /></main>
      <SiteFooter lang={lang} />
    </div>
  );
}
