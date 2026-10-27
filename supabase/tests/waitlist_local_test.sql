-- Local smoke test for 0001_waitlist.sql, contract v0.2 (plain Postgres 17, NOT Supabase).
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
select w.email, p.signup_order, p.referral_count, p.effective_score, p.queue_position
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

\echo '--- 8c. 6th signup hit and 31st position hit in one window are denied ---'
do $$
declare
  i int;
  got_allowed boolean;
  got_hits int;
begin
  for i in 1..6 loop
    select t.allowed, t.hits into got_allowed, got_hits
    from public.waitlist_rate_limit_hit('signup:' || repeat('81', 32), 5, 600) t;
    if i < 6 then
      assert got_allowed and got_hits = i, format('signup hit %s should be allowed (allowed=%s hits=%s)', i, got_allowed, got_hits);
    else
      assert not got_allowed and got_hits = 6, format('6th signup hit should be denied (allowed=%s hits=%s)', got_allowed, got_hits);
    end if;
  end loop;
  raise notice 'PASS signup rate limit: 6th POST in the window is denied (hits 1-5 allowed) -> 429 rate_limited';

  for i in 1..31 loop
    select t.allowed, t.hits into got_allowed, got_hits
    from public.waitlist_rate_limit_hit('position:' || repeat('82', 32), 30, 600) t;
    if i < 31 then
      assert got_allowed and got_hits = i, format('position hit %s should be allowed (allowed=%s hits=%s)', i, got_allowed, got_hits);
    else
      assert not got_allowed and got_hits = 31, format('31st position hit should be denied (allowed=%s hits=%s)', got_allowed, got_hits);
    end if;
  end loop;
  raise notice 'PASS position rate limit: 31st request in the window is denied (hits 1-30 allowed) -> 429 rate_limited';
end $$;

\echo '--- 8b. Private total: no function or view exposes a total column ---'
do $$ declare n int; begin
  select count(*) into n from information_schema.columns
  where table_schema='public' and table_name='waitlist_positions' and column_name='total';
  assert n = 0, 'waitlist_positions still has total';
  assert pg_get_function_result('public.waitlist_signup(text,text,text,text,text,text,text)'::regprocedure) !~ 'total',
    'waitlist_signup still returns total';
  assert pg_get_function_result('public.waitlist_position_by_code(text)'::regprocedure) !~ 'total',
    'waitlist_position_by_code still returns total';
  raise notice 'PASS no total in waitlist_positions / waitlist_signup / waitlist_position_by_code';
end $$;

\echo '--- 10. Referral identity key (plus/dot variants) ---'
select e as email, public.waitlist_referral_identity_key(e) as identity_key
from unnest(array['me+1@acme.com','Me@ACME.com','m.e@acme.com','f.irst.last+x@googlemail.com',
                  'firstlast@gmail.com','+lead@acme.com','a.b+c+d@gmail.com']) as e;
do $$ begin
  assert public.waitlist_referral_identity_key('me+1@acme.com') = 'me@acme.com', 'plus strip';
  assert public.waitlist_referral_identity_key('m.e@acme.com') = 'm.e@acme.com', 'dots kept on non-gmail';
  assert public.waitlist_referral_identity_key('f.irst.last+x@googlemail.com') = 'firstlast@gmail.com', 'gmail dots+plus+googlemail';
  assert public.waitlist_referral_identity_key('+lead@acme.com') = '+lead@acme.com', 'leading plus kept';
  raise notice 'PASS identity key unit cases';
end $$;

