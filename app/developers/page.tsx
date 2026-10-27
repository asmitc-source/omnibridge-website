import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { BulletList, PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";
import { ButtonLink } from "@/components/ui/Button";
import { TextMarks } from "@/components/ui/Marks";
export const metadata = pageMetadata("developers");

export default function DevelopersPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <PageIntro eyebrow="developers.eyebrow" title="developers.h1" sub="developers.sub" note="developers.status" />
          <ButtonLink href="/waitlist?type=developer">{copy("developers.cta.hero")}</ButtonLink>
          <figure className="diagram" style={{ marginTop: 28 }}>
            <svg className="schematic" viewBox="0 0 640 320" role="img" aria-label={copy("developers.alt.diagram")}>
              <rect x="24" y="116" width="120" height="72" rx="16" fill="none" stroke="var(--color-line-strong)" />
              <circle cx="84" cy="152" r="8" fill="var(--color-cyan)" />
              <path d="M144 152 H210" stroke="var(--color-violet)" strokeWidth="1.5" />
              <rect x="210" y="36" width="200" height="48" rx="12" fill="none" stroke="var(--color-line-strong)" />
              <rect x="210" y="128" width="200" height="48" rx="12" fill="none" stroke="var(--color-line-strong)" />
              <rect x="210" y="220" width="200" height="48" rx="12" fill="none" stroke="var(--color-line-strong)" />
              <path d="M410 60 H470 V152 H410" fill="none" stroke="var(--color-violet)" strokeWidth="1.5" />
              <path d="M410 244 H470 V152" fill="none" stroke="var(--color-violet)" strokeWidth="1.5" />
              <rect x="470" y="116" width="140" height="72" rx="16" fill="none" stroke="var(--color-cyan)" />
              <text x="310" y="66" textAnchor="middle" fill="var(--color-text-1)" fontSize="16" fontFamily="var(--font-mono)">
                {copy("developers.protocols.mcp.name")}
              </text>
              <text x="310" y="158" textAnchor="middle" fill="var(--color-text-1)" fontSize="16" fontFamily="var(--font-mono)">
                {copy("developers.protocols.a2a.name")}
              </text>
              <text x="310" y="250" textAnchor="middle" fill="var(--color-text-1)" fontSize="16" fontFamily="var(--font-mono)">
                {copy("developers.protocols.api.name")}
              </text>
            </svg>
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
          <div className="hero-actions">
            <ButtonLink href="/waitlist?type=developer">{copy("developers.cta.button")}</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
