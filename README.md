# OmniBridge website

Phase 1 waitlist site. Public pages are not built yet; the home page is a placeholder. The waitlist API lives under `app/api/waitlist`.

## Local setup

Node.js 20 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Fill in `.env.local` before calling the API. Do not commit that file.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | API helper checks and `{brand}` interpolation |
| `npm run check:red` | Alert-colour gate. Those styles may appear only in `RedAlertModal`, `KillSwitchButton`, and `PausePulse`, plus a token `reserved` block |
| `npm run check:copy` | Rendered-copy gate. Needs `lib/copy/site.copy.json` from the approved deck |
| `npm run build:copy` | Writes that flat key-to-string file from the deck. It does not invent keys |

`check:copy` is not in CI until the dictionary exists. `check:red` and `npm test` are.

The home page is a shell (`components/shell/SiteShell.tsx`) around the existing placeholder. Section copy is not in the repo yet. `{brand}` in site copy is filled from `BRAND.name` at render (`lib/copy/interpolate.ts`). A rename is a one-line change in `config/site.ts`. `SHOW_WAITLIST_TOTAL` in `config/flags.ts` is `false`.

`npm run build` does not need environment variables. Handlers read them when a request arrives.

## Environment variables

Copy `.env.example` to `.env.local`. Every variable is server-only. None use the `NEXT_PUBLIC_` prefix. In hosting, set them in the project environment settings, not in git.

| Variable | Required for API calls | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service-role key. Bypasses RLS. Never expose it to the browser. |
| `IP_HASH_SALT` | yes | HMAC salt for client IPs. Generate with `openssl rand -hex 32`. Raw IPs are not stored. |
| `SITE_URL` | no | Public origin for referral links, no trailing slash. Defaults to `http://localhost:3000`. |
| `ALLOWED_ORIGINS` | no | Comma-separated `Origin` allow-list for `POST /api/waitlist`. Empty means the check is off. When set, a missing `Origin` is rejected. |
| `WAITLIST_EMAIL_ENABLED` | no | Set to `true` to send confirmation email. Default off. Signups work without it. |
| `RESEND_API_KEY` | only if email is on | Resend API key. |
| `RESEND_FROM` | only if email is on | Sender, for example `OmniBridge <waitlist@your-domain>`. |
| `RESEND_REPLY_TO` | no | Optional reply-to address. |
| `WAITLIST_UNSUBSCRIBE_URL` | only if email is on | Merge value for `{{unsubscribe_url}}`. The confirmation email does not send while this is empty. |
| `WAITLIST_SIGNUP_RATE_LIMIT` | no | Default `5`. |
| `WAITLIST_SIGNUP_RATE_WINDOW_SECONDS` | no | Default `600`. |
| `WAITLIST_POSITION_RATE_LIMIT` | no | Default `30`. |
| `WAITLIST_POSITION_RATE_WINDOW_SECONDS` | no | Default `600`. |
| `WAITLIST_CANONICALISE_GMAIL` | no | Default `false`. Not wired into the database unique index. See the API contract. |
| `WAITLIST_TEST_EMAIL_DOMAINS` | no | Preview and local dev only. Comma-separated reserved domains (for example `example.com`) accepted solely for `ob-qa+<id>@` addresses. Ignored in production. Leave empty on production. |

## Database migration

Schema: [`supabase/migrations/0001_waitlist.sql`](supabase/migrations/0001_waitlist.sql). Backend has applied this migration to the Supabase project. This repo does not contain database credentials. To apply or re-apply it locally (the file is idempotent):

Apply it with any Postgres client against the database you intend to use:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0001_waitlist.sql
```

You can also paste the file into the Supabase SQL editor. `DATABASE_URL` stays out of the repo. The service-role key in `.env.local` is separate from this URL.

Optional local checks (plain Postgres, not part of `npm test`): [`supabase/tests/waitlist_local_test.sql`](supabase/tests/waitlist_local_test.sql). Notes from a previous run are in [`docs/TEST_LOG_local.md`](docs/TEST_LOG_local.md).

## API

Request and response shapes, error codes, and referral rules: [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).
