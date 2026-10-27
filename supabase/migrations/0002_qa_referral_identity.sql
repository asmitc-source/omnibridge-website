-- =============================================================================
-- v0.3: QA addresses on reserved test domains keep their +tag in the referral
-- identity key, so distinct ob-qa+<case> signups can earn referral credit on
-- preview. Every other address keeps the v0.2 plus/dot rules.
--
-- Reserved set matches lib/reservedDomains.ts: example.com/.org/.net (and
-- subdomains), and names whose TLD is test, invalid, example, or localhost.
-- Does not edit 0001. search_path is empty. Execute stays service_role only.
-- =============================================================================

create or replace function public.waitlist_referral_identity_key(p_email text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v_email    text := lower(btrim(p_email));
  v_at       integer;
  v_local    text;
  v_domain   text;
  v_reserved boolean;
begin
  -- Split at the LAST '@' (the app guarantees exactly one).
  v_at := length(v_email) - strpos(reverse(v_email), '@') + 1;
  if strpos(v_email, '@') = 0 then
    return v_email;
  end if;
  v_local  := substr(v_email, 1, v_at - 1);
  v_domain := substr(v_email, v_at + 1);

  -- Same reserved set as isReservedDomain() in lib/reservedDomains.ts.
  v_reserved :=
       v_domain = 'example.com' or v_domain like '%.example.com'
    or v_domain = 'example.org' or v_domain like '%.example.org'
    or v_domain = 'example.net' or v_domain like '%.example.net'
    or v_domain = 'test'        or v_domain like '%.test'
    or v_domain = 'invalid'     or v_domain like '%.invalid'
    or v_domain = 'example'     or v_domain like '%.example'
    or v_domain = 'localhost'   or v_domain like '%.localhost';

  -- ONLY ob-qa+<case> on a reserved test domain keeps the full local part.
  if left(v_local, 6) = 'ob-qa+' and v_reserved then
    return v_local || '@' || v_domain;
  end if;

  if strpos(v_local, '+') > 1 then
    v_local := split_part(v_local, '+', 1);
  end if;

  if v_domain in ('gmail.com', 'googlemail.com') then
    v_domain := 'gmail.com';
    v_local  := replace(v_local, '.', '');
  end if;

  return v_local || '@' || v_domain;
end;
$$;

revoke all on function public.waitlist_referral_identity_key(text) from public, anon, authenticated;
grant execute on function public.waitlist_referral_identity_key(text) to service_role;
