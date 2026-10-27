import { copy, type CopyKey } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { CtaBand, PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";

export const metadata = pageMetadata("product");

const MODULES = [1, 2, 3, 4, 5, 6] as const;

export default function ProductPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <PageIntro eyebrow="product.eyebrow" title="product.h1" sub="product.sub" note="product.status" />
          <div className="card-grid" style={{ marginTop: 32 }} role="list" aria-label={copy("product.alt.orbit")}>
            {MODULES.map((n) => (
              <article key={n} className="panel" role="listitem">
                <p className="step-index">{String(n).padStart(2, "0")}</p>
                <p className="eyebrow">{copy(`product.module.${n}.tag` as CopyKey)}</p>
                <h2 className="type-h3">{copy(`product.module.${n}.name` as CopyKey)}</h2>
                <p className="muted">
                  <T k={`product.module.${n}.body` as CopyKey} />
                </p>
              </article>
            ))}
          </div>
          <article className="panel panel-dashed" style={{ marginTop: 16 }}>
            <p className="eyebrow">{copy("product.later.label")}</p>
            <h2 className="type-h3">{copy("product.later.name")}</h2>
            <p className="muted">{copy("product.later.body")}</p>
          </article>
        </div>
      </section>
      <section className="section-compact">
        <div className="container measure">
          <h2 className="type-h2">{copy("product.mvp.h2")}</h2>
          <p>{copy("product.mvp.body")}</p>
        </div>
      </section>
      <CtaBand
        title="product.cta.h2"
        primary="product.cta.button"
        primaryHref="/waitlist"
        secondary="product.cta.secondary"
        secondaryHref="/how-it-works"
      />
    </>
  );
}
