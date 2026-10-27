import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { LegalBlocks } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";

export const metadata = pageMetadata("privacy");

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container">
        <p className="solid-meta">{copy("privacy.status")}</p>
        <h1 className="type-display-l">{copy("privacy.h1")}</h1>
        <p className="solid-meta">
          <T k="privacy.updated" />
        </p>
        <LegalBlocks
          blocks={[
            { tag: "p", key: "privacy.intro" },
            { tag: "h2", key: "privacy.s1.h" },
            { tag: "p", key: "privacy.s1.p1" },
            { tag: "p", key: "privacy.s1.p2" },
            { tag: "h2", key: "privacy.s2.h" },
            { tag: "li", key: "privacy.s2.b1" },
            { tag: "li", key: "privacy.s2.b2" },
            { tag: "li", key: "privacy.s2.b3" },
            { tag: "li", key: "privacy.s2.b4" },
            { tag: "li", key: "privacy.s2.b5" },
            { tag: "li", key: "privacy.s2.b6" },
            { tag: "h2", key: "privacy.s3.h" },
            { tag: "li", key: "privacy.s3.b1" },
            { tag: "li", key: "privacy.s3.b2" },
            { tag: "li", key: "privacy.s3.b3" },
            { tag: "li", key: "privacy.s3.b4" },
            { tag: "p", key: "privacy.s3.p1" },
            { tag: "h2", key: "privacy.s4.h" },
            { tag: "li", key: "privacy.s4.b1" },
            { tag: "li", key: "privacy.s4.b2" },
            { tag: "li", key: "privacy.s4.b3" },
            { tag: "h2", key: "privacy.s5.h" },
            { tag: "p", key: "privacy.s5.p1" },
            { tag: "p", key: "privacy.s5.p2" },
            { tag: "p", key: "privacy.s5.p3" },
            { tag: "h2", key: "privacy.s6.h" },
            { tag: "li", key: "privacy.s6.b1" },
            { tag: "li", key: "privacy.s6.b2" },
            { tag: "li", key: "privacy.s6.b3" },
            { tag: "p", key: "privacy.s6.p1" },
            { tag: "h2", key: "privacy.s7.h" },
            { tag: "p", key: "privacy.s7.p1" },
            { tag: "h2", key: "privacy.s8.h" },
            { tag: "p", key: "privacy.s8.p1" },
            { tag: "p", key: "privacy.s8.p2" },
            { tag: "h2", key: "privacy.s9.h" },
            { tag: "p", key: "privacy.s9.p1" },
            { tag: "h2", key: "privacy.s10.h" },
            { tag: "p", key: "privacy.s10.p1" },
            { tag: "h2", key: "privacy.s11.h" },
            { tag: "p", key: "privacy.s11.p1" },
            { tag: "h2", key: "privacy.s12.h" },
            { tag: "p", key: "privacy.s12.p1" },
          ]}
        />
      </div>
    </section>
  );
}
