# OmniBridge waitlist API contract (v0.2, 2026-10-27)

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
| `email` | yes | Trimmed and lowercased server-side. Must be valid syntax. Disposable domains are rejected, but free providers (Gmail, Outlook, Yahoo and so on) are allowed. |
| `company` | no | Up to 200 chars. An empty string is stored as null. |
| `role` | no | Up to 200 chars. |
| `type` | no | One of `buyer`, `supplier` or `developer`. If it's missing or null, it's stored as null. |
| `agents_used` | no | Free text, up to 1000 chars. |
| `ref` | no | Referral code from `?ref=` in the URL (8 chars from `[a-z2-9]`). An invalid or unknown code is silently ignored. |
| `ob_hp_company_url` | yes, always `""` | Honeypot (see the Frontend notes). |

Success, new signup: **201**
```json
{ "ok": true, "already_registered": false, "position": 42, "total": 42,
  "referral_code": "k7m2xq9p", "share_url": "https://<SITE_URL>/?ref=k7m2xq9p" }
```
Success, duplicate email: **200** with the same shape and `"already_registered": true`. It returns the existing position and code. No new row is written, no email is sent, and the `ref` is not credited.

Errors all share one shape: `{ "ok": false, "error": { "code": "...", "message": "...", "fields"?: {...}, "retry_after_seconds"?: n } }`

| HTTP | code | When |
|---|---|---|
| 400 | `invalid_email` | Email is missing or not valid syntax. |
| 400 | `disposable_email` | Email is on a disposable domain. |
| 403 | `forbidden_origin` | `ALLOWED_ORIGINS` is set and the Origin is not on it. |
| 422 | `validation_error` | Bad JSON, a bad `type`, a field too long or a tripped honeypot. `fields` maps each field to its messages. A tripped honeypot returns a generic message with no `fields`. |
| 429 | `rate_limited` | More than 5 POSTs per 10 min per hashed IP. Also sends a `Retry-After` header. |
| 500 | `server_error` | Anything else. Safe to retry: a retry hits the duplicate path and creates no extra row. |

The `message` values are placeholders. Final user-facing text comes from OB Copy, so Frontend should map from `code`, not `message`.

## GET /api/waitlist/position?code=k7m2xq9p

**200** `{ "ok": true, "position": 40, "referral_count": 1 }`. It never returns the email.
Also returns **404** `not_found`, **422** `validation_error` (malformed code), **429** `rate_limited` (30 per 10 min) and **500** `server_error`.

## Referral and position rules

Decided by Asmit, 2026-10-26: the referral bump is ON at launch, and each verified referral moves the referrer up 5 places, capped at #1.

**Verified referral (Product Lead definition, verbatim):** a signup made with the referrer's code that passes every check: email validation and normalisation, dedupe, the disposable-domain check, the honeypot and the rate limit. Self-referrals don't count. Email confirmation isn't required while Resend is off; we'll revisit once a sender is approved. Duplicates and disposable domains don't count.

**Anti-abuse rule (approved by Product Lead, 2026-10-26):** a referral from the same hashed IP as the referrer does not count. The signup itself still succeeds and gets its own position.

**Tie-break (Product Lead, verbatim):** when two people land on the same position after a bump, the earlier signup time ranks higher, then the lower row ID.

How this is implemented:
- `signup_order` is the rank by `created_at`, then `id`.
- `score = max(1, signup_order - verified_referrals x 5)`. Nobody can go above position 1.
- `position` is the rank by `score`, then `created_at`, then `id`. It's deterministic: the same data always gives the same order.
- Where each rule is enforced: disposable domains, honeypot hits and rate-limited requests never create a row, so they can never count. A duplicate email returns the existing row and its `ref` is ignored. Self-referral is blocked by a database constraint. A same-IP referral is excluded when positions are calculated.
- Settings live in a single row in `waitlist_settings`: `referral_bump_enabled=true`, `referral_bump=5`, `require_sent_confirmation=false` (flip it once Resend is approved) and `count_same_ip_referrals=false` (the same-IP exclusion is on). Changing any of them needs no deploy.

## Confirmation email

Off by default (`WAITLIST_EMAIL_ENABLED=false`, `RESEND_FROM` empty). Signups work without it, and status is recorded as `skipped`. The email is sent after the response, so it never slows down or breaks the form. Template copy is a placeholder marked TODO(copy).

## Frontend notes

- Honeypot: render `<input name="ob_hp_company_url">`. Hide it off-screen with CSS (not `type="hidden"`), and give it `tabIndex={-1}`, `autoComplete="off"` and `aria-hidden="true"`. Always send its value.
- Read `?ref=` from the landing URL, keep it in sessionStorage, and send it as `ref`.
- Send the request same-origin, with no auth header. No Supabase keys are used in the browser at all.
