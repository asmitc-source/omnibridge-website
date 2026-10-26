/**
 * Reserved / special-use email domains (RFC 2606, RFC 6761). Mail to these
 * never reaches a real person, so they are rejected with 400 invalid_email.
 *
 * QA exception (Claire, 2026-10-27): WAITLIST_TEST_EMAIL_DOMAINS can allow
 * specific reserved domains (e.g. "example.com") on PREVIEW / local dev only.
 * In production the allowlist is ignored entirely (fail closed).
 *
 * Pure module (no "server-only", no env reads at import) so it can be unit
 * tested with plain Node. The route passes process.env in.
 */

const RESERVED_SECOND_LEVEL = ["example.com", "example.org", "example.net"] as const;
const RESERVED_TLDS = ["test", "invalid", "example", "localhost"] as const;

export type EnvLike = Record<string, string | undefined>;

/** True for example.com/.org/.net (and their subdomains) and *.test, *.invalid, *.example, *.localhost. */
export function isReservedDomain(domain: string): boolean {
  const d = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!d) return false;
  for (const r of RESERVED_SECOND_LEVEL) {
    if (d === r || d.endsWith(`.${r}`)) return true;
  }
  const tld = d.slice(d.lastIndexOf(".") + 1);
  return (RESERVED_TLDS as readonly string[]).includes(tld);
}

/**
 * Production detection, fail closed. The allowlist may apply ONLY when:
 *   - VERCEL_ENV is "preview" or "development", or
 *   - VERCEL_ENV is unset AND NODE_ENV is not "production" (local `next dev`).
 * Anything else (VERCEL_ENV=production, unknown VERCEL_ENV values, or a
 * production build running outside Vercel) counts as production.
 */
export function isProductionRuntime(e: EnvLike): boolean {
  const vercelEnv = (e.VERCEL_ENV ?? "").trim().toLowerCase();
  if (vercelEnv === "preview" || vercelEnv === "development") return false;
  if (vercelEnv === "") return (e.NODE_ENV ?? "").trim().toLowerCase() === "production";
  return true;
}

/** Parsed allowlist; always EMPTY in production. Only reserved domains can be listed. */
export function testEmailDomainAllowlist(e: EnvLike): string[] {
  if (isProductionRuntime(e)) return [];
  return (e.WAITLIST_TEST_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s !== "" && isReservedDomain(s));
}

/** True if this domain must be rejected (reserved and not allowlisted for this runtime). */
export function isBlockedReservedDomain(domain: string, e: EnvLike): boolean {
  if (!isReservedDomain(domain)) return false;
  return !testEmailDomainAllowlist(e).includes(domain.trim().toLowerCase());
}

/** Only QA-tagged addresses may use an allowlisted reserved domain (Product Lead, 2026-10-27). */
export const QA_LOCAL_PART_PREFIX = "ob-qa+";

/**
 * True if this (already normalised) email must be rejected: a reserved domain is
 * allowed only on preview/dev, only when allowlisted, and only for ob-qa+<case-id>@ addresses.
 */
export function isBlockedReservedEmail(email: string, e: EnvLike): boolean {
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  const local = email.slice(0, at).toLowerCase();
  const domain = email.slice(at + 1);
  if (!isReservedDomain(domain)) return false;
  if (isBlockedReservedDomain(domain, e)) return true;
  return !(local.startsWith(QA_LOCAL_PART_PREFIX) && local.length > QA_LOCAL_PART_PREFIX.length);
}
