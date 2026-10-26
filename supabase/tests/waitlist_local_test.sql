-- Local smoke test for 0001_waitlist.sql (plain Postgres 17, NOT Supabase).
-- Run as superuser; switches to service_role / anon to mimic Supabase roles.
\set ON_ERROR_STOP 1
\pset footer off
set role service_role;

\echo '--- 0. Launch defaults: bump ON, 5 places, no email confirmation required ---'
select referral_bump_enabled, referral_bump, require_sent_confirmation, count_same_ip_referrals from public.waitlist_settings;

\echo '--- 1. Seven signups A..G (distinct hashed IPs) ---'
select 'A' as who, * from public.waitlist_signup('alice@acme.test','buyer','Acme','CTO',null,null, repeat('a',64));
select 'B' as who, * from public.waitlist_signup('bob@acme.test','supplier',null,null,null,null, repeat('b',64));
select 'C' as who, * from public.waitlist_signup('carol@acme.test','developer',null,null,'internal agents',null, repeat('c',64));
select 'D' as who, * from public.waitlist_signup('dan@acme.test','buyer',null,null,null,null, repeat('d',64));
select 'E' as who, * from public.waitlist_signup('erin@acme.test','buyer',null,null,null,null, repeat('e',64));
select 'F' as who, * from public.waitlist_signup('frank@acme.test','supplier',null,null,null,null, repeat('f',64));
select 'G' as who, * from public.waitlist_signup('grace@acme.test','developer',null,null,null,null, repeat('1',64));

\echo '--- 2. Duplicate of A (different case + whitespace) returns existing row, no new row ---'
select 'A-dup' as who, * from public.waitlist_signup('  Alice@ACME.test ','supplier',null,null,null,null, repeat('9',64));
select count(*) as total_rows_after_dup from public.waitlist_signups;

