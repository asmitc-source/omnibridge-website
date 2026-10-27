// Quick local checks of lib helpers + email template render. Run:
//   IP_HASH_SALT=test npx tsx --tsconfig scripts/tsconfig.test.json --require ./scripts/stub-server-only.cjs scripts/helpers-check.mts
import assert from "node:assert/strict";
import { createElement } from "react";
import { render } from "@react-email/components";
import { normaliseEmail, isValidEmailSyntax, canonicaliseForDedupe } from "../lib/email";
import { isDisposableDomain } from "../lib/disposable";
import { hashIp, clientIp } from "../lib/ipHash";
import { isHoneypotTripped, HONEYPOT_FIELD } from "../lib/honeypot";
import { waitlistBodySchema } from "../lib/validation";
import * as WC from "../emails/WaitlistConfirmation";
import { EMAIL_CONFIRM_COPY, emailCopyBlockers } from "../lib/copy/emailConfirm";

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
  assert.ok(!h.includes("203.0.113.7")); // raw IP never appears (a hex digest can contain "203" by chance)
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

// CJS/ESM interop under tsx: the default export may arrive wrapped.
const WCm = WC as unknown as { default: unknown; waitlistConfirmationSubject?: unknown };
const inner = (WCm.default ?? {}) as Record<string, unknown>;
const WaitlistConfirmation = (typeof WCm.default === "function" ? WCm.default : inner.default) as typeof WC.default;
const waitlistConfirmationSubject = (WCm.waitlistConfirmationSubject ?? inner.waitlistConfirmationSubject) as typeof WC.waitlistConfirmationSubject;
const props = {
  position: 42,
  shareUrl: "https://ob.test/?ref=abcd2345",
  siteUrl: "https://ob.test",
  privacyUrl: "https://ob.test/privacy",
  unsubscribeUrl: "https://ob.test/unsubscribe?t=x",
};
const el = createElement(WaitlistConfirmation, props);
const html = await render(el);
const text = await render(el, { plainText: true });
check("email template renders copy deck v1.1 strings with merge tags filled", () => {
  assert.equal(waitlistConfirmationSubject(props), "You're #42 on the OmniBridge waitlist");
  assert.ok(text.includes("You're on the OmniBridge waitlist. Your spot is #42."));
  assert.ok(text.includes("Your link: https://ob.test/?ref=abcd2345"));
  assert.ok(text.includes("Unsubscribe: https://ob.test/unsubscribe?t=x · Privacy: https://ob.test/privacy"));
  assert.ok(html.includes("https://ob.test/?ref=abcd2345"));
  assert.ok(!/TODO\(copy\)|\[PLACEHOLDER|\{\{/.test(text + html), "leftover TODO/PLACEHOLDER/merge tag");
});
check("footer is Claire's 2026-10-27 line and still blocks sending", () => {
  assert.equal(
    EMAIL_CONFIRM_COPY["email.confirm.footer.entity"],
    "[LEGAL ENTITY] · [REGISTERED ADDRESS] · hello@[domain]",
  );
  const blockers = emailCopyBlockers({ position: 1, share_url: "s", site_url: "s", privacy_url: "p", unsubscribe_url: "u" });
  assert.ok(blockers.includes("email.confirm.footer.entity"));
});
console.log(results.join("\n"));
console.log("--- plain-text render of confirmation email (copy deck v1.1) ---\n" + text);
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
