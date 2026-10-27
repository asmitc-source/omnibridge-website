import { BRAND } from "@/config/site";
import { copy } from "@/lib/copy";
import { pageMetadata, siteOrigin } from "@/lib/seo";
import { JsonLd } from "@/components/content/Content";
import { HomeSections } from "@/components/home/HomeSections";

export const metadata = pageMetadata("home");

export default function Home() {
  const origin = siteOrigin();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: BRAND.name,
              url: origin,
              description: copy("meta.home.description"),
            },
            {
              "@type": "WebSite",
              name: BRAND.name,
              url: origin,
            },
          ],
        }}
      />
      <HomeSections />
    </>
  );
}
