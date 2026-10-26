/**
 * Honeypot. Frontend MUST render an <input name="ob_hp_company_url"> that is
 * visually hidden (off-screen via CSS, not type="hidden"), with
 * tabIndex={-1}, autoComplete="off" and aria-hidden="true", and send its value
 * (normally "") in the JSON body. Any non-empty value => treated as a bot.
 */
export const HONEYPOT_FIELD = "ob_hp_company_url" as const;

export function isHoneypotTripped(body: Record<string, unknown>): boolean {
  const v = body[HONEYPOT_FIELD];
  return typeof v === "string" ? v.trim().length > 0 : v != null && v !== "";
}
