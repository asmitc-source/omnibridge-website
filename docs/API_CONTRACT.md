# OmniBridge waitlist API contract (v0.3.1, 2026-10-27)

**Changelog (v0.3.1):** no API change. Confirmation footer is `[LEGAL ENTITY] · [REGISTERED ADDRESS] · hello@[domain]`. The brand name in runtime copy comes from `BRAND.name` in `config/site.ts` (`{{brand}}` in the email). Sending stays blocked while any placeholder remains.

**Changelog (v0.3):** a POST with no `Origin` header is `403 forbidden_origin` when `ALLOWED_ORIGINS` is non-empty (an empty list is unchanged). Referral identity keeps the full local part, including the `+tag`, only for `ob-qa+` addresses on reserved test domains, so distinct preview QA cases can earn credit. Every other address still strips `+tag`.

**Status:** approved by Product Lead with fixes (2026-10-27). Fixes applied: no `total` in any response; email template uses copy deck v1.1 keys; reserved test domains rejected (preview-only allowlist); plus/dot self-referrals earn no credit; QA purge function.

Owner: OB Backend. Consumer: OB Frontend. All responses are JSON with `Cache-Control: no-store`. Nothing in any response exposes an email except the caller's own submission.

## POST /api/waitlist

Request body (`Content-Type: application/json`, max 10 KB):

```json
{
  "email": "jane@acme.com",
  "company": "Acme Steel",
  "role": "Head of Procurement",
  "type": "buyer",
  "agents_used": "ChatGPT, internal MCP agent",
  "ref": "k7m2xq9p",
  "ob_hp_company_url": ""
}
```

| Field | Required | Rules |
|---|---|---|
| `email` | yes | Trimmed and lowercased server-side. Must be valid syntax. Reserved test domains are rejected (see below). Disposable domains are rejected, but free providers (Gmail, Outlook, Yahoo and so on) are allowed. |
| `company` | no | Up to 200 chars. An empty string is stored as null. |
| `role` | no | Up to 200 chars. |
| `type` | no | One of `buyer`, `supplier` or `developer`. If it's missing or null, it's stored as null. |
| `agents_used` | no | Free text, up to 1000 chars. |
| `ref` | no | Referral code from `?ref=` in the URL (8 chars from `[a-z2-9]`). An invalid or unknown code is silently ignored. |
| `ob_hp_company_url` | yes, always `""` | Honeypot (see the Frontend notes). |

Success, new signup: **201**
```json
{ "ok": true, "already_registered": false, "position": 42,
  "referral_code": "k7m2xq9p", "share_url": "https://<SITE_URL>/?ref=k7m2xq9p" }
```
Success, duplicate email: **200** with the same shape and `"already_registered": true`. It returns the existing position and code. No new row is written, no email is sent, and the `ref` is not credited.

**The waitlist total is private** (`SHOW_WAITLIST_TOTAL=false`). No endpoint returns `total` or any count of signups: not the 201, not the duplicate 200, not the position GET. The database functions don't return it either. Frontend reads `position` only.

Errors all share one shape: `{ "ok": false, "error": { "code": "...", "message": "...", "fields"?: {...}, "retry_after_seconds"?: n } }`

| HTTP | code | When |
|---|---|---|
| 400 | `invalid_email` | Email is missing, not valid syntax, or on a reserved test domain (unless allowlisted on preview, see below). |
| 400 | `disposable_email` | Email is on a disposable domain. |
| 403 | `forbidden_origin` | `ALLOWED_ORIGINS` is set and the `Origin` header is missing or not on the list. When `ALLOWED_ORIGINS` is empty, the header is not checked. |
| 422 | `validation_error` | Bad JSON, a bad `type`, a field too long or a tripped honeypot. `fields` maps each field to its messages. A tripped honeypot returns a generic message with no `fields`. |
| 429 | `rate_limited` | More than 5 POSTs per 10 min per hashed IP. Also sends a `Retry-After` header. |
| 500 | `server_error` | Anything else. Safe to retry: a retry hits the duplicate path and creates no extra row. |

The `message` values are placeholders. Final user-facing text comes from OB Copy, so Frontend should map from `code`, not `message`.

## GET /api/waitlist/position?code=k7m2xq9p

**200** `{ "ok": true, "position": 40, "referral_count": 1 }`. It never returns the email or the waitlist total.
Also returns **404** `not_found`, **422** `validation_error` (malformed code), **429** `rate_limited` (30 per 10 min) and **500** `server_error`.

## Reserved test domains (Claire, 2026-10-27)

Reserved domains never reach a real inbox, so they're rejected with **400 `invalid_email`**: `example.com`, `example.org`, `example.net` (and their subdomains), and anything under `.test`, `.invalid`, `.example` or `.localhost`.

QA exception: `WAITLIST_TEST_EMAIL_DOMAINS` (comma list, e.g. `example.com`) re-allows the listed reserved domains **on preview and local dev only**. It applies only when `VERCEL_ENV` is `preview` or `development`, or when `VERCEL_ENV` is unset and `NODE_ENV` isn't `production`. Anything else counts as production and the allowlist is ignored entirely (fail closed). Only reserved domains can be listed; it can't unblock a disposable domain. Proven by `scripts/reserved-domains-check.mts`.

QA addresses: `ob-qa+<case-id>@example.com` (e.g. `ob-qa+q4-07@example.com`) on a preview with `WAITLIST_TEST_EMAIL_DOMAINS=example.com`. Never use a real third-party inbox such as `@gmail.com`.

## Referral and position rules

Decided by Asmit, 2026-10-26: the referral bump is ON at launch, and each verified referral moves the referrer up 5 places, capped at #1.

