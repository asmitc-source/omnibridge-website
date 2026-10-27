# OmniBridge website

Phase 1 waitlist site. The home page, the routes linked from the nav and footer, and `POST /api/waitlist` are in this repo. WebGL scenes are poster frames. The deal-room demo is DOM.

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
| `npm run check:red` | Alert-colour gate. Those styles may appear only in `RedAlertModal`, `KillSwitchButton`, and `PausePulse`, plus `tokens.json` and `app/tokens.generated.css` |
| `npm run check:copy` | Rendered-copy gate. Fails on a missing key, a `note` or `internal` key, a flagged-hidden key while its flag is off, or the brand name outside `config/site.ts` and the changelog |
| `npm run check:tokens` | Confirms the generated theme CSS and `motion/tokens.ts` match `tokens.json` |
| `npm run build:copy` | Rewrites `lib/copy/site.copy.json` from the approved deck, keeping only keys the site renders |

`check:copy`, `check:red`, and `check:tokens` run in CI with lint, typecheck, test, and build.

## Copy and the brand name

User-facing sentences live in `lib/copy/site.copy.json`. That file holds only keys the pages render. Components call `copy("key")`. `{brand}` is filled at render from `BRAND.name` in `config/site.ts`, including metadata, Open Graph text, JSON-LD, the wordmark, and aria labels. A rename is that one line. `SHOW_WAITLIST_TOTAL` is `false`, so the waitlist total and the excluded-referral rule are not rendered and their strings are not in the dictionary.

The success state shares with plain intent URLs only: `https://x.com/intent/post`, `https://www.linkedin.com/sharing/share-offsite/`, a `mailto:` link whose subject and body come from the referral copy keys, and Copy link. There is no share SDK. Colour tokens come from `tokens.json` (approved 1.2.0). `npm run check:tokens` confirms the generated theme.

## Structure

| Path | Role |
|---|---|
| `app/` | Routes, layout, metadata, sitemap, robots |
| `components/chrome/` | Header, footer, command bar, cookie banner, mobile waitlist bar |
| `components/home/` | The ten home sections |
| `components/form/WaitlistForm.tsx` | Waitlist form and success share row |
| `components/demo/` | DOM deal room, RED ALERT, kill-switch illustration, pause pulse |
| `components/scenes/` | Poster-tier SVG frames. WebGL scenes are not built |
| `components/content/` | Shared page intro, FAQ, legal blocks |
| `lib/copy/` | Dictionary, demo script, `{brand}` interpolation |
| `config/site.ts` | `BRAND.name`, `SIGNED_RECORD_TERM`, flags |
| `tokens.json` | Colour, type, and motion tokens |
| `app/api/waitlist/` | Signup and position API. Behaviour is owned by the backend |

Components: `SiteHeader`, `Footer`, `CommandBar`, `CookieBanner`, `MobileCta`, `RefCapture`, `WaitlistForm`, `HomeSections`, `DemoSimulation`, `RedAlertModal`, `KillSwitchButton`, `PausePulse`, `NetworkPoster`, `WallsPoster`, `ShieldPoster`, `ConnectPoster`, `ChannelPoster`, `FaqList`.

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
