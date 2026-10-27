import type { ReactNode } from "react";
import { copy, type CopyKey } from "@/lib/copy";
import { T } from "@/components/ui/Copy";
import { ButtonLink } from "@/components/ui/Button";

export function PageIntro({
  eyebrow,
  title,
  sub,
  note,
}: {
  eyebrow: CopyKey;
  title: CopyKey;
  sub?: CopyKey;
  note?: CopyKey;
}) {
  return (
    <header className="measure">
      <p className="eyebrow">{copy(eyebrow)}</p>
      <h1 className="type-display-l">{copy(title)}</h1>
      {sub ? (
        <p className="type-body-l muted">
          <T k={sub} />
        </p>
      ) : null}
      {note ? <p className="solid-meta">{copy(note)}</p> : null}
    </header>
  );
}

export function CtaBand({
  title,
  primary,
  primaryHref,
  secondary,
  secondaryHref,
}: {
  title: CopyKey;
  primary: CopyKey;
  primaryHref: string;
  secondary?: CopyKey;
  secondaryHref?: string;
}) {
  return (
    <section className="section-compact">
      <div className="container measure">
        <h2 className="type-h2">{copy(title)}</h2>
        <div className="hero-actions">
          <ButtonLink href={primaryHref}>{copy(primary)}</ButtonLink>
          {secondary && secondaryHref ? (
            <ButtonLink href={secondaryHref} variant="secondary" arrow={false}>
              {copy(secondary)}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function BulletList({ keys }: { keys: CopyKey[] }) {
  return (
    <ul>
      {keys.map((key) => (
        <li key={key}>
          <T k={key} />
        </li>
      ))}
    </ul>
  );
}

const FAQ_GROUPS: { title: CopyKey; items: { q: CopyKey; a: CopyKey }[] }[] = [
  {
    title: "faq.group.general",
    items: [
      { q: "faq.q1.question", a: "faq.q1.answer" },
      { q: "faq.q2.question", a: "faq.q2.answer" },
      { q: "faq.q6.question", a: "faq.q6.answer" },
      { q: "faq.q7.question", a: "faq.q7.answer" },
      { q: "faq.q9.question", a: "faq.q9.answer" },
    ],
  },
  {
    title: "faq.group.trust",
    items: [
      { q: "faq.q4.question", a: "faq.q4.answer" },
      { q: "faq.q5.question", a: "faq.q5.answer" },
      { q: "faq.q10.question", a: "faq.q10.answer" },
    ],
  },
  {
    title: "faq.group.suppliers",
    items: [{ q: "faq.q3.question", a: "faq.q3.answer" }],
  },
  {
    title: "faq.group.developers",
    items: [{ q: "faq.q8.question", a: "faq.q8.answer" }],
  },
  {
    title: "faq.group.waitlist",
    items: [
      { q: "faq.q11.question", a: "faq.q11.answer" },
      { q: "faq.q12.question", a: "faq.q12.answer" },
    ],
  },
];

export function faqEntities() {
  return FAQ_GROUPS.flatMap((group) => group.items).map((item) => ({
    "@type": "Question",
    name: copy(item.q),
    acceptedAnswer: { "@type": "Answer", text: copy(item.a) },
  }));
}

function groupId(title: CopyKey) {
  return title.replaceAll(".", "-");
}

export function FaqList() {
  return (
    <div className="faq">
      <nav className="faq-chips" aria-label={copy("faq.h1")}>
        {FAQ_GROUPS.map((group) => (
          <a key={group.title} href={`#${groupId(group.title)}`}>
            {copy(group.title)}
          </a>
        ))}
      </nav>
      {FAQ_GROUPS.map((group) => (
        <section key={group.title} id={groupId(group.title)}>
          <h2 className="type-h3">{copy(group.title)}</h2>
          {group.items.map((item) => (
            <details key={item.q}>
              <summary>{copy(item.q)}</summary>
              <p className="muted">
                <T k={item.a} />
              </p>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

type Block = { tag: "p" | "h2" | "li"; key: CopyKey };

export function LegalBlocks({ blocks, tocLabel }: { blocks: Block[]; tocLabel: CopyKey }) {
  const nodes: ReactNode[] = [];
  let list: CopyKey[] = [];
  const flush = () => {
    if (list.length === 0) return;
    const items = list;
    list = [];
    nodes.push(
      <ul key={items.join("|")}>
        {items.map((key) => (
          <li key={key}>
            <T k={key} />
          </li>
        ))}
      </ul>,
    );
  };
  for (const block of blocks) {
    if (block.tag === "li") {
      list.push(block.key);
      continue;
    }
    flush();
    if (block.tag === "h2") {
      nodes.push(
        <h2 key={block.key} id={block.key} className="type-h2">
          {copy(block.key)}
        </h2>,
      );
    } else {
      nodes.push(
        <p key={block.key}>
          <T k={block.key} />
        </p>,
      );
    }
  }
  flush();
  const headings = blocks.filter((block) => block.tag === "h2");
  return (
    <div className="legal-layout">
      <details className="legal-toc" open>
        <summary>{copy(tocLabel)}</summary>
        <div className="legal-toc-scroll" role="region" tabIndex={0} aria-label={copy(tocLabel)}>
          <ol>
            {headings.map((block) => (
              <li key={block.key}>
                <a href={`#${block.key}`}>{copy(block.key)}</a>
              </li>
            ))}
          </ol>
        </div>
      </details>
      <div className="prose measure">{nodes}</div>
    </div>
  );
}
