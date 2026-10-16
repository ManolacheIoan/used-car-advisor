/** Visible FAQ plus schema.org FAQPage (questions and answers exactly as shown). */
export function FaqBlock({
  items,
  indexable,
}: {
  items: { q: string; a: string }[];
  indexable: boolean;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
  return (
    <section aria-labelledby="faq-h" className="space-y-2">
      {indexable && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <h2 id="faq-h" className="text-lg font-semibold">
        Întrebări frecvente
      </h2>
      <div className="space-y-2">
        {items.map((i) => (
          <details key={i.q} className="card p-3">
            <summary className="cursor-pointer font-medium">{i.q}</summary>
            <p className="text-muted mt-2 text-sm">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
