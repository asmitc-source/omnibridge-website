# Local test log v0.2 (plain Postgres 17 on the OB Backend box, NOT Supabase) — 2026-10-26 19:40 IST

Contract v0.2 with Product Lead fixes plus Claire's reserved-domain rule. Fresh DB `ob_waitlist_test`. Migration `supabase/migrations/0001_waitlist.sql` applied, then applied again (idempotent re-run OK), then `supabase/tests/waitlist_local_test.sql` run: exit 0, 0 FAIL.

Defaults: bump ON at 5 (cap #1), email confirmation not required, same-IP exclusion ON, type optional. Email OFF (`WAITLIST_EMAIL_ENABLED=false`, `RESEND_FROM` empty).

## App checks (no env vars set)

- `npx tsc --noEmit`: pass
- `npx next build`: pass (routes: /api/waitlist, /api/waitlist/position)
- lint: no ESLint config in the repo. Ran ESLint 9 + typescript-eslint recommended + react-hooks from a throwaway config outside the repo over app/ lib/ emails/ scripts/: 0 problems

### scripts/reserved-domains-check.mts (`node --experimental-strip-types`)
```
PASS reserved domains detected
PASS real domains not reserved
PASS default (no allowlist): reserved rejected everywhere
PASS preview + allowlist: example.com allowed, example.org still rejected
PASS local dev (no VERCEL_ENV, NODE_ENV=development) + allowlist: allowed
PASS VERCEL_ENV=production: allowlist IGNORED entirely
PASS VERCEL_ENV=production even with NODE_ENV=development: still ignored
PASS fail closed: unknown VERCEL_ENV or non-Vercel NODE_ENV=production ignores allowlist
PASS allowlist cannot whitelist non-reserved domains (they're unaffected anyway)
```

### scripts/helpers-check.mts (`IP_HASH_SALT=test npx tsx --tsconfig scripts/tsconfig.test.json --require ./scripts/stub-server-only.cjs`)
```
PASS normalise trims + lowercases only
PASS valid emails accepted
PASS invalid emails rejected
PASS gmail canonicalisation is opt-in helper only
PASS disposable domains flagged
PASS ip hash is 64-hex HMAC, deterministic, never raw ip
PASS client ip from x-forwarded-for first entry
PASS honeypot
PASS schema: type enum + optional fields + ref sanitised
PASS email template renders copy deck v1.1 strings with merge tags filled
PASS email copy map is byte-identical to copy deck v1.1 Appendix A
PASS send gate: deck placeholders ([LEGAL ENTITY], omnibridge.example) block sending
```

PENDING: the real end-to-end test on a Vercel preview.

## SQL run output
```
--- 0. Launch defaults: bump ON, 5 places, no email confirmation required ---
 referral_bump_enabled | referral_bump | require_sent_confirmation | count_same_ip_referrals 
-----------------------+---------------+---------------------------+-------------------------
 t                     |             5 | f                         | f

--- 1. Seven signups A..G (distinct hashed IPs) ---
 who |                  id                  | referral_code | already_registered | queue_position | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+----------------
 A   | f264e211-1d42-4b0d-bc92-6919ee0fe16d | pz38sfty      | f                  |              1 |              0

 who |                  id                  | referral_code | already_registered | queue_position | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+----------------
 B   | 27b37b59-215d-46d7-82fe-33d700851bca | 7uwd4hjm      | f                  |              2 |              0

 who |                  id                  | referral_code | already_registered | queue_position | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+----------------
 C   | 1ff1ae60-5804-4e7e-b6e0-b20333db04e0 | 4b47vqyc      | f                  |              3 |              0

 who |                  id                  | referral_code | already_registered | queue_position | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+----------------
 D   | 655f7b09-3527-450c-a317-30ef0038ee12 | jhdenthf      | f                  |              4 |              0

 who |                  id                  | referral_code | already_registered | queue_position | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+----------------
 E   | d392a14f-fa72-4e41-adcb-7a8a60f7183a | tkrtdk77      | f                  |              5 |              0

 who |                  id                  | referral_code | already_registered | queue_position | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+----------------
 F   | 73d9dcde-7c16-4595-9acd-4eed425b79c7 | 8x5duczk      | f                  |              6 |              0

 who |                  id                  | referral_code | already_registered | queue_position | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+----------------
 G   | 8c7981b1-4dc0-4000-831f-4ecc1e91de40 | 4reghb9u      | f                  |              7 |              0

--- 2. Duplicate of A (different case + whitespace) returns existing row, no new row ---
  who  |                  id                  | referral_code | already_registered | queue_position | referral_count 
-------+--------------------------------------+---------------+--------------------+----------------+----------------
 A-dup | f264e211-1d42-4b0d-bc92-6919ee0fe16d | pz38sfty      | t                  |              1 |              0

 total_rows_after_dup 
----------------------
                    7

--- 3. H signs up with F's referral code (status pending -> not counted yet) ---
 who |                  id                  | referral_code | already_registered | queue_position | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+----------------
 H   | 9a13ca83-a2ea-4bd9-a678-f0712c7f67d2 | 98xe755y      | f                  |              8 |              0

--- 3a. Launch defaults (bump ON, 5 places, no email confirmation needed): F 6 -> 2 ---
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:31: NOTICE:  PASS verified referral (form submit) bumps F from 6 to 2; tie with A at score 1 broken by earlier signup
       who        | queue_position | referral_count 
------------------+----------------+----------------
 F before confirm |              2 |              1

--- 3b. H confirmation email marked sent -> F bumped by 5 places (6 -> score 1, tie with A broken by created_at) ---
 waitlist_set_email_status 
---------------------------
 

       who       | queue_position | referral_count 
-----------------+----------------+----------------
 F after confirm |              2 |              1

--- 4. Duplicate-email referral: B re-submits with G's code -> no new row, G not credited ---
      who       | already_registered | queue_position 
----------------+--------------------+----------------
 B-dup w/ G ref | t                  |              3

--- 5. Same-IP referral: new email from G's hashed IP using G's code, confirmed -> not credited ---
  who  | already_registered 
-------+--------------------
 G-alt | f

 waitlist_set_email_status 
---------------------------
 

 who | queue_position | referral_count 
-----+----------------+----------------
 G   |              7 |              0

--- 5b. type omitted is accepted (stored null) ---
 who | already_registered 
-----+--------------------
 T   | f

--- 6. Unknown referral code is ignored (signup still succeeds, referred_by null) ---
 who | already_registered 
-----+--------------------
 K   | f

     email     | referred_by_is_null 
---------------+---------------------
 kim@acme.test | t

--- Full ordering (service_role view) ---
        email        | signup_order | referral_count | effective_score | queue_position 
---------------------+--------------+----------------+-----------------+----------------
 alice@acme.test     |            1 |              0 |               1 |              1
 frank@acme.test     |            6 |              1 |               1 |              2
 bob@acme.test       |            2 |              0 |               2 |              3
 carol@acme.test     |            3 |              0 |               3 |              4
 dan@acme.test       |            4 |              0 |               4 |              5
 erin@acme.test      |            5 |              0 |               5 |              6
 grace@acme.test     |            7 |              0 |               7 |              7
 henry@other.test    |            8 |              0 |               8 |              8
 grace.alt@acme.test |            9 |              0 |               9 |              9
 tara@acme.test      |           10 |              0 |              10 |             10
 kim@acme.test       |           11 |              0 |              11 |             11

--- 7. Assertions ---
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:105: NOTICE:  PASS self-referral blocked by check constraint
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:105: NOTICE:  PASS non-normalised email rejected
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:105: NOTICE:  PASS invalid type rejected
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:105: NOTICE:  PASS all signup/position assertions
--- 8. Rate limit: 5 per 600s, 6th hit blocked ---
 hit | allowed | hits 
-----+---------+------
   1 | t       |    1

 hit | allowed | hits 
-----+---------+------
   2 | t       |    2

 hit | allowed | hits 
-----+---------+------
   3 | t       |    3

 hit | allowed | hits 
-----+---------+------
   4 | t       |    4

 hit | allowed | hits 
-----+---------+------
   5 | t       |    5

 hit | allowed | hits 
-----+---------+------
   6 | f       |    6

   hit    | allowed | hits 
----------+---------+------
 other IP | t       |    1

--- 8b. Private total: no function or view exposes a total column ---
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:126: NOTICE:  PASS no total in waitlist_positions / waitlist_signup / waitlist_position_by_code
--- 10. Referral identity key (plus/dot variants) ---
            email             |    identity_key     
------------------------------+---------------------
 me+1@acme.com                | me@acme.com
 Me@ACME.com                  | me@acme.com
 m.e@acme.com                 | m.e@acme.com
 f.irst.last+x@googlemail.com | firstlast@gmail.com
 firstlast@gmail.com          | firstlast@gmail.com
 +lead@acme.com               | +lead@acme.com
 a.b+c+d@gmail.com            | ab@gmail.com

psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:138: NOTICE:  PASS identity key unit cases
--- 10a. Plus-variant self-referral: sam+2@corp.test uses sam@corp.test code (different IP) -> 0 credit, signup succeeds ---
 who | already_registered | queue_position | referral_count 
-----+--------------------+----------------+----------------
 S   | f                  |             12 |              0

 who | already_registered 
-----+--------------------
 S+2 | f

--- 10b. Gmail dot/googlemail self-referral: s.a.m.smith+x@googlemail.com uses samsmith@gmail.com code -> 0 credit ---
 who | already_registered 
-----+--------------------
 GM  | f

  who   | already_registered 
--------+--------------------
 GM-dot | f

   who   | already_registered 
---------+--------------------
 GM-dot2 | f

--- 10c. Control: a genuinely different person with samsmith@gmail.com code -> 1 credit ---
  who  | already_registered 
-------+--------------------
 Other | f

psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:166: NOTICE:  PASS plus-variant self-referral earns 0 (sam@corp.test referral_count=0)
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:166: NOTICE:  PASS variant signups still succeed as separate rows (dedupe on exact normalised email)
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:166: NOTICE:  PASS gmail dot + googlemail variants earn 0; genuine referral still earns 1 (samsmith@gmail.com referral_count=1)
--- 11. QA purge: ob-qa+<case>@example.com rows removed, non-QA rows kept ---
 who | already_registered 
-----+--------------------
 QA1 | f

 who | already_registered 
-----+--------------------
 QA2 | f

         who          | already_registered 
----------------------+--------------------
 NonQA referred by QA | f

      who      | already_registered 
---------------+--------------------
 Decoy no-plus | f

        who         | already_registered 
--------------------+--------------------
 Decoy other domain | f

 seeded_rate_limit_row 
-----------------------
 t

 signups_before | qa_signups_deleted | signups_after | rate_limit_rows_before | rate_limit_rows_after 
----------------+--------------------+---------------+------------------------+-----------------------
             22 |                  2 |            20 |                      3 |                     0

psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:194: NOTICE:  PASS purge removed 2 QA rows, kept all 20 non-QA rows (decoys kept, nora referred_by -> null), rate limits cleared
            run            | signups_before | qa_signups_deleted | signups_after | rate_limit_rows_before | rate_limit_rows_after 
---------------------------+----------------+--------------------+---------------+------------------------+-----------------------
 second purge (idempotent) |             20 |                  0 |            20 |                      0 |                     0

--- 11b. Clear rate limits only ---
 seeded 
--------
 t

 seeded 
--------
 t

 rate_limit_rows_before | rate_limit_rows_after 
------------------------+-----------------------
                      2 |                     0

psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:204: NOTICE:  PASS waitlist_clear_rate_limits cleared rows, signups untouched
--- 9. anon / authenticated cannot read emails or call RPCs ---
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:222: NOTICE:  PASS anon select on waitlist_signups denied
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:222: NOTICE:  PASS anon select on waitlist_positions denied
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:222: NOTICE:  PASS anon execute waitlist_signup denied
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:222: NOTICE:  PASS anon execute waitlist_position_by_code denied
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:222: NOTICE:  PASS anon execute waitlist_purge_qa_rows denied
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:222: NOTICE:  PASS anon execute waitlist_clear_rate_limits denied
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:232: NOTICE:  PASS authenticated select on waitlist_signups denied
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:232: NOTICE:  PASS authenticated execute waitlist_purge_qa_rows denied
psql:/workspace/omnibridge-backend/supabase/tests/waitlist_local_test.sql:232: NOTICE:  PASS authenticated execute waitlist_clear_rate_limits denied
--- DONE ---
```