\echo '--- 3. H signs up with F''s referral code (status pending -> not counted yet) ---'
select 'H' as who, * from public.waitlist_signup('henry@other.test','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='frank@acme.test'), repeat('2',64));
\echo '--- 3a. Launch defaults (bump ON, 5 places, no email confirmation needed): F 6 -> 2 ---'
do $$ declare v record; begin
  select * into v from public.waitlist_position_by_code((select referral_code from public.waitlist_signups where email='frank@acme.test'));
  assert v.referral_count = 1 and v.queue_position = 2, 'expected F count 1 pos 2, got ' || v.referral_count || '/' || v.queue_position;
  raise notice 'PASS verified referral (form submit) bumps F from 6 to 2; tie with A at score 1 broken by earlier signup';
end $$;
select 'F before confirm' as who, * from public.waitlist_position_by_code(
  (select referral_code from public.waitlist_signups where email='frank@acme.test'));

\echo '--- 3b. H confirmation email marked sent -> F bumped by 5 places (6 -> score 1, tie with A broken by created_at) ---'
select public.waitlist_set_email_status((select id from public.waitlist_signups where email='henry@other.test'), 'sent');
select 'F after confirm' as who, * from public.waitlist_position_by_code(
  (select referral_code from public.waitlist_signups where email='frank@acme.test'));

\echo '--- 4. Duplicate-email referral: B re-submits with G''s code -> no new row, G not credited ---'
select 'B-dup w/ G ref' as who, already_registered, queue_position from public.waitlist_signup('bob@acme.test','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='grace@acme.test'), repeat('3',64));

\echo '--- 5. Same-IP referral: new email from G''s hashed IP using G''s code, confirmed -> not credited ---'
select 'G-alt' as who, already_registered from public.waitlist_signup('grace.alt@acme.test','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='grace@acme.test'), repeat('1',64));
select public.waitlist_set_email_status((select id from public.waitlist_signups where email='grace.alt@acme.test'), 'sent');
select 'G' as who, * from public.waitlist_position_by_code(
  (select referral_code from public.waitlist_signups where email='grace@acme.test'));

\echo '--- 5b. type omitted is accepted (stored null) ---'
select 'T' as who, already_registered from public.waitlist_signup('tara@acme.test',null,null,null,null,null, repeat('5',64));

\echo '--- 6. Unknown referral code is ignored (signup still succeeds, referred_by null) ---'
select 'K' as who, already_registered from public.waitlist_signup('kim@acme.test','buyer',null,null,null,'zzzzzzzz', repeat('4',64));
select email, referred_by is null as referred_by_is_null from public.waitlist_signups where email='kim@acme.test';

\echo '--- Full ordering (service_role view) ---'
select w.email, p.signup_order, p.referral_count, p.effective_score, p.queue_position, p.total
from public.waitlist_positions p join public.waitlist_signups w using (id)
order by p.queue_position;

\echo '--- 7. Assertions ---'
do $$
declare v record; n int;
begin
  select count(*) into n from public.waitlist_signups;
  assert n = 11, 'expected 11 rows, got ' || n;
  select count(*) into n from public.waitlist_signups where email='tara@acme.test' and type is null;
  assert n = 1, 'type-null signup missing';
  select count(*) into n from public.waitlist_signups where email = 'alice@acme.test';
  assert n = 1, 'duplicate created a row';

  select * into v from public.waitlist_positions p join public.waitlist_signups w using (id) where w.email='frank@acme.test';
  assert v.referral_count = 1 and v.queue_position = 2, 'F should have 1 referral and position 2, got ' || v.queue_position;

  select * into v from public.waitlist_positions p join public.waitlist_signups w using (id) where w.email='grace@acme.test';
  assert v.referral_count = 0, 'G should have 0 counted referrals (dup email + same IP)';

  select * into v from public.waitlist_positions p join public.waitlist_signups w using (id) where w.email='alice@acme.test';
  assert v.queue_position = 1, 'A should stay 1 (tie with F broken by created_at)';

  begin
    update public.waitlist_signups set referred_by = id where email = 'kim@acme.test';
    raise exception 'self-referral update should have failed';
  exception when check_violation then
    raise notice 'PASS self-referral blocked by check constraint';
  end;

  begin
    insert into public.waitlist_signups (email, type, referral_code) values ('Bad@Case.test','buyer','abcdefgh');
    raise exception 'non-normalised email insert should have failed';
  exception when check_violation then
    raise notice 'PASS non-normalised email rejected';
  end;

  begin
    insert into public.waitlist_signups (email, type, referral_code) values ('x@y.test','investor','abcdefgj');
    raise exception 'bad type should have failed';
  exception when check_violation then
    raise notice 'PASS invalid type rejected';
  end;

  raise notice 'PASS all signup/position assertions';
end $$;

\echo '--- 8. Rate limit: 5 per 600s, 6th hit blocked ---'
select 1 as hit, allowed, hits from public.waitlist_rate_limit_hit('signup:' || repeat('a',64), 5, 600);
select 2 as hit, allowed, hits from public.waitlist_rate_limit_hit('signup:' || repeat('a',64), 5, 600);
select 3 as hit, allowed, hits from public.waitlist_rate_limit_hit('signup:' || repeat('a',64), 5, 600);
select 4 as hit, allowed, hits from public.waitlist_rate_limit_hit('signup:' || repeat('a',64), 5, 600);
select 5 as hit, allowed, hits from public.waitlist_rate_limit_hit('signup:' || repeat('a',64), 5, 600);
select 6 as hit, allowed, hits from public.waitlist_rate_limit_hit('signup:' || repeat('a',64), 5, 600);
select 'other IP' as hit, allowed, hits from public.waitlist_rate_limit_hit('signup:' || repeat('b',64), 5, 600);

\echo '--- 9. anon / authenticated cannot read emails or call RPCs ---'
reset role;
set role anon;
do $$ begin
  begin perform 1 from public.waitlist_signups limit 1; raise exception 'anon could select signups';
  exception when insufficient_privilege then raise notice 'PASS anon select on waitlist_signups denied'; end;
  begin perform 1 from public.waitlist_positions limit 1; raise exception 'anon could select view';
  exception when insufficient_privilege then raise notice 'PASS anon select on waitlist_positions denied'; end;
  begin perform public.waitlist_signup('evil@x.test','buyer'); raise exception 'anon could call signup rpc';
  exception when insufficient_privilege then raise notice 'PASS anon execute waitlist_signup denied'; end;
  begin perform public.waitlist_position_by_code('abcdefgh'); raise exception 'anon could call position rpc';
  exception when insufficient_privilege then raise notice 'PASS anon execute waitlist_position_by_code denied'; end;
end $$;
reset role;
set role authenticated;
do $$ begin
  begin perform 1 from public.waitlist_signups limit 1; raise exception 'authenticated could select signups';
  exception when insufficient_privilege then raise notice 'PASS authenticated select on waitlist_signups denied'; end;
end $$;
reset role;
\echo '--- DONE ---'