**Verified referral (Product Lead definition, verbatim):** a signup made with the referrer's code that passes every check: email validation and normalisation, dedupe, the disposable-domain check, the honeypot and the rate limit. Self-referrals don't count, including plus/dot tricks (site plan §e). Email confirmation isn't required while Resend is off; we'll revisit once a sender is approved. Duplicates and disposable domains don't count.

**Anti-abuse rule (approved by Product Lead, 2026-10-26):** a referral from the same hashed IP as the referrer does not count. The signup itself still succeeds and gets its own position.

**Self-referral via plus/dot variants (site plan §e):** the server derives a *referral identity key* from the normalised email: the local part with any `+tag` removed (all domains), and for `gmail.com` / `googlemail.com` also with dots removed and the domain mapped to `gmail.com`. If the referred signup and the referrer share this key, the referral earns no credit. The signup still succeeds and gets its own position, and dedupe stays on the exact normalised email (so `me+1@acme.com` and `me@acme.com` are two rows). The key is computed in SQL (`waitlist_referral_identity_key`) when positions are calculated. Nothing extra is stored.

**QA exception (v0.3):** that `+tag` strip is skipped only when the local part starts with `ob-qa+` and the domain is a reserved test domain (the same set rejected outside preview/dev: `example.com` / `.org` / `.net` and their subdomains, and names under `.test`, `.invalid`, `.example`, or `.localhost`). The full local part is kept, so `ob-qa+a@example.com` and `ob-qa+b@example.com` are different identities and a referral between them counts. `ob-qa+` on any other domain, including Gmail, still strips the tag.

| Referrer | New signup with referrer's code | Credit |
|---|---|---|
| `me@acme.com` | `me+1@acme.com` | 0 |
| `samsmith@gmail.com` | `s.a.m.smith+x@googlemail.com` | 0 |
| `m.e@acme.com` | `me@acme.com` | 1 (dots only collapse on Gmail) |
| `ob-qa+a@example.com` | `ob-qa+b@example.com` | 1 (QA tag kept on a reserved domain) |
| `alice+x@gmail.com` | `alice+y@gmail.com` | 0 |

**Tie-break (Product Lead, verbatim):** when two people land on the same position after a bump, the earlier signup time ranks higher, then the lower row ID.

How this is implemented:
- `signup_order` is the rank by `created_at`, then `id`.
- `score = max(1, signup_order - verified_referrals x 5)`. Nobody can go above position 1.
- `position` is the rank by `score`, then `created_at`, then `id`. It's deterministic: the same data always gives the same order.
- Where each rule is enforced: disposable domains, honeypot hits and rate-limited requests never create a row, so they can never count. A duplicate email returns the existing row and its `ref` is ignored. Using your own code on the same row is blocked by a database constraint. Plus/dot variants of the referrer's email and same-IP referrals are excluded when positions are calculated.
- Settings live in a single row in `waitlist_settings`: `referral_bump_enabled=true`, `referral_bump=5`, `require_sent_confirmation=false` (flip it once Resend is approved) and `count_same_ip_referrals=false` (the same-IP exclusion is on). Changing any of them needs no deploy.

## Confirmation email

Off by default (`WAITLIST_EMAIL_ENABLED=false`, `RESEND_FROM` empty) until Claire approves the sender domain. Signups work without it, and status is recorded as `skipped`. The email is sent after the response, so it never slows down or breaks the form. Duplicates never trigger it.

Template text is held in `lib/copy/emailConfirm.ts` (copy deck v1.1, plus Claire's 2026-10-27 footer). Merge tags: `{{brand}}` (from `BRAND.name` in `config/site.ts`), `{{position}}`, `{{share_url}}`, `{{site_url}}`, `{{privacy_url}}` (= `SITE_URL/privacy`), `{{unsubscribe_url}}` (= `WAITLIST_UNSUBSCRIBE_URL`).

Send gate: even with email switched on, nothing sends while `WAITLIST_UNSUBSCRIBE_URL` is empty or any copy string still has a placeholder. The gate matches `[LEGAL ENTITY]`, `[REGISTERED ADDRESS]`, `[domain]` (including `hello@[domain]`), and an unresolved brand token in either form, `{brand}` or `{{brand}}`, case-insensitive. Today `email.confirm.footer.entity` is `[LEGAL ENTITY] · [REGISTERED ADDRESS] · hello@[domain]`, and the template still contains `{{brand}}`, so the gate holds until Copy replaces the footer and the brand token is only the filled name.

## QA data cleanup (service_role only)

- `select * from public.waitlist_purge_qa_rows();` deletes signups whose email starts `ob-qa+` and ends `@example.com`, clears `waitlist_rate_limits`, and returns `signups_before`, `qa_signups_deleted`, `signups_after`, `rate_limit_rows_before`, `rate_limit_rows_after`. Non-QA rows referred by a QA row keep their row, with `referred_by` set to null. Deleting QA rows shifts positions, so run each Q4 batch against a clean table.
- `select * from public.waitlist_clear_rate_limits();` clears rate-limit rows only (e.g. after the 429 test) and returns before/after counts.
- Both are revoked from `public`, `anon` and `authenticated`. Backend runs them on request and logs the counts.

## Frontend notes

- Honeypot: render `<input name="ob_hp_company_url">`. Hide it off-screen with CSS (not `type="hidden"`), and give it `tabIndex={-1}`, `autoComplete="off"` and `aria-hidden="true"`. Always send its value.
- Read `?ref=` from the landing URL, keep it in sessionStorage, and send it as `ref`.
- Send the request same-origin, with no auth header. No Supabase keys are used in the browser at all.
