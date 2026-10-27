import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { CtaBand, PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";

export const metadata = pageMetadata("manifesto");

export default function ManifestoPage() {
  return (
    <>
      <section className="section">
        <div className="container measure">
          <PageIntro eyebrow="manifesto.eyebrow" title="manifesto.h1" />
          <p className="type-body-l">{copy("manifesto.line.1")}</p>
          <p className="type-body-l">{copy("manifesto.line.2")}</p>
          <p className="type-body-l">{copy("manifesto.line.3")}</p>
          <p className="type-body-l">{copy("manifesto.line.4")}</p>
          <p className="type-body-l">{copy("manifesto.line.5")}</p>
          <p className="type-body-l">{copy("manifesto.line.6")}</p>
          <p className="type-body-l">{copy("manifesto.line.7")}</p>
          <p className="type-body-l">{copy("manifesto.line.8")}</p>
          <p className="type-body-l">{copy("manifesto.line.9")}</p>
        </div>
      </section>
      <section className="section-compact">
        <div className="container">
          <h2 className="type-h2">{copy("manifesto.principles.h2")}</h2>
          <div className="card-grid">
            <article className="panel">
              <h3 className="type-h3">{copy("manifesto.principle.1.title")}</h3>
              <p>{copy("manifesto.principle.1.body")}</p>
            </article>
            <article className="panel">
              <h3 className="type-h3">{copy("manifesto.principle.2.title")}</h3>
              <p>{copy("manifesto.principle.2.body")}</p>
            </article>
            <article className="panel">
              <h3 className="type-h3">{copy("manifesto.principle.3.title")}</h3>
              <p>{copy("manifesto.principle.3.body")}</p>
            </article>
            <article className="panel">
              <h3 className="type-h3">{copy("manifesto.principle.4.title")}</h3>
              <p>{copy("manifesto.principle.4.body")}</p>
            </article>
          </div>
          <h2 className="type-h2">{copy("manifesto.not.h2")}</h2>
          <ul>
            <li>{copy("manifesto.not.1")}</li>
            <li>{copy("manifesto.not.2")}</li>
            <li>{copy("manifesto.not.3")}</li>
            <li>{copy("manifesto.not.4")}</li>
          </ul>
          <p>
            <T k="manifesto.team.contact" />
          </p>
        </div>
      </section>
      <CtaBand title="manifesto.cta.h2" primary="manifesto.cta.button" primaryHref="/waitlist" />
    </>
  );
}
