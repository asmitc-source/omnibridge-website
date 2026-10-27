import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { BulletList, CtaBand, PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";
import { ButtonLink } from "@/components/ui/Button";
import { RedAlertModal } from "@/components/demo/RedAlertModal";
import { NetworkPoster, PosterFrame } from "@/components/scenes/Posters";

export const metadata = pageMetadata("how");

const STEPS = [
  { n: 1, alt: "how.alt.step1" },
  { n: 2, alt: "how.alt.step2" },
  { n: 3, alt: "how.alt.step3" },
  { n: 4, alt: "how.alt.step4" },
  { n: 5, alt: "how.alt.step5" },
] as const;

export default function HowPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <PageIntro eyebrow="how.eyebrow" title="how.h1" sub="how.sub" />
          <p className="muted">{copy("how.intro.caption")}</p>
        </div>
      </section>
      <section id="steps" className="section-compact">
        <div className="container" style={{ display: "grid", gap: 28 }}>
          {STEPS.map((step) => (
            <article key={step.n} className="split-grid">
              <div>
                <p className="step-index">{copy("how.step.label", { n: step.n })}</p>
                <h2 className="type-h2">
                  {step.n === 1 ? copy("how.step.1.title") : null}
                  {step.n === 2 ? copy("how.step.2.title") : null}
                  {step.n === 3 ? copy("how.step.3.title") : null}
                  {step.n === 4 ? copy("how.step.4.title") : null}
                  {step.n === 5 ? copy("how.step.5.title") : null}
                </h2>
                <p className="muted">
                  {step.n === 1 ? <T k="how.step.1.body" /> : null}
                  {step.n === 2 ? <T k="how.step.2.body" /> : null}
                  {step.n === 3 ? <T k="how.step.3.body" /> : null}
                  {step.n === 4 ? <T k="how.step.4.body" /> : null}
                  {step.n === 5 ? <T k="how.step.5.body" /> : null}
                </p>
              </div>
              <figure className="diagram">
                <PosterFrame label={copy(step.alt)}>
                  <NetworkPoster id={`step-${step.n}`} />
                </PosterFrame>
              </figure>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="container measure">
          <h2 className="type-h2">{copy("how.human.h2")}</h2>
          <p>{copy("how.human.body.1")}</p>
          <p>{copy("how.human.body.2")}</p>
          <p>{copy("how.human.body.3")}</p>
          <RedAlertModal staticMode />
        </div>
      </section>
      <section className="section-compact">
        <div className="container">
          <h2 className="type-h2">{copy("how.bring.h2")}</h2>
          <BulletList keys={["how.bring.b1", "how.bring.b2", "how.bring.b3"]} />
          <p>{copy("how.bring.aside")}</p>
          <ButtonLink href="/suppliers" variant="text" arrow={false}>
            {copy("how.bring.link")}
          </ButtonLink>
        </div>
      </section>
      <CtaBand
        title="how.cta.h2"
        primary="how.cta.button"
        primaryHref="/waitlist"
        secondary="how.cta.secondary"
        secondaryHref="/trust"
      />
    </>
  );
}
