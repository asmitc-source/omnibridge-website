import "server-only";

/**
 * Server-only environment access. Secrets here must NEVER be prefixed with
 * NEXT_PUBLIC_ (that would inline them into the client bundle).
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required server env var: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

function intVar(name: string, fallback: number): number {
  const raw = optional(name);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const env = {
  supabaseUrl: () => required("SUPABASE_URL"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  ipHashSalt: () => required("IP_HASH_SALT"),
  /** Master switch for the confirmation email. Default OFF until Claire clears a sender domain. */
  emailEnabled: () => optional("WAITLIST_EMAIL_ENABLED") === "true",
  /** Optional: if unset, confirmation emails are skipped (status = 'skipped'). */
  resendApiKey: () => optional("RESEND_API_KEY"),
  /** e.g. "OmniBridge <waitlist@TODO-domain>" - pending Claire's domain decision. */
  resendFrom: () => optional("RESEND_FROM"),
  resendReplyTo: () => optional("RESEND_REPLY_TO"),
  /** Merge value for {{unsubscribe_url}}. Email will not send until this is set (no endpoint exists yet). */
  unsubscribeUrl: () => optional("WAITLIST_UNSUBSCRIBE_URL"),
  /** Public site origin used to build share URLs, e.g. https://example.com (no trailing slash). */
  siteUrl: () => (optional("SITE_URL") ?? "http://localhost:3000").replace(/\/+$/, ""),
  /** Comma-separated list of allowed Origin headers for POST. Empty = do not enforce. */
  allowedOrigins: () =>
    (optional("ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  signupRateLimit: () => intVar("WAITLIST_SIGNUP_RATE_LIMIT", 5),
  signupRateWindowSeconds: () => intVar("WAITLIST_SIGNUP_RATE_WINDOW_SECONDS", 600),
  positionRateLimit: () => intVar("WAITLIST_POSITION_RATE_LIMIT", 30),
  positionRateWindowSeconds: () => intVar("WAITLIST_POSITION_RATE_WINDOW_SECONDS", 600),
  /** Opt-in Gmail dot/plus canonicalisation for duplicate detection. Default off. */
  canonicaliseGmail: () => optional("WAITLIST_CANONICALISE_GMAIL") === "true",
};
