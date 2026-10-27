import { copy, type CopyKey } from "@/lib/copy";
import { T } from "@/components/ui/Copy";
import { ButtonLink } from "@/components/ui/Button";
import { TextMarks } from "@/components/ui/Marks";
import { NetworkPoster, PosterFrame, WallsPoster } from "@/components/scenes/Posters";
import { DemoSimulation } from "@/components/demo/DemoSimulation";
import { WaitlistForm } from "@/components/form/WaitlistForm";

const HERO_NODES = ["home.hero.node.buyer", "home.hero.node.supplier", "home.hero.node.human"] as const;
const WALLS = [1, 2, 3] as const;
const STEPS = [1, 2, 3, 4, 5] as const;
const TRUST = [1, 2, 3, 4, 5] as const;

export function HomeSections() {
  const beats = copy("home.hero.h1")
    .split(/(?<=\.)\s+/)
    .filter(Boolean);
  return (
    <>
      <section id="hero" className="hero">
        <PosterFrame hero label={copy("home.alt.hero_poster")}>
          <NetworkPoster id="hero" />
        </PosterFrame>
        <div className="scrim" />
        <div className="container hero-copy">
          <p className="eyebrow">{copy("home.hero.eyebrow")}</p>
          <h1 className="type-display-xl h1-reserve">
            {beats.map((beat) => (
              <span key={beat}>
                {beat}
              </span>
            ))}
          </h1>
          <p className="type-body-l measure-intro">
            <T k="home.hero.sub" />
          </p>
          <div className="hero-actions">
            <ButtonLink href="/waitlist">{copy("home.hero.cta")}</ButtonLink>
            <ButtonLink href="/how-it-works" variant="secondary" arrow={false}>
              {copy("home.hero.secondary")}
            </ButtonLink>
          </div>
          <p className="muted">{copy("home.hero.byo")}</p>
          <p className="solid-meta">{copy("home.hero.micro")}</p>
          <p className="sr-only">
            <a className="ghost-link" href="#problem">
              {copy("home.hero.scroll")}
            </a>
          </p>
          <ul className="hero-nodes sr-only">
            {HERO_NODES.map((key) => (
              <li key={key}>{copy(key)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="problem" className="section">
        <div className="container">
          <p className="eyebrow">{copy("home.problem.eyebrow")}</p>
          <h2 className="type-h2 measure">{copy("home.problem.h2")}</h2>
          <p className="measure">
            <T k="home.problem.body.1" />
          </p>
          <p className="measure">
            <T k="home.problem.body.2" />
          </p>
          <p className="measure">
            <T k="home.problem.body.3" />
          </p>
          <div className="split-grid">
            <figure className="diagram">
              <PosterFrame label={copy("home.alt.problem_before")}>
                <WallsPoster />
              </PosterFrame>
            </figure>
            <figure className="diagram">
              <PosterFrame label={copy("home.alt.problem_after")}>
                <WallsPoster after />
              </PosterFrame>
            </figure>
          </div>
          <div className="wall-list" style={{ marginTop: 24 }}>
            {WALLS.map((n) => (
              <article key={n} className="panel">
                <h3 className="type-h3">{copy(`home.problem.wall.${n}.title` as CopyKey)}</h3>
                <p className="muted">{copy(`home.problem.wall.${n}.body` as CopyKey)}</p>
              </article>
            ))}
          </div>
          <p className="type-body-l">
            <T k="home.problem.bridge" />
          </p>
        </div>
      </section>

      <section id="how" className="section">
        <div className="container">
          <p className="eyebrow">{copy("home.steps.eyebrow")}</p>
          <h2 className="type-h2">{copy("home.steps.h2")}</h2>
          <p className="measure">
            <T k="home.steps.intro" />
          </p>
          <figure>
            <div className="steps">
              {STEPS.map((n) => (
                <article key={n} className="panel">
                  <p className="step-index">{n}</p>
                  <h3 className="type-h3">{copy(`home.steps.${n}.title` as CopyKey)}</h3>
                  <p className="muted">{copy(`home.steps.${n}.body` as CopyKey)}</p>
                </article>
              ))}
            </div>
            <figcaption className="sr-only">{copy("home.alt.steps")}</figcaption>
          </figure>
          <p>
            <ButtonLink href="/how-it-works" variant="secondary" arrow={false}>
              {copy("home.steps.link")}
            </ButtonLink>
          </p>
        </div>
      </section>

      <section id="demo" className="section">
        <div className="container">
          <div className="demo-intro">
            <p className="eyebrow">{copy("home.demo.eyebrow")}</p>
            <h2 className="type-h2">{copy("home.demo.h2")}</h2>
            <p className="measure">{copy("home.demo.body")}</p>
          </div>
          <DemoSimulation />
          <p>
            <ButtonLink href="/procurement" variant="text" arrow={false}>
              {copy("home.demo.link")}
            </ButtonLink>
          </p>
        </div>
      </section>

      <section id="split" className="section">
        <div className="container">
          <p className="eyebrow">{copy("home.split.eyebrow")}</p>
          <h2 className="type-h2">{copy("home.split.h2")}</h2>
          <div className="split-grid">
            <article className="panel">
              <p className="eyebrow">{copy("home.split.buyers.label")}</p>
              <h3 className="type-h3">{copy("home.split.buyers.title")}</h3>
              <ul>
                <li>{copy("home.split.buyers.b1")}</li>
                <li>{copy("home.split.buyers.b2")}</li>
                <li>{copy("home.split.buyers.b3")}</li>
                <li>{copy("home.split.buyers.b4")}</li>
              </ul>
              <div className="hero-actions">
                <ButtonLink href="/waitlist?type=buyer">{copy("home.split.buyers.cta")}</ButtonLink>
                <ButtonLink href="/procurement" variant="text" arrow={false}>
                  {copy("home.split.buyers.link")}
                </ButtonLink>
              </div>
            </article>
            <article className="panel">
              <p className="eyebrow">{copy("home.split.suppliers.label")}</p>
              <h3 className="type-h3">{copy("home.split.suppliers.title")}</h3>
              <ul>
                <li>{copy("home.split.suppliers.b1")}</li>
                <li>{copy("home.split.suppliers.b2")}</li>
                <li>{copy("home.split.suppliers.b3")}</li>
                <li>{copy("home.split.suppliers.b4")}</li>
              </ul>
              <div className="hero-actions">
                <ButtonLink href="/waitlist?type=supplier">{copy("home.split.suppliers.cta")}</ButtonLink>
                <ButtonLink href="/suppliers" variant="text" arrow={false}>
                  {copy("home.split.suppliers.link")}
                </ButtonLink>
              </div>
            </article>
          </div>
          <p>
            <a className="ghost-link" href="/developers">
              {copy("home.split.dev")}
            </a>
          </p>
        </div>
      </section>

      <section id="trust" className="section">
        <div className="container">
          <p className="eyebrow">{copy("home.trust.eyebrow")}</p>
          <h2 className="type-h2">{copy("home.trust.h2")}</h2>
          <p className="measure">
            <T k="home.trust.body" />
          </p>
          <div className="trust-grid">
            {TRUST.map((n) => (
              <article key={n} className="panel">
                <h3 className="type-h3">{copy(`home.trust.${n}.title` as CopyKey)}</h3>
                <p className="muted">{copy(`home.trust.${n}.body` as CopyKey)}</p>
              </article>
            ))}
          </div>
          <p>
            <ButtonLink href="/trust" variant="secondary" arrow={false}>
              {copy("home.trust.link")}
            </ButtonLink>
          </p>
        </div>
      </section>

      <section id="agents" className="section">
        <div className="container">
          <p className="eyebrow">{copy("home.agents.eyebrow")}</p>
          <h2 className="type-h2 measure">{copy("home.agents.h2")}</h2>
          <p className="measure">
            <T k="home.agents.body" />
          </p>
          <TextMarks k="home.agents.marks" />
          <p className="muted measure">{copy("home.agents.disclaimer")}</p>
          <p>
            <ButtonLink href="/developers" variant="text" arrow={false}>
              {copy("home.agents.link")}
            </ButtonLink>
          </p>
        </div>
      </section>

      <section id="join" className="section">
        <div className="container measure">
          <p className="eyebrow">{copy("home.final.eyebrow")}</p>
          <h2 className="type-h2">{copy("home.final.h2")}</h2>
          <p>
            <T k="home.final.body" />
          </p>
          <WaitlistForm heading="h3" />
        </div>
      </section>

      <section id="faq" className="section">
        <div className="container">
          <p className="eyebrow">{copy("home.faq.eyebrow")}</p>
          <h2 className="type-h2">{copy("home.faq.h2")}</h2>
          <div className="faq">
            <details>
              <summary>{copy("faq.q1.question")}</summary>
              <p className="muted"><T k="faq.q1.answer" /></p>
            </details>
            <details>
              <summary>{copy("faq.q2.question")}</summary>
              <p className="muted"><T k="faq.q2.answer" /></p>
            </details>
            <details>
              <summary>{copy("faq.q3.question")}</summary>
              <p className="muted"><T k="faq.q3.answer" /></p>
            </details>
            <details>
              <summary>{copy("faq.q4.question")}</summary>
              <p className="muted"><T k="faq.q4.answer" /></p>
            </details>
            <details>
              <summary>{copy("faq.q5.question")}</summary>
              <p className="muted"><T k="faq.q5.answer" /></p>
            </details>
            <details>
              <summary>{copy("faq.q6.question")}</summary>
              <p className="muted"><T k="faq.q6.answer" /></p>
            </details>
          </div>
          <p>
            <ButtonLink href="/faq" variant="secondary" arrow={false}>
              {copy("home.faq.link")}
            </ButtonLink>
          </p>
        </div>
      </section>
    </>
  );
}
