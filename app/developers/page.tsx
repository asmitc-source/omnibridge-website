import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { BulletList, CtaBand, PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";
import { ButtonLink } from "@/components/ui/Button";
import { TextMarks } from "@/components/ui/Marks";
import { ConnectPoster, PosterFrame } from "@/components/scenes/Posters";

export const metadata = pageMetadata("developers");

export default function DevelopersPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <PageIntro eyebrow="developers.eyebrow" title="developers.h1" sub="developers.sub" note="developers.status" />
          <ButtonLink href="/waitlist?type=developer">{copy("developers.cta.hero")}</ButtonLink>
          <figure className="diagram" style={{ marginTop: 28 }}>
            <PosterFrame label={copy("developers.alt.diagram")}>
              <ConnectPoster />
            </PosterFrame>
          </figure>
        </div>
      </section>
      <section className="section-compact">
        <div className="container measure">
          <h2 className="type-h2">{copy("developers.byo.h2")}</h2>
          <p>{copy("developers.byo.body.1")}</p>
          <p>
            <T k="developers.byo.body.2" />
          </p>
          <p>{copy("developers.byo.body.3")}</p>
          <h2 className="type-h2">{copy("developers.protocols.h2")}</h2>
          <article className="panel">
            <h3 className="type-h3">{copy("developers.protocols.mcp.name")}</h3>
            <p>{copy("developers.protocols.mcp.body")}</p>
          </article>
          <article className="panel">
            <h3 className="type-h3">{copy("developers.protocols.a2a.name")}</h3>
            <p>{copy("developers.protocols.a2a.body")}</p>
          </article>
          <article className="panel">
            <h3 className="type-h3">{copy("developers.protocols.api.name")}</h3>
            <p>{copy("developers.protocols.api.body")}</p>
          </article>
          <h2 className="type-h2">{copy("developers.network.h2")}</h2>
          <BulletList
            keys={["developers.network.b1", "developers.network.b2", "developers.network.b3", "developers.network.b4"]}
          />
          <TextMarks k="developers.marks" />
          <p className="muted">{copy("developers.marks.disclaimer")}</p>
          <h2 className="type-h2">{copy("developers.early.h2")}</h2>
          <p>{copy("developers.early.body")}</p>
        </div>
      </section>
      <CtaBand title="developers.early.h2" primary="developers.cta.button" primaryHref="/waitlist?type=developer" />
    </>
  );
}
