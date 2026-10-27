import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { PageIntro } from "@/components/content/Content";
import { T } from "@/components/ui/Copy";
import { WaitlistForm } from "@/components/form/WaitlistForm";
import { NetworkPoster, PosterFrame } from "@/components/scenes/Posters";

export const metadata = pageMetadata("waitlist");

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  return (
    <section className="section">
      <div className="container">
        <figure className="diagram" style={{ marginBottom: 28 }}>
          <PosterFrame label={copy("waitlist.alt.bg")}>
            <NetworkPoster id="waitlist" />
          </PosterFrame>
        </figure>
        <PageIntro eyebrow="waitlist.eyebrow" title="waitlist.h1" sub="waitlist.sub" />
        <p>
          <T k="waitlist.privacy" linkPhrases />
        </p>
        <WaitlistForm heading="h2" preset={params.type} />
        <h2 className="type-h2">{copy("waitlist.rules.h2")}</h2>
        <ul>
          <li>{copy("referral.rule.bump")}</li>
          <li>{copy("referral.rule.verified")}</li>
          <li>{copy("referral.rule.tiebreak")}</li>
        </ul>
      </div>
    </section>
  );
}
