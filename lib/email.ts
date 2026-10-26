/**
 * Email normalisation and syntax validation.
 *
 * Default normalisation: trim + lowercase ONLY. We deliberately do NOT strip
 * Gmail dots or "+tag" suffixes by default, because (a) for many work domains
 * dots/plus are significant, and (b) we want to store exactly the address the
 * person gave us. Optional Gmail canonicalisation (WAITLIST_CANONICALISE_GMAIL=true)
 * is available via `canonicaliseForDedupe`, but note it is NOT wired into the
 * DB unique index; turning it on would need a separate `email_canonical`
 * column + unique index (see docs/API_CONTRACT.md, "Open options").
 */

const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;

// Pragmatic RFC 5322 subset: no quoted local parts, no IP-literal domains.
const LOCAL_RE = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export function normaliseEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmailSyntax(email: string): boolean {
  if (email.length < 3 || email.length > MAX_EMAIL_LENGTH) return false;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at !== email.indexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > MAX_LOCAL_LENGTH || !LOCAL_RE.test(local)) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  if (!labels.every((l) => LABEL_RE.test(l))) return false;
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,63}$/.test(tld) && !/^xn--[a-z0-9-]{1,59}$/.test(tld)) return false;
  return true;
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1);
}

/** OPTIONAL (off by default): gmail.com/googlemail.com dot + plus stripping. */
export function canonicaliseForDedupe(email: string): string {
  const domain = emailDomain(email);
  if (domain !== "gmail.com" && domain !== "googlemail.com") return email;
  const local = email.slice(0, email.lastIndexOf("@")).split("+")[0].replace(/\./g, "");
  return `${local}@gmail.com`;
}
