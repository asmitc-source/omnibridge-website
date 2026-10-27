"use client";

import Link from "next/link";
import { copy } from "@/lib/copy";
import { T } from "@/components/ui/Copy";

const SITE = [
  ["footer.link.product", "/product"],
  ["footer.link.how", "/how-it-works"],
  ["footer.link.trust", "/trust"],
  ["footer.link.manifesto", "/manifesto"],
  ["footer.link.faq", "/faq"],
] as const;

const AUDIENCES = [
  ["footer.link.procurement", "/procurement"],
  ["footer.link.suppliers", "/suppliers"],
  ["footer.link.developers", "/developers"],
  ["footer.link.waitlist", "/waitlist"],
] as const;

export function Footer() {
  const email = copy("footer.contact.email");
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="wordmark" href="/">
            {copy("footer.wordmark")}
            <span className="packet-dot" aria-hidden="true" />
          </Link>
          <p className="muted">{copy("footer.tagline")}</p>
          <p className="solid-meta">{copy("footer.status")}</p>
        </div>
        <div>
          <h2>{copy("footer.group.site")}</h2>
          <ul>
            {SITE.map(([key, href]) => (
              <li key={key}>
                <a href={href}>{copy(key)}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>{copy("footer.group.audiences")}</h2>
          <ul>
            {AUDIENCES.map(([key, href]) => (
              <li key={key}>
                <a href={href}>{copy(key)}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>{copy("footer.group.legal")}</h2>
          <ul>
            <li>
              <a href="/privacy">{copy("footer.legal.privacy")}</a>
            </li>
            <li>
              <a href="/terms">{copy("footer.legal.terms")}</a>
            </li>
            <li>
              <button
                type="button"
                className="ghost-link"
                style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
                onClick={() => window.dispatchEvent(new Event("ob-cookies"))}
              >
                {copy("footer.legal.cookies")}
              </button>
            </li>
          </ul>
          <p>
            {copy("footer.contact.label")}
            <br />
            {email.includes("[domain]") ? <T k="footer.contact.email" /> : <a href={`mailto:${email}`}>{email}</a>}
          </p>
        </div>
      </div>
      <div className="container solid-meta" style={{ marginTop: 32 }}>
        <p>
          <T k="footer.entity" /> · <T k="footer.address" />
        </p>
        <p>{copy("footer.trademark")}</p>
        <p>
          <T k="footer.copyright" />
        </p>
      </div>
    </footer>
  );
}
