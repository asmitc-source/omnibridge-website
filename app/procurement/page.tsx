import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { BulletList, CtaBand, PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";
import { ButtonLink } from "@/components/ui/Button";
import { DemoSimulation } from "@/components/demo/DemoSimulation";

export const metadata = pageMetadata("procurement");

export default function ProcurementPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <PageIntro eyebrow="procurement.eyebrow" title="procurement.h1" sub="procurement.sub" />
          <ButtonLink href="/waitlist?type=buyer">{copy("procurement.cta.hero")}</ButtonLink>
        </div>
      </section>
      <section className="section-compact">
        <div className="container measure">
          <h2 className="type-h2">{copy("procurement.scenario.h2")}</h2>
          <p>{copy("procurement.scenario.body")}</p>
          <p className="solid-meta">{copy("procurement.scenario.disclaimer")}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2 className="type-h2">
            <T k="procurement.compare.h2" />
          </h2>
          <div className="compare">
            <div className="compare-toggle">
              <input type="radio" name="compare-view" id="compare-today" defaultChecked />
              <label htmlFor="compare-today">{copy("procurement.compare.col.today")}</label>
              <input type="radio" name="compare-view" id="compare-with" />
              <label htmlFor="compare-with">{copy("procurement.compare.col.with")}</label>
            </div>
            <div className="table-wrap" role="region" aria-label={copy("procurement.alt.compare")}>
              <table>
                <thead>
                  <tr>
                    <th>{copy("procurement.compare.col.task")}</th>
                    <th className="compare-today">{copy("procurement.compare.col.today")}</th>
                    <th className="compare-with">{copy("procurement.compare.col.with")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{copy("procurement.compare.1.task")}</td>
                    <td className="compare-today">{copy("procurement.compare.1.today")}</td>
                    <td className="compare-with">
                      <span className="compare-dot" aria-hidden="true" />
                      {copy("procurement.compare.1.with")}
                    </td>
                  </tr>
                  <tr>
                    <td>{copy("procurement.compare.2.task")}</td>
                    <td className="compare-today">{copy("procurement.compare.2.today")}</td>
                    <td className="compare-with">
                      <span className="compare-dot" aria-hidden="true" />
                      {copy("procurement.compare.2.with")}
                    </td>
                  </tr>
                  <tr>
                    <td>{copy("procurement.compare.3.task")}</td>
                    <td className="compare-today">{copy("procurement.compare.3.today")}</td>
                    <td className="compare-with">
                      <span className="compare-dot" aria-hidden="true" />
                      {copy("procurement.compare.3.with")}
                    </td>
                  </tr>
                  <tr>
                    <td>{copy("procurement.compare.4.task")}</td>
                    <td className="compare-today">{copy("procurement.compare.4.today")}</td>
                    <td className="compare-with">
                      <span className="compare-dot" aria-hidden="true" />
                      {copy("procurement.compare.4.with")}
                    </td>
                  </tr>
                  <tr>
                    <td>{copy("procurement.compare.5.task")}</td>
                    <td className="compare-today">{copy("procurement.compare.5.today")}</td>
                    <td className="compare-with">
                      <span className="compare-dot" aria-hidden="true" />
                      {copy("procurement.compare.5.with")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <section id="demo" className="section">
        <div className="container">
          <div className="demo-intro">
            <h2 className="type-h2">{copy("procurement.demo.h2")}</h2>
          </div>
          <DemoSimulation captionKey="procurement.demo.caption" />
          <h2 className="type-h2">{copy("procurement.policy.h2")}</h2>
          <p className="solid-meta">{copy("procurement.policy.label")}</p>
          <BulletList
            keys={[
              "procurement.policy.1",
              "procurement.policy.2",
              "procurement.policy.3",
              "procurement.policy.4",
              "procurement.policy.5",
            ]}
          />
          <h2 className="type-h2">{copy("procurement.who.h2")}</h2>
          <BulletList keys={["procurement.who.b1", "procurement.who.b2", "procurement.who.b3"]} />
        </div>
      </section>
      <CtaBand title="procurement.cta.h2" primary="procurement.cta.button" primaryHref="/waitlist?type=buyer" />
    </>
  );
}
