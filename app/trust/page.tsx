import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { BulletList, CtaBand, PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";
import { DemoSimulation } from "@/components/demo/DemoSimulation";
import { KillSwitchButton } from "@/components/demo/KillSwitchButton";
import { PosterFrame, ShieldPoster } from "@/components/scenes/Posters";
import script from "@/lib/copy/demo.script.json";

export const metadata = pageMetadata("trust");

export default function TrustPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <PageIntro eyebrow="trust.eyebrow" title="trust.h1" sub="trust.sub" />
          <figure className="diagram" style={{ marginTop: 28 }}>
            <PosterFrame label={copy("trust.alt.shield")}>
              <ShieldPoster />
            </PosterFrame>
          </figure>
        </div>
      </section>
      <section className="section-compact">
        <div className="container measure">
          <h2 className="type-h2">{copy("trust.identity.h2")}</h2>
          <p>{copy("trust.identity.body")}</p>
          <p className="solid-meta">{copy("trust.identity.disclosure")}</p>
          <h2 className="type-h2">{copy("trust.policy.h2")}</h2>
          <p>{copy("trust.policy.body")}</p>
        </div>
      </section>
      <section id="alert" className="section">
        <div className="container">
          <h2 className="type-h2">{copy("trust.alert.h2")}</h2>
          <p className="measure">{copy("trust.alert.body")}</p>
          <DemoSimulation startAt={script.trust_excerpt_start} captionKey="trust.alert.caption" />
        </div>
      </section>
      <section id="kill" className="section-compact">
        <div className="container measure">
          <h2 className="type-h2">{copy("trust.kill.h2")}</h2>
          <p>{copy("trust.kill.body")}</p>
          <KillSwitchButton />
          <h2 className="type-h2">{copy("trust.record.h2")}</h2>
          <p>
            <T k="trust.record.body" />
          </p>
          <h2 className="type-h2">{copy("trust.not.h2")}</h2>
          <BulletList keys={["trust.not.b1", "trust.not.b2", "trust.not.b3"]} />
          <p className="muted">{copy("trust.closing")}</p>
        </div>
      </section>
      <CtaBand
        title="trust.cta.h2"
        primary="trust.cta.button"
        primaryHref="/waitlist"
        secondary="trust.cta.secondary"
        secondaryHref="/how-it-works"
      />
    </>
  );
}
