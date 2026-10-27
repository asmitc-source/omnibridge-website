// Unit test for reserved test domains + the preview-only allowlist. Pure, no env needed:
//   node --experimental-strip-types scripts/reserved-domains-check.mts
import assert from "node:assert/strict";
import {
  isReservedDomain,
  isProductionRuntime,
  testEmailDomainAllowlist,
  isBlockedReservedDomain,
  isBlockedReservedEmail,
} from "../lib/reservedDomains.ts";

const results: string[] = [];
const check = (name: string, fn: () => void) => {
  try { fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${(e as Error).message}`); }
};

check("reserved domains detected", () => {
  for (const d of ["example.com", "example.org", "example.net", "sub.example.com", "acme.test", "x.invalid", "foo.example", "host.localhost", "EXAMPLE.COM"])
    assert.ok(isReservedDomain(d), d);
});
check("real domains not reserved", () => {
  for (const d of ["gmail.com", "acme.com", "examples.com", "myexample.com", "test.com", "example.co", "testing.io"])
    assert.ok(!isReservedDomain(d), d);
});
check("default (no allowlist): reserved rejected everywhere", () => {
  for (const e of [{}, { VERCEL_ENV: "preview" }, { VERCEL_ENV: "production" }, { NODE_ENV: "development" }])
    assert.ok(isBlockedReservedDomain("example.com", e), JSON.stringify(e));
});
check("preview + allowlist: example.com allowed, example.org still rejected", () => {
  const e = { VERCEL_ENV: "preview", NODE_ENV: "production", WAITLIST_TEST_EMAIL_DOMAINS: "example.com" };
  assert.ok(!isBlockedReservedDomain("example.com", e));
  assert.ok(isBlockedReservedDomain("example.org", e));
});
check("local dev (no VERCEL_ENV, NODE_ENV=development) + allowlist: allowed", () => {
  assert.ok(!isBlockedReservedDomain("example.com", { NODE_ENV: "development", WAITLIST_TEST_EMAIL_DOMAINS: " Example.com , acme.test" }));
  assert.ok(!isBlockedReservedDomain("acme.test", { NODE_ENV: "development", WAITLIST_TEST_EMAIL_DOMAINS: "example.com,acme.test" }));
});
check("VERCEL_ENV=production: allowlist IGNORED entirely", () => {
  const e = { VERCEL_ENV: "production", NODE_ENV: "production", WAITLIST_TEST_EMAIL_DOMAINS: "example.com,example.org,acme.test" };
  assert.ok(isProductionRuntime(e));
  assert.deepEqual(testEmailDomainAllowlist(e), []);
  for (const d of ["example.com", "example.org", "acme.test"]) assert.ok(isBlockedReservedDomain(d, e), d);
});
check("VERCEL_ENV=production even with NODE_ENV=development: still ignored", () => {
  assert.ok(isBlockedReservedDomain("example.com", { VERCEL_ENV: "production", NODE_ENV: "development", WAITLIST_TEST_EMAIL_DOMAINS: "example.com" }));
});
check("fail closed: unknown VERCEL_ENV or non-Vercel NODE_ENV=production ignores allowlist", () => {
  assert.ok(isBlockedReservedDomain("example.com", { VERCEL_ENV: "staging", WAITLIST_TEST_EMAIL_DOMAINS: "example.com" }));
  assert.ok(isBlockedReservedDomain("example.com", { NODE_ENV: "production", WAITLIST_TEST_EMAIL_DOMAINS: "example.com" }));
});
check("allowlist cannot whitelist non-reserved domains (they're unaffected anyway)", () => {
  const e = { VERCEL_ENV: "preview", WAITLIST_TEST_EMAIL_DOMAINS: "mailinator.com,gmail.com" };
  assert.deepEqual(testEmailDomainAllowlist(e), []);
  assert.ok(!isBlockedReservedDomain("gmail.com", e));
});

check("preview: only ob-qa+<case-id>@ addresses may use an allowlisted reserved domain", () => {
  const e = { VERCEL_ENV: "preview", WAITLIST_TEST_EMAIL_DOMAINS: "example.com" };
  assert.ok(!isBlockedReservedEmail("ob-qa+q4-07@example.com", e));
  assert.ok(isBlockedReservedEmail("someone@example.com", e));
  assert.ok(isBlockedReservedEmail("ob-qa+@example.com", e));
  assert.ok(isBlockedReservedEmail("ob-qa+q4-07@example.org", e));
  assert.ok(!isBlockedReservedEmail("someone@gmail.com", e));
});
check("production: ob-qa+ on example.com is still rejected", () => {
  assert.ok(isBlockedReservedEmail("ob-qa+q4-07@example.com", { VERCEL_ENV: "production", WAITLIST_TEST_EMAIL_DOMAINS: "example.com" }));
});

console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
