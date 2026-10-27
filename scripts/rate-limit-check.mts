// Unit test for the rate-limit decision both routes use. Pure, no env needed:
//   node --experimental-strip-types scripts/rate-limit-check.mts
import assert from "node:assert/strict";
import {
  isHitAllowed,
  rateLimitHttpError,
  SIGNUP_RATE_LIMIT,
  POSITION_RATE_LIMIT,
} from "../lib/rateLimitPolicy.ts";

const results: string[] = [];
const check = (name: string, fn: () => void) => {
  try { fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${(e as Error).message}`); }
};

/** One fixed-window hit, matching waitlist_rate_limit_hit: the nth call records hits = n. */
function afterHit(hitNumber: number, limit: number) {
  return rateLimitHttpError(isHitAllowed(hitNumber, limit));
}

check("signup 6th POST from the same IP hash within the window is 429 rate_limited", () => {
  for (let n = 1; n <= SIGNUP_RATE_LIMIT; n++) {
    assert.equal(afterHit(n, SIGNUP_RATE_LIMIT), null, `hit ${n} should be allowed`);
  }
  assert.deepEqual(afterHit(SIGNUP_RATE_LIMIT + 1, SIGNUP_RATE_LIMIT), {
    status: 429,
    code: "rate_limited",
  });
});

check("position 31st request from the same IP hash within the window is 429 rate_limited", () => {
  for (let n = 1; n <= POSITION_RATE_LIMIT; n++) {
    assert.equal(afterHit(n, POSITION_RATE_LIMIT), null, `hit ${n} should be allowed`);
  }
  assert.deepEqual(afterHit(POSITION_RATE_LIMIT + 1, POSITION_RATE_LIMIT), {
    status: 429,
    code: "rate_limited",
  });
});

console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
