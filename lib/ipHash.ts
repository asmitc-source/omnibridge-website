import "server-only";
import { createHmac } from "node:crypto";
import { env } from "./env";

/**
 * Client IP from Vercel's proxy headers. On Vercel, `x-real-ip` and the first
 * entry of `x-forwarded-for` are set by the platform. Returns null locally.
 */
export function clientIp(headers: Headers): string | null {
  const vercel = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xff || null;
}

/**
 * HMAC-SHA256(IP_HASH_SALT, ip) as 64 hex chars. The raw IP is never stored or
 * logged. Rotating IP_HASH_SALT breaks linkage with previously stored hashes
 * (old rate-limit buckets and the same-IP referral heuristic).
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHmac("sha256", env.ipHashSalt()).update(ip).digest("hex");
}
