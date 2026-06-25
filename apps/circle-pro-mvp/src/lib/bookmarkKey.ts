// Re-export of the canonical, shared normalisation (@0xsofia/url-key) — the
// single source of truth so the bookmark key never drifts from what derives
// on-chain URL atoms. `bookmarkKey` is the name this app uses for normalizeUrl.
export { bookmarkKey, normalizeUrl, hostOf } from "@0xsofia/url-key"
