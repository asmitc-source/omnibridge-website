import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { clientIp, hashIp } from "@/lib/ipHash";
import { hitRateLimit } from "@/lib/rateLimit";
import { referralCodeSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/waitlist/position?code=xxxxxxxx -> { position, referral_count }. Never returns email. */
export async function GET(req: NextRequest) {
  try {
    const ipHash = hashIp(clientIp(req.headers));
    const rl = await hitRateLimit(
      `position:${ipHash ?? "unknown"}`,
      env.positionRateLimit(),
      env.positionRateWindowSeconds(),
    );
    if (!rl.allowed) {
      return jsonError(429, "rate_limited", "Too many requests. Please try again later.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const parsed = referralCodeSchema.safeParse(req.nextUrl.searchParams.get("code") ?? "");
    if (!parsed.success) {
      return jsonError(422, "validation_error", "A valid referral code is required.", {
        fields: { code: ["Expected 8 characters [a-z2-9]."] },
      });
    }

    const { data, error } = await supabaseAdmin().rpc("waitlist_position_by_code", {
      p_code: parsed.data,
    });
    if (error) {
      console.error("[waitlist] position rpc failed", error.code, error.message);
      return jsonError(500, "server_error", "Something went wrong. Please try again.");
    }
    if (!Array.isArray(data) || data.length === 0) {
      return jsonError(404, "not_found", "Referral code not found.");
    }
    const row = data[0] as { queue_position: number; referral_count: number };
    return jsonOk(200, {
      position: Number(row.queue_position),
      referral_count: Number(row.referral_count),
    });
  } catch (e) {
    console.error("[waitlist] unexpected error", e instanceof Error ? e.message : e);
    return jsonError(500, "server_error", "Something went wrong. Please try again.");
  }
}
