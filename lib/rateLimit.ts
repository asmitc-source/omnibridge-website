import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

/**
 * Fixed-window limiter backed by public.waitlist_rate_limits (Postgres only,
 * no Upstash). Fails OPEN on DB error so an outage of the limiter does not
 * block real signups; the error is logged.
 */
export async function hitRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin().rpc("waitlist_rate_limit_hit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error || !Array.isArray(data) || data.length === 0) {
    console.error("[waitlist] rate limit check failed (failing open)", error?.message);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const row = data[0] as { allowed: boolean; retry_after_seconds: number };
  return { allowed: row.allowed, retryAfterSeconds: row.retry_after_seconds };
}
