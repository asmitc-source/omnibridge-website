import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { CtaBand, PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";
import { ButtonLink } from "@/components/ui/Button";
import { TextMarks } from "@/components/ui/Marks";
import { ChannelPoster, PosterFrame } from "@/components/scenes/Posters";

export const metadata = pageMetadata("suppliers");

export default function SuppliersPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <PageIntro eyebrow="suppliers.eyebrow" title="suppliers.h1" sub="suppliers.sub" />
          <div className="hero-actions">
            <ButtonLink href="/waitlist?type=supplier">{copy("suppliers.cta.hero")}</ButtonLink>
          </div>
        </div>
      </section>
      <section id="hosted" className="section-compact">
        <div className="container">
          <h2 className="type-h2">{copy("suppliers.hosted.h2")}</h2>
          <p>
            <T k="suppliers.hosted.body.1" />
          </p>
          <p>{copy("suppliers.hosted.body.2")}</p>
          <p>{copy("suppliers.hosted.body.3")}</p>
          <TextMarks k="suppliers.hosted.marks" />
          <p className="muted">{copy("suppliers.hosted.disclaimer")}</p>
          <figure className="diagram">
            <PosterFrame label={copy("suppliers.alt.stream")}>
              <ChannelPoster />
            </PosterFrame>
          </figure>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2 className="type-h2">{copy("suppliers.quote.h2")}</h2>
          <ol>
            <li>{copy("suppliers.quote.1")}</li>
            <li>{copy("suppliers.quote.2")}</li>
            <li>{copy("suppliers.quote.3")}</li>
            <li>{copy("suppliers.quote.4")}</li>
            <li>{copy("suppliers.quote.5")}</li>
          </ol>
          <p className="solid-meta">{copy("suppliers.quote.status")}</p>
          <h2 className="type-h2">{copy("suppliers.control.h2")}</h2>
          <ul>
            <li>{copy("suppliers.control.1")}</li>
            <li>{copy("suppliers.control.2")}</li>
            <li>{copy("suppliers.control.3")}</li>
            <li>{copy("suppliers.control.4")}</li>
            <li>{copy("suppliers.control.5")}</li>
          </ul>
          <h2 className="type-h2">{copy("suppliers.faq.h2")}</h2>
          <div className="faq">
            <details>
              <summary>{copy("suppliers.faq.q1.question")}</summary>
              <p>{copy("suppliers.faq.q1.answer")}</p>
            </details>
            <details>
              <summary>{copy("suppliers.faq.q2.question")}</summary>
              <p>{copy("suppliers.faq.q2.answer")}</p>
            </details>
            <details>
              <summary>{copy("suppliers.faq.q3.question")}</summary>
              <p>{copy("suppliers.faq.q3.answer")}</p>
            </details>
            <details>
              <summary>{copy("suppliers.faq.q4.question")}</summary>
              <p>{copy("suppliers.faq.q4.answer")}</p>
            </details>
          </div>
        </div>
      </section>
      <CtaBand title="suppliers.cta.h2" primary="suppliers.cta.button" primaryHref="/waitlist?type=supplier" />
    </>
  );
}
