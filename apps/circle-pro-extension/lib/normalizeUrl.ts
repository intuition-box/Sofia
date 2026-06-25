// Re-export of the canonical, shared normalisation (@0xsofia/url-key) — the
// single source of truth so the bookmark key never drifts from what derives
// on-chain URL atoms. Kept as a local module so existing `~lib/normalizeUrl`
// imports don't change.
export { normalizeUrl, hostOf } from "@0xsofia/url-key"
