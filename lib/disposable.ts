import "server-only";
import disposableDomains from "disposable-email-domains";
import wildcardDomains from "disposable-email-domains/wildcard.json";
import { EXTRA_DISPOSABLE_DOMAINS, DISPOSABLE_ALLOWLIST } from "./disposable-extra";

/**
 * Static disposable-domain check. Source: the `disposable-email-domains` npm
 * package (bundled at build time, no network call) plus a small curated
 * override list in ./disposable-extra.ts. Update by bumping the package.
 */
let exact: Set<string> | null = null;

function exactSet(): Set<string> {
  if (!exact) {
    exact = new Set<string>([...(disposableDomains as string[]), ...EXTRA_DISPOSABLE_DOMAINS]);
    for (const d of DISPOSABLE_ALLOWLIST) exact.delete(d);
  }
  return exact;
}

export function isDisposableDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  if (DISPOSABLE_ALLOWLIST.includes(d)) return false;
  if (exactSet().has(d)) return true;
  // Wildcard entries match the domain itself and any subdomain.
  for (const w of wildcardDomains as string[]) {
    if (d === w || d.endsWith(`.${w}`)) return true;
  }
  // Parent-domain match for subdomains of exact entries (e.g. x.mailinator.com).
  const parts = d.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    if (exactSet().has(parts.slice(i).join("."))) return true;
  }
  return false;
}
