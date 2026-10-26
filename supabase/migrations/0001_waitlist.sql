-- =============================================================================
-- OmniBridge Phase 1 waitlist: schema, referral position logic, rate limiting
-- DRAFT FOR REVIEW. It has not been applied to any Supabase project.
--
-- Access model:
--   * RLS is enabled on every table and NO policies are created, so the
--     `anon` and `authenticated` roles cannot read or write anything (emails
--     included). Table and function privileges are also revoked from them.
--   * All access goes through Next.js route handlers that use the
--     SUPABASE_SERVICE_ROLE_KEY (role `service_role`, which bypasses RLS).
--
-- Data minimisation: we store only the form fields (email, company, role,
-- type, agents_used) plus technical fields for referral/anti-abuse:
-- referral_code, referred_by, created_at, ip_hash (HMAC-SHA256 of the IP with
-- a server secret, never the raw IP) and confirmation_email_status.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Settings (single row). Tunable without a code deploy.
-- -----------------------------------------------------------------------------
create table if not exists public.waitlist_settings (
  id                         boolean primary key default true check (id),  -- forces a single row
  -- Referral bump ON at launch, 5 places per verified referral (Asmit, 2026-10-26).
  -- Set referral_bump_enabled = false to switch off without a deploy.
  referral_bump_enabled      boolean not null default true,
  referral_bump              integer not null default 5 check (referral_bump >= 0),
  -- If true, a referral only counts once the referred person's confirmation
  -- email was accepted by Resend (status = 'sent').
  -- Default false because confirmation email is disabled until a sender domain exists.
  require_sent_confirmation  boolean not null default false,
  -- If false, a referral from the same hashed IP as the referrer is not
  -- counted (cheap self-referral heuristic).
  -- Default false: same-IP referrals are NOT counted (anti-abuse rule approved by
  -- Product Lead, 2026-10-26). Set true to count them.
  count_same_ip_referrals    boolean not null default false,
  updated_at                 timestamptz not null default now()
);
insert into public.waitlist_settings (id) values (true) on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Signups
-- -----------------------------------------------------------------------------
create table if not exists public.waitlist_signups (
  id                         uuid primary key default extensions.gen_random_uuid(),
  -- Stored already normalised (trimmed + lowercased) by the server.
  email                      text not null
                             check (email = lower(btrim(email)))
                             check (char_length(email) between 3 and 254)
                             check (position('@' in email) > 1),
  company                    text check (company is null or char_length(company) <= 200),
  role                       text check (role is null or char_length(role) <= 200),
  type                       text check (type is null or type in ('buyer', 'supplier', 'developer')),  -- optional
  agents_used                text check (agents_used is null or char_length(agents_used) <= 1000),
  referral_code              text not null check (referral_code ~ '^[a-z2-9]{8}$'),
  referred_by                uuid references public.waitlist_signups (id) on delete set null,
  ip_hash                    text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  confirmation_email_status  text not null default 'pending'
                             check (confirmation_email_status in ('pending', 'sent', 'failed', 'skipped')),
  created_at                 timestamptz not null default now(),
  constraint waitlist_no_self_referral check (referred_by is null or referred_by <> id)
);

-- Unique on the normalised email (belt and braces: the column is already
-- constrained to be lower/trimmed, the index is on the expression anyway).
create unique index if not exists waitlist_signups_email_norm_uidx
  on public.waitlist_signups (lower(btrim(email)));
create unique index if not exists waitlist_signups_referral_code_uidx
  on public.waitlist_signups (referral_code);
create index if not exists waitlist_signups_referred_by_idx
  on public.waitlist_signups (referred_by);
create index if not exists waitlist_signups_created_at_id_idx
  on public.waitlist_signups (created_at, id);

-- -----------------------------------------------------------------------------
-- Rate limiting (Postgres-only, fixed window; no Upstash / extra account)
-- -----------------------------------------------------------------------------
create table if not exists public.waitlist_rate_limits (
  bucket_key    text not null,          -- e.g. 'signup:<ip_hash>'
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (bucket_key, window_start)
);
create index if not exists waitlist_rate_limits_window_idx
  on public.waitlist_rate_limits (window_start);

-- Atomically records one hit and returns whether it is within the limit.
create or replace function public.waitlist_rate_limit_hit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns table (allowed boolean, hits integer, retry_after_seconds integer)
language plpgsql
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_hits integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.waitlist_rate_limits as rl (bucket_key, window_start, hits)
  values (p_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set hits = rl.hits + 1
  returning rl.hits into v_hits;

  -- Opportunistic cleanup of old windows (cheap with the window index).
  if random() < 0.02 then
    delete from public.waitlist_rate_limits
    where window_start < now() - make_interval(secs => p_window_seconds * 2);
  end if;

  return query select
    v_hits <= p_limit,
    v_hits,
    greatest(0, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - now())))::integer);
end;
$$;

-- -----------------------------------------------------------------------------
-- Referral code generator: 8 chars from an unambiguous alphabet (no 0/1/l/o/i)
-- -----------------------------------------------------------------------------
create or replace function public.waitlist_generate_referral_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  bytes bytea := extensions.gen_random_bytes(8);
  code text := '';
  i integer;
begin
  for i in 0..7 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return code;
end;
$$;

