import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = pageMetadata("notfound");

export default function NotFound() {
  return (
    <section className="section">
      <div className="container measure">
        <p className="eyebrow">{copy("notfound.eyebrow")}</p>
        <h1 className="type-display-l">{copy("notfound.title")}</h1>
        <p>{copy("notfound.body")}</p>
        <div className="hero-actions">
          <ButtonLink href="/">{copy("notfound.cta.home")}</ButtonLink>
          <ButtonLink href="/waitlist" variant="secondary" arrow={false}>
            {copy("notfound.cta.waitlist")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
