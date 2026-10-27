import { pageMetadata, siteOrigin } from "@/lib/seo";
import { CtaBand, FaqList, JsonLd, PageIntro, faqEntities } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";

export const metadata = pageMetadata("faq");

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          url: `${siteOrigin()}/faq`,
          mainEntity: faqEntities(),
        }}
      />
      <section className="section">
        <div className="container">
          <PageIntro eyebrow="faq.eyebrow" title="faq.h1" sub="faq.sub" />
          <FaqList />
          <p>
            <T k="faq.contact" />
          </p>
        </div>
      </section>
      <CtaBand title="faq.cta.h2" primary="faq.cta.button" primaryHref="/waitlist" />
    </>
  );
}
