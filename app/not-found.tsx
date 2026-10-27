import { copy } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = pageMetadata("notfound");

export default function NotFound() {
  return (
    <section className="section">
      <div className="container measure not-found-copy">
        <p className="eyebrow" style={{ justifyContent: "center" }}>
          {copy("notfound.eyebrow")}
        </p>
        <svg className="lost-node" viewBox="0 0 120 80" aria-hidden="true">
          <line x1="16" y1="40" x2="52" y2="40" stroke="var(--color-violet)" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="78" cy="40" r="12" fill="none" stroke="var(--color-violet)" strokeWidth="1.5" />
          <circle cx="78" cy="40" r="3.5" fill="var(--color-violet)" />
        </svg>
        <h1 className="type-display-l">{copy("notfound.title")}</h1>
        <p>{copy("notfound.body")}</p>
        <div className="hero-actions">
          <ButtonLink href="/waitlist">{copy("notfound.cta.waitlist")}</ButtonLink>
          <ButtonLink href="/" variant="secondary" arrow={false}>
            {copy("notfound.cta.home")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
