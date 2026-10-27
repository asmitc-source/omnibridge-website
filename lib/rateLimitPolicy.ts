/**
 * Rate-limit decision shared by POST /api/waitlist and GET /api/waitlist/position.
 *
 * A hit is allowed when its 1-based count is <= the limit. That matches
 * waitlist_rate_limit_hit (`v_hits <= p_limit`). The next hit is HTTP 429
 * `rate_limited`. Defaults are the API contract: 5 signups and 30 position
 * lookups per window.
 */
export const SIGNUP_RATE_LIMIT = 5;
export const POSITION_RATE_LIMIT = 30;

export function isHitAllowed(hitNumber: number, limit: number): boolean {
  return hitNumber <= limit;
}

export function rateLimitHttpError(
  allowed: boolean,
): { status: 429; code: "rate_limited" } | null {
  if (allowed) return null;
  return { status: 429, code: "rate_limited" };
}
