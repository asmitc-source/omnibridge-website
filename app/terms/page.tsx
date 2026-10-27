import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { LegalBlocks } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";

export const metadata = pageMetadata("terms");

export default function TermsPage() {
  return (
    <section className="section">
      <div className="container">
        <p className="solid-meta">{copy("terms.status")}</p>
        <h1 className="type-display-l">{copy("terms.h1")}</h1>
        <p className="solid-meta">
          <T k="terms.updated" />
        </p>
        <LegalBlocks
          blocks={[
            { tag: "h2", key: "terms.s1.h" },
            { tag: "p", key: "terms.s1.p1" },
            { tag: "h2", key: "terms.s2.h" },
            { tag: "p", key: "terms.s2.p1" },
            { tag: "h2", key: "terms.s3.h" },
            { tag: "p", key: "terms.s3.p1" },
            { tag: "p", key: "terms.s3.p2" },
            { tag: "h2", key: "terms.s4.h" },
            { tag: "p", key: "terms.s4.p1" },
            { tag: "p", key: "terms.s4.p2" },
            { tag: "h2", key: "terms.s5.h" },
            { tag: "p", key: "terms.s5.p1" },
            { tag: "h2", key: "terms.s6.h" },
            { tag: "p", key: "terms.s6.p1" },
            { tag: "h2", key: "terms.s7.h" },
            { tag: "p", key: "terms.s7.p1" },
            { tag: "h2", key: "terms.s8.h" },
            { tag: "p", key: "terms.s8.p1" },
            { tag: "h2", key: "terms.s9.h" },
            { tag: "p", key: "terms.s9.p1" },
            { tag: "h2", key: "terms.s10.h" },
            { tag: "p", key: "terms.s10.p1" },
            { tag: "h2", key: "terms.s11.h" },
            { tag: "p", key: "terms.s11.p1" },
            { tag: "h2", key: "terms.s12.h" },
            { tag: "p", key: "terms.s12.p1" },
            { tag: "h2", key: "terms.s13.h" },
            { tag: "p", key: "terms.s13.p1" },
          ]}
        />
      </div>
    </section>
  );
}
