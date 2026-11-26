import type { contentPages } from "@/content/pages";

export function ContentPage({ page }: { page: (typeof contentPages)[string] }) {
  return (
    <article className="container-page max-w-3xl py-10">
      {page.draft && <p className="mb-4 inline-block rounded-full bg-warn-50 px-3 py-1 text-xs font-semibold text-warn-600">Draft — requires legal review before launch</p>}
      <h1 className="text-3xl font-extrabold">{page.title}</h1>
      <div className="mt-6 space-y-6 leading-relaxed">
        {page.sections.map((s, i) => (
          <section key={i}>{s.h && <h2 className="mb-1.5 text-lg font-bold">{s.h}</h2>}<p>{s.p}</p></section>
        ))}
      </div>
    </article>
  );
}
