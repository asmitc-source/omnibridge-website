// Quick local checks of lib helpers + email template render. Run:
//   IP_HASH_SALT=test npx tsx --conditions=react-server scripts/helpers-check.mts
import assert from "node:assert/strict";
import { createElement } from "react";
import { render } from "@react-email/components";
import { normaliseEmail, isValidEmailSyntax, canonicaliseForDedupe } from "../lib/email";
import { isDisposableDomain } from "../lib/disposable";
import { hashIp, clientIp } from "../lib/ipHash";
import { isHoneypotTripped, HONEYPOT_FIELD } from "../lib/honeypot";
import { waitlistBodySchema } from "../lib/validation";
import WaitlistConfirmation from "../emails/WaitlistConfirmation";

const results: string[] = [];
const check = (name: string, fn: () => void) => {
  try { fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${(e as Error).message}`); }
};

check("normalise trims + lowercases only", () => {
  assert.equal(normaliseEmail("  First.Last+tag@Gmail.COM "), "first.last+tag@gmail.com");
});
check("valid emails accepted", () => {
  for (const e of ["a@b.co", "first.last+tag@sub.example.org", "x@xn--bcher-kva.example"]) assert.ok(isValidEmailSyntax(e), e);
});
check("invalid emails rejected", () => {
  for (const e of ["", "a", "a@b", "@b.co", "a@@b.co", "a b@c.co", "a..b@c.co", "a@-b.co", "a@b.c", `${"x".repeat(65)}@b.co`]) assert.ok(!isValidEmailSyntax(e), e);
});
check("gmail canonicalisation is opt-in helper only", () => {
  assert.equal(canonicaliseForDedupe("f.irst+x@googlemail.com"), "first@gmail.com");
  assert.equal(canonicaliseForDedupe("f.irst+x@acme.com"), "f.irst+x@acme.com");
});
check("disposable domains flagged", () => {
  assert.ok(isDisposableDomain("mailinator.com"));
  assert.ok(isDisposableDomain("sub.mailinator.com"));
  assert.ok(!isDisposableDomain("gmail.com"));
  assert.ok(!isDisposableDomain("acme-corp-example.com"));
});
check("ip hash is 64-hex HMAC, deterministic, never raw ip", () => {
  const h = hashIp("203.0.113.7")!;
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(h, hashIp("203.0.113.7"));
  assert.notEqual(h, hashIp("203.0.113.8"));
  assert.ok(!h.includes("203"));
  assert.equal(hashIp(null), null);
});
check("client ip from x-forwarded-for first entry", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })), "203.0.113.7");
});
check("honeypot", () => {
  assert.ok(!isHoneypotTripped({ [HONEYPOT_FIELD]: "" }));
  assert.ok(!isHoneypotTripped({}));
  assert.ok(isHoneypotTripped({ [HONEYPOT_FIELD]: "http://spam" }));
});
check("schema: type enum + optional fields + ref sanitised", () => {
  const ok = waitlistBodySchema.safeParse({ email: "a@b.co", type: "buyer", company: "  ", ref: "ABCDEFGH" });
  assert.ok(ok.success);
  assert.equal(ok.data!.company, null);
  assert.equal(ok.data!.ref, "abcdefgh");
  assert.equal(waitlistBodySchema.safeParse({ email: "a@b.co", type: "buyer", ref: "bad" }).data!.ref, null);
  assert.ok(!waitlistBodySchema.safeParse({ email: "a@b.co", type: "investor" }).success);
  assert.ok(!waitlistBodySchema.safeParse({ email: "a@b.co", type: "buyer", agents_used: "x".repeat(1001) }).success);
});

const el = createElement(WaitlistConfirmation, { position: 42, shareUrl: "https://example.test/?ref=abcd2345" });
const html = await render(el);
const text = await render(el, { plainText: true });
check("email template renders html + text with position and share url", () => {
  assert.ok(html.includes("42") && html.includes("https://example.test/?ref=abcd2345"));
  assert.ok(text.includes("PLACEHOLDER"));
});
console.log(results.join("\n"));
console.log("--- plain-text render of placeholder email ---\n" + text);
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