-- -----------------------------------------------------------------------------
-- Deterministic positions
--   signup_order      = row_number() over (order by created_at, id)
--   referrals         = count of referred signups that qualify (see below)
--   effective_score   = greatest(1, signup_order - referrals * bump)
--                       where bump = referral_bump if referral_bump_enabled else 0
--   queue_position    = row_number() over (order by effective_score, created_at, id)
-- A qualifying referral: referred row exists (one per unique email), is not
-- the referrer itself, optionally has a 'sent' confirmation, and optionally
-- comes from a different ip_hash than the referrer.
-- -----------------------------------------------------------------------------
create or replace view public.waitlist_positions
with (security_invoker = true)
as
with s as (select * from public.waitlist_settings where id),
ordered as (
  select w.id, w.referral_code, w.created_at,
         row_number() over (order by w.created_at, w.id) as signup_order
  from public.waitlist_signups w
),
refs as (
  select r.referred_by as referrer_id, count(*) as referrals
  from public.waitlist_signups r
  join public.waitlist_signups ref on ref.id = r.referred_by
  cross join s
  where r.referred_by <> r.id
    and (not s.require_sent_confirmation or r.confirmation_email_status = 'sent')
    and (s.count_same_ip_referrals
         or r.ip_hash is null or ref.ip_hash is null
         or r.ip_hash <> ref.ip_hash)
  group by r.referred_by
),
scored as (
  select o.id, o.referral_code, o.created_at, o.signup_order,
         coalesce(f.referrals, 0)::integer as referral_count,
         greatest(1, o.signup_order - coalesce(f.referrals, 0) * (case when s.referral_bump_enabled then s.referral_bump else 0 end)) as effective_score
  from ordered o
  cross join s
  left join refs f on f.referrer_id = o.id
)
select id, referral_code, created_at, signup_order, referral_count, effective_score,
       row_number() over (order by effective_score, created_at, id) as queue_position,
       count(*) over () as total
from scored;

-- Position lookup by referral code (never exposes the email).
create or replace function public.waitlist_position_by_code(p_code text)
returns table (queue_position bigint, total bigint, referral_count integer)
language sql
stable
set search_path = ''
as $$
  select p.queue_position, p.total, p.referral_count
  from public.waitlist_positions p
  where p.referral_code = lower(btrim(p_code));
$$;

-- -----------------------------------------------------------------------------
-- Signup RPC: insert-or-return-existing in one round trip.
-- Duplicate email => no new row, no update, referral NOT credited,
-- already_registered = true.
-- -----------------------------------------------------------------------------
create or replace function public.waitlist_signup(
  p_email text,
  p_type text,
  p_company text default null,
  p_role text default null,
  p_agents_used text default null,
  p_ref_code text default null,
  p_ip_hash text default null
) returns table (
  id uuid,
  referral_code text,
  already_registered boolean,
  queue_position bigint,
  total bigint,
  referral_count integer
)
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_id uuid;
  v_code text;
  v_referrer uuid;
  v_existing boolean := false;
  v_attempt integer := 0;
begin
  -- Existing signup? Return it unchanged.
  select w.id into v_id from public.waitlist_signups w
  where lower(btrim(w.email)) = v_email;

  if v_id is null then
    if p_ref_code is not null and btrim(p_ref_code) <> '' then
      select w.id into v_referrer from public.waitlist_signups w
      where w.referral_code = lower(btrim(p_ref_code));
    end if;

    loop
      v_attempt := v_attempt + 1;
      v_code := public.waitlist_generate_referral_code();
      begin
        insert into public.waitlist_signups
          (email, company, role, type, agents_used, referral_code, referred_by, ip_hash)
        values
          (v_email, nullif(btrim(p_company), ''), nullif(btrim(p_role), ''), p_type,
           nullif(btrim(p_agents_used), ''), v_code, v_referrer, p_ip_hash)
        returning waitlist_signups.id into v_id;
        exit;
      exception when unique_violation then
        -- Either a concurrent insert of the same email, or a referral-code clash.
        select w.id into v_id from public.waitlist_signups w
        where lower(btrim(w.email)) = v_email;
        if v_id is not null then
          v_existing := true;
          exit;
        end if;
        if v_attempt >= 5 then
          raise;
        end if;
      end;
    end loop;
  else
    v_existing := true;
  end if;

  return query
    select p.id, p.referral_code, v_existing, p.queue_position, p.total, p.referral_count
    from public.waitlist_positions p
    where p.id = v_id;
end;
$$;

-- Records the outcome of the confirmation email send.
create or replace function public.waitlist_set_email_status(p_id uuid, p_status text)
returns void
language sql
volatile
set search_path = ''
as $$
  update public.waitlist_signups set confirmation_email_status = p_status where id = p_id;
$$;

-- -----------------------------------------------------------------------------
-- Lock down: RLS on, no policies, no grants for anon/authenticated.
-- -----------------------------------------------------------------------------
alter table public.waitlist_signups     enable row level security;
alter table public.waitlist_rate_limits enable row level security;
alter table public.waitlist_settings    enable row level security;
alter table public.waitlist_signups     force row level security;
alter table public.waitlist_rate_limits force row level security;
alter table public.waitlist_settings    force row level security;

revoke all on public.waitlist_signups, public.waitlist_rate_limits, public.waitlist_settings,
              public.waitlist_positions
  from public, anon, authenticated;
grant select, insert, update, delete on public.waitlist_signups, public.waitlist_rate_limits,
              public.waitlist_settings to service_role;
grant select on public.waitlist_positions to service_role;

revoke all on function public.waitlist_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.waitlist_generate_referral_code() from public, anon, authenticated;
revoke all on function public.waitlist_position_by_code(text) from public, anon, authenticated;
revoke all on function public.waitlist_signup(text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.waitlist_set_email_status(uuid, text) from public, anon, authenticated;

grant execute on function public.waitlist_rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.waitlist_generate_referral_code() to service_role;
grant execute on function public.waitlist_position_by_code(text) to service_role;
grant execute on function public.waitlist_signup(text, text, text, text, text, text, text) to service_role;
grant execute on function public.waitlist_set_email_status(uuid, text) to service_role;