\echo '--- 10a. Plus-variant self-referral: sam+2@corp.test uses sam@corp.test code (different IP) -> 0 credit, signup succeeds ---'
select 'S' as who, already_registered, queue_position, referral_count from public.waitlist_signup('sam@corp.test','buyer',null,null,null,null, repeat('6',64));
select 'S+2' as who, already_registered from public.waitlist_signup('sam+2@corp.test','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='sam@corp.test'), repeat('7',64));

\echo '--- 10b. Gmail dot/googlemail self-referral: s.a.m.smith+x@googlemail.com uses samsmith@gmail.com code -> 0 credit ---'
select 'GM' as who, already_registered from public.waitlist_signup('samsmith@gmail.com','buyer',null,null,null,null, repeat('8',64));
select 'GM-dot' as who, already_registered from public.waitlist_signup('s.a.m.smith+x@googlemail.com','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='samsmith@gmail.com'), repeat('c1',32));
select 'GM-dot2' as who, already_registered from public.waitlist_signup('sam.smith@gmail.com','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='samsmith@gmail.com'), repeat('c2',32));

\echo '--- 10c. Control: a genuinely different person with samsmith@gmail.com code -> 1 credit ---'
select 'Other' as who, already_registered from public.waitlist_signup('olivia@corp.test','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='samsmith@gmail.com'), repeat('c3',32));

do $$ declare v record; n int; begin
  select p.referral_count into v from public.waitlist_positions p join public.waitlist_signups w using (id) where w.email='sam@corp.test';
  assert v.referral_count = 0, 'plus-variant self-referral credited: ' || v.referral_count;
  raise notice 'PASS plus-variant self-referral earns 0 (sam@corp.test referral_count=0)';
  select count(*) into n from public.waitlist_signups where email in ('sam+2@corp.test','s.a.m.smith+x@googlemail.com','sam.smith@gmail.com');
  assert n = 3, 'variant signups should still be created as separate rows (dedupe on exact email)';
  raise notice 'PASS variant signups still succeed as separate rows (dedupe on exact normalised email)';
  select p.referral_count into v from public.waitlist_positions p join public.waitlist_signups w using (id) where w.email='samsmith@gmail.com';
  assert v.referral_count = 1, 'gmail: expected exactly 1 credit (olivia only), got ' || v.referral_count;
  raise notice 'PASS gmail dot + googlemail variants earn 0; genuine referral still earns 1 (samsmith@gmail.com referral_count=1)';
end $$;

\echo '--- 11. QA purge: ob-qa+<case>@example.com rows removed, non-QA rows kept ---'
select 'QA1' as who, already_registered from public.waitlist_signup('ob-qa+q4-01@example.com','buyer',null,null,null,null, repeat('d1',32));
select 'QA2' as who, already_registered from public.waitlist_signup('ob-qa+q4-02@example.com','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='ob-qa+q4-01@example.com'), repeat('d2',32));
select 'NonQA referred by QA' as who, already_registered from public.waitlist_signup('nora@corp.test','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='ob-qa+q4-01@example.com'), repeat('d3',32));
select 'Decoy no-plus' as who, already_registered from public.waitlist_signup('ob-qa@example.com','buyer',null,null,null,null, repeat('d4',32));
select 'Decoy other domain' as who, already_registered from public.waitlist_signup('ob-qa+q4-03@example.org','buyer',null,null,null,null, repeat('d5',32));
create temp table pre_nonqa as
  select id, email from public.waitlist_signups
  where not (left(email,6)='ob-qa+' and right(email,12)='@example.com');
select public.waitlist_rate_limit_hit('position:' || repeat('e',64), 30, 600) is not null as seeded_rate_limit_row;
select * from public.waitlist_purge_qa_rows();
do $$ declare v record; n int; m int; begin
  select count(*) into n from public.waitlist_signups where left(email,6)='ob-qa+' and right(email,12)='@example.com';
  assert n = 0, 'QA rows remain';
  select count(*) into n from pre_nonqa;
  select count(*) into m from public.waitlist_signups w join pre_nonqa p using (id);
  assert n = m and m = (select count(*) from public.waitlist_signups), 'non-QA rows changed: ' || n || ' vs ' || m;
  select count(*) into n from public.waitlist_signups where email in ('ob-qa@example.com','ob-qa+q4-03@example.org');
  assert n = 2, 'decoys were deleted';
  select count(*) into n from public.waitlist_signups where email='nora@corp.test' and referred_by is null;
  assert n = 1, 'nora should survive with referred_by null';
  select count(*) into n from public.waitlist_rate_limits;
  assert n = 0, 'rate-limit rows not cleared';
  raise notice 'PASS purge removed 2 QA rows, kept all % non-QA rows (decoys kept, nora referred_by -> null), rate limits cleared', m;
end $$;
select 'second purge (idempotent)' as run, * from public.waitlist_purge_qa_rows();

\echo '--- 11b. Clear rate limits only ---'
select public.waitlist_rate_limit_hit('signup:' || repeat('f',64), 5, 600) is not null as seeded;
select public.waitlist_rate_limit_hit('signup:' || repeat('e',64), 5, 600) is not null as seeded;
select * from public.waitlist_clear_rate_limits();
do $$ begin
  assert (select count(*) from public.waitlist_rate_limits) = 0, 'rate limits not cleared';
  raise notice 'PASS waitlist_clear_rate_limits cleared rows, signups untouched';
end $$;

\echo '--- 12. QA reserved-domain +tag is its own identity; Gmail plus-tags still are not ---'
do $$ begin
  assert public.waitlist_referral_identity_key('ob-qa+a@example.com') = 'ob-qa+a@example.com', 'qa example.com keeps tag';
  assert public.waitlist_referral_identity_key('ob-qa+b@example.com') = 'ob-qa+b@example.com', 'qa example.com keeps tag b';
  assert public.waitlist_referral_identity_key('alice+x@gmail.com') = 'alice@gmail.com', 'gmail plus still stripped';
  assert public.waitlist_referral_identity_key('alice+y@gmail.com') = 'alice@gmail.com', 'gmail plus y stripped';
  assert public.waitlist_referral_identity_key('ob-qa+a@gmail.com') = 'ob-qa@gmail.com', 'qa on gmail still strips';
  assert public.waitlist_referral_identity_key('me+1@example.com') = 'me@example.com', 'non-qa reserved domain still strips';
  raise notice 'PASS qa identity key keeps +tag only for ob-qa+ on reserved domains';
end $$;
select 'QA-a' as who, already_registered from public.waitlist_signup('ob-qa+a@example.com','buyer',null,null,null,null, repeat('71',32));
select 'QA-b' as who, already_registered from public.waitlist_signup('ob-qa+b@example.com','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='ob-qa+a@example.com'), repeat('72',32));
select 'G+x' as who, already_registered from public.waitlist_signup('alice+x@gmail.com','buyer',null,null,null,null, repeat('73',32));
select 'G+y' as who, already_registered from public.waitlist_signup('alice+y@gmail.com','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='alice+x@gmail.com'), repeat('74',32));
do $$ declare n int; begin
  select p.referral_count into n from public.waitlist_positions p
    join public.waitlist_signups w using (id) where w.email='ob-qa+a@example.com';
  assert n = 1, 'qa referral should be credited, got ' || n;
  raise notice 'PASS ob-qa+a@example.com / ob-qa+b@example.com earns 1 credit';
  select p.referral_count into n from public.waitlist_positions p
    join public.waitlist_signups w using (id) where w.email='alice+x@gmail.com';
  assert n = 0, 'gmail plus self-referral credited: ' || n;
  raise notice 'PASS alice+x@gmail.com / alice+y@gmail.com earns 0 (same identity)';
end $$;

\echo '--- 13. Same IP hash earns no credit; a different IP hash does (count_same_ip_referrals=false) ---'
do $$ begin
  assert (select count_same_ip_referrals from public.waitlist_settings) = false,
    'count_same_ip_referrals must be false';
  raise notice 'PASS count_same_ip_referrals is false';
end $$;
select 'SameRef' as who, already_registered from public.waitlist_signup('sameip-ref@acme.test','buyer',null,null,null,null, repeat('83',32));
select 'SameNew' as who, already_registered from public.waitlist_signup('sameip-new@acme.test','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='sameip-ref@acme.test'), repeat('83',32));
select 'DiffRef' as who, already_registered from public.waitlist_signup('diffip-ref@acme.test','buyer',null,null,null,null, repeat('84',32));
select 'DiffNew' as who, already_registered from public.waitlist_signup('diffip-new@acme.test','buyer',null,null,null,
  (select referral_code from public.waitlist_signups where email='diffip-ref@acme.test'), repeat('85',32));
do $$ declare n int; begin
  select p.referral_count into n from public.waitlist_positions p
    join public.waitlist_signups w using (id) where w.email='sameip-ref@acme.test';
  assert n = 0, 'same IP hash referral credited: ' || n;
  raise notice 'PASS same IP hash referral earns 0 credit when count_same_ip_referrals=false';
  select p.referral_count into n from public.waitlist_positions p
    join public.waitlist_signups w using (id) where w.email='diffip-ref@acme.test';
  assert n = 1, 'different IP hash referral not credited: ' || n;
  raise notice 'PASS different IP hash referral earns 1 credit';
end $$;

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
  begin perform public.waitlist_purge_qa_rows(); raise exception 'anon could call purge';
  exception when insufficient_privilege then raise notice 'PASS anon execute waitlist_purge_qa_rows denied'; end;
  begin perform public.waitlist_clear_rate_limits(); raise exception 'anon could call clear rate limits';
  exception when insufficient_privilege then raise notice 'PASS anon execute waitlist_clear_rate_limits denied'; end;
  begin perform public.waitlist_referral_identity_key('a@b.co'); raise exception 'anon could call identity key';
  exception when insufficient_privilege then raise notice 'PASS anon execute waitlist_referral_identity_key denied'; end;
end $$;
reset role;
set role authenticated;
do $$ begin
  begin perform 1 from public.waitlist_signups limit 1; raise exception 'authenticated could select signups';
  exception when insufficient_privilege then raise notice 'PASS authenticated select on waitlist_signups denied'; end;
  begin perform public.waitlist_purge_qa_rows(); raise exception 'authenticated could call purge';
  exception when insufficient_privilege then raise notice 'PASS authenticated execute waitlist_purge_qa_rows denied'; end;
  begin perform public.waitlist_clear_rate_limits(); raise exception 'authenticated could call clear rate limits';
  exception when insufficient_privilege then raise notice 'PASS authenticated execute waitlist_clear_rate_limits denied'; end;
  begin perform public.waitlist_referral_identity_key('a@b.co'); raise exception 'authenticated could call identity key';
  exception when insufficient_privilege then raise notice 'PASS authenticated execute waitlist_referral_identity_key denied'; end;
end $$;
reset role;
\echo '--- DONE ---'
