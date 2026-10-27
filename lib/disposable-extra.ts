/** Curated additions to the disposable list (lowercase domains). */
export const EXTRA_DISPOSABLE_DOMAINS: readonly string[] = [
  // Add domains here as abuse is observed.
];

/** Domains that must never be treated as disposable (false positives). */
// Free email providers are explicitly ALLOWED (Product Lead, 2026-10-26).
export const DISPOSABLE_ALLOWLIST: readonly string[] = [
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com",
  "proton.me", "protonmail.com", "zoho.com", "gmx.com", "gmx.net", "mail.com",
  "yandex.com", "rediffmail.com", "fastmail.com", "hey.com",
];
