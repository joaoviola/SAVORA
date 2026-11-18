export function Faq({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-20">
      <h2 className="font-display text-3xl font-bold tracking-tight">{title}</h2>
      <div className="mt-6 divide-y divide-border border-y border-border">
        {items.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              <h3>{f.q}</h3><span className="text-xl text-primary transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export const faqJsonLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
