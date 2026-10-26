import { after, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normaliseEmail, isValidEmailSyntax, emailDomain } from "@/lib/email";
import { isDisposableDomain } from "@/lib/disposable";
import { clientIp, hashIp } from "@/lib/ipHash";
import { hitRateLimit } from "@/lib/rateLimit";
import { isHoneypotTripped } from "@/lib/honeypot";
import { waitlistBodySchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/http";
import { sendWaitlistConfirmation } from "@/lib/confirmationEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 10_000;

type SignupRow = {
  id: string;
  referral_code: string;
  already_registered: boolean;
  queue_position: number;
  total: number;
  referral_count: number;
};

export async function POST(req: NextRequest) {
  try {
    // 0. Optional Origin allow-list (CSRF / cross-site form abuse).
    const allowed = env.allowedOrigins();
    const origin = req.headers.get("origin");
    if (allowed.length > 0 && origin && !allowed.includes(origin)) {
      return jsonError(403, "forbidden_origin", "Origin not allowed.");
    }

    // 1. Parse JSON (bounded size).
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonError(422, "validation_error", "Request body too large.");
    }
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return jsonError(422, "validation_error", "Request body must be valid JSON.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError(422, "validation_error", "Request body must be a JSON object.");
    }

    // 2. Rate limit per hashed IP (counts every attempt, including bots and duplicates).
    const ipHash = hashIp(clientIp(req.headers));
    const rl = await hitRateLimit(
      `signup:${ipHash ?? "unknown"}`,
      env.signupRateLimit(),
      env.signupRateWindowSeconds(),
    );
    if (!rl.allowed) {
      return jsonError(429, "rate_limited", "Too many attempts. Please try again later.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    // 3. Honeypot: generic validation error, no row written, no detail leaked.
    if (isHoneypotTripped(body as Record<string, unknown>)) {
      return jsonError(422, "validation_error", "Invalid submission.");
    }

    // 4. Email checks (400s) before the rest of the schema.
    const rawEmail = (body as Record<string, unknown>).email;
    if (typeof rawEmail !== "string") {
      return jsonError(400, "invalid_email", "Please enter a valid work email.");
    }
    const email = normaliseEmail(rawEmail);
    if (!isValidEmailSyntax(email)) {
      return jsonError(400, "invalid_email", "Please enter a valid work email.");
    }
    if (isDisposableDomain(emailDomain(email))) {
      return jsonError(400, "disposable_email", "Please use a non-disposable work email.");
    }

    // 5. Remaining fields.
    const parsed = waitlistBodySchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "_";
        (fields[key] ??= []).push(issue.message);
      }
      return jsonError(422, "validation_error", "Some fields are invalid.", { fields });
    }
    const input = parsed.data;

    // 6. Insert-or-return-existing (single RPC, atomic in Postgres).
    const { data, error } = await supabaseAdmin().rpc("waitlist_signup", {
      p_email: email,
      p_type: input.type,
      p_company: input.company,
      p_role: input.role,
      p_agents_used: input.agents_used,
      p_ref_code: input.ref,
      p_ip_hash: ipHash,
    });
    if (error || !Array.isArray(data) || data.length === 0) {
      console.error("[waitlist] signup rpc failed", error?.code, error?.message);
      return jsonError(500, "server_error", "Something went wrong. Please try again.");
    }
    const row = data[0] as SignupRow;
    const shareUrl = `${env.siteUrl()}/?ref=${row.referral_code}`;

    // 7. Confirmation email for NEW signups only (after the response is sent).
    if (!row.already_registered) {
      after(() =>
        sendWaitlistConfirmation({
          signupId: row.id,
          to: email,
          position: Number(row.queue_position),
          shareUrl,
        }).then(() => undefined),
      );
    }

    return jsonOk(row.already_registered ? 200 : 201, {
      already_registered: row.already_registered,
      position: Number(row.queue_position),
      total: Number(row.total),
      referral_code: row.referral_code,
      share_url: shareUrl,
    });
  } catch (e) {
    console.error("[waitlist] unexpected error", e instanceof Error ? e.message : e);
    return jsonError(500, "server_error", "Something went wrong. Please try again.");
  }
}
