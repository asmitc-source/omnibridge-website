# Changelog

## Unreleased

- Phase 1 waitlist site: sticky nav, the ten home sections, the waitlist form, and the linked routes. User-facing copy comes from `lib/copy/site.copy.json`, which keeps only rendered keys. `{brand}` is filled from `BRAND.name` in `config/site.ts`. `SHOW_WAITLIST_TOTAL` stays off. Colour tokens are approved `tokens.json` 1.2.0. `check:copy`, `check:red`, and `check:tokens` run in CI. WebGL scenes are poster frames; the deal-room demo is DOM.
- M3 layout pass: compact demo controls, centred demo header, opening ticker price, mobile chip strip, cookie clearance, hero type spacing, home FAQ limited to the first six questions, section rhythm, FAQ marker, type chips, and an icon burger.
- Full-site layout pass: the same rhythm, FAQ marker, burger, and cookie clearance on every route. `/faq` lists each `faq.q*` once under category chips. `/suppliers` keeps `suppliers.faq.*`. Placeholder chips and `BRAND.name` are unchanged. Pinned WebGL scenes stay poster frames.
