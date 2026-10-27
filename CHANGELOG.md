# Changelog

## Unreleased

- Phase 1 waitlist site: sticky nav, the ten home sections, the waitlist form, and the linked routes. User-facing copy comes from `lib/copy/site.copy.json`, which keeps only rendered keys. `{brand}` is filled from `BRAND.name` in `config/site.ts`. `SHOW_WAITLIST_TOTAL` stays off. Colour tokens are approved `tokens.json` 1.2.0. `check:copy`, `check:red`, and `check:tokens` run in CI. WebGL scenes are poster frames; the deal-room demo is DOM.
