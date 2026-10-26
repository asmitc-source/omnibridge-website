# Local test log v0.2 (plain Postgres 17 on the OB Backend box, NOT Supabase) — 2026-10-26 18:31 IST

Defaults: bump ON at 5 (cap #1), email confirmation not required, same-IP exclusion ON, type optional. tsc --noEmit: pass.

PENDING: the real end-to-end test on a Vercel preview.

\`\`\`
SET
--- 0. Launch defaults: bump ON, 5 places, no email confirmation required ---
 referral_bump_enabled | referral_bump | require_sent_confirmation | count_same_ip_referrals 
-----------------------+---------------+---------------------------+-------------------------
 t                     |             5 | f                         | f

--- 1. Seven signups A..G (distinct hashed IPs) ---
 who |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 A   | ea965962-1ea0-4596-887b-fdb14baa1ba4 | 2xmbaw55      | f                  |              1 |     1 |              0

 who |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 B   | b6ae1124-f062-4e94-a41f-c936c40cff5a | pkm9sdcu      | f                  |              2 |     2 |              0

 who |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 C   | df66e7e9-f391-4794-ab4d-8fb62371b67e | 3z85k39w      | f                  |              3 |     3 |              0

 who |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 D   | 7ac3c988-abfb-4de7-bbf0-af89d274c84d | uxpu3a8f      | f                  |              4 |     4 |              0

 who |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 E   | 544e4132-4b17-4680-ae75-b1c269decfa9 | npcbt542      | f                  |              5 |     5 |              0

 who |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 F   | a6d0b8be-94bd-494e-9078-ddc46e2b41e2 | fb6ycrku      | f                  |              6 |     6 |              0

 who |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 G   | deb66287-66fe-496b-bdce-ec7794259aeb | cpt8q84m      | f                  |              7 |     7 |              0

--- 2. Duplicate of A (different case + whitespace) returns existing row, no new row ---
  who  |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-------+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 A-dup | ea965962-1ea0-4596-887b-fdb14baa1ba4 | 2xmbaw55      | t                  |              1 |     7 |              0

 total_rows_after_dup 
----------------------
                    7

--- 3. H signs up with F's referral code (status pending -> not counted yet) ---
 who |                  id                  | referral_code | already_registered | queue_position | total | referral_count 
-----+--------------------------------------+---------------+--------------------+----------------+-------+----------------
 H   | 6dad84a0-5375-4339-9de1-a65197608509 | dfsgmk34      | f                  |              8 |     8 |              0

--- 3a. Launch defaults (bump ON, 5 places, no email confirmation needed): F 6 -> 2 ---
psql:supabase/tests/waitlist_local_test.sql:31: NOTICE:  PASS verified referral (form submit) bumps F from 6 to 2; tie with A at score 1 broken by earlier signup
DO
       who        | queue_position | total | referral_count 
------------------+----------------+-------+----------------
 F before confirm |              2 |     8 |              1

--- 3b. H confirmation email marked sent -> F bumped by 5 places (6 -> score 1, tie with A broken by created_at) ---
 waitlist_set_email_status 
---------------------------
 

       who       | queue_position | total | referral_count 
-----------------+----------------+-------+----------------
 F after confirm |              2 |     8 |              1

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
 

 who | queue_position | total | referral_count 
-----+----------------+-------+----------------
 G   |              7 |     9 |              0

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
        email        | signup_order | referral_count | effective_score | queue_position | total 
---------------------+--------------+----------------+-----------------+----------------+-------
 alice@acme.test     |            1 |              0 |               1 |              1 |    11
 frank@acme.test     |            6 |              1 |               1 |              2 |    11
 bob@acme.test       |            2 |              0 |               2 |              3 |    11
 carol@acme.test     |            3 |              0 |               3 |              4 |    11
 dan@acme.test       |            4 |              0 |               4 |              5 |    11
 erin@acme.test      |            5 |              0 |               5 |              6 |    11
 grace@acme.test     |            7 |              0 |               7 |              7 |    11
 henry@other.test    |            8 |              0 |               8 |              8 |    11
 grace.alt@acme.test |            9 |              0 |               9 |              9 |    11
 tara@acme.test      |           10 |              0 |              10 |             10 |    11
 kim@acme.test       |           11 |              0 |              11 |             11 |    11

--- 7. Assertions ---
psql:supabase/tests/waitlist_local_test.sql:105: NOTICE:  PASS self-referral blocked by check constraint
psql:supabase/tests/waitlist_local_test.sql:105: NOTICE:  PASS non-normalised email rejected
psql:supabase/tests/waitlist_local_test.sql:105: NOTICE:  PASS invalid type rejected
psql:supabase/tests/waitlist_local_test.sql:105: NOTICE:  PASS all signup/position assertions
DO
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

--- 9. anon / authenticated cannot read emails or call RPCs ---
RESET
SET
psql:supabase/tests/waitlist_local_test.sql:128: NOTICE:  PASS anon select on waitlist_signups denied
psql:supabase/tests/waitlist_local_test.sql:128: NOTICE:  PASS anon select on waitlist_positions denied
psql:supabase/tests/waitlist_local_test.sql:128: NOTICE:  PASS anon execute waitlist_signup denied
psql:supabase/tests/waitlist_local_test.sql:128: NOTICE:  PASS anon execute waitlist_position_by_code denied
DO
RESET
SET
psql:supabase/tests/waitlist_local_test.sql:134: NOTICE:  PASS authenticated select on waitlist_signups denied
DO
RESET
--- DONE ---
\`\`\`
