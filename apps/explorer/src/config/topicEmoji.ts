/**
 * Re-export of the shared @0xsofia/taxonomy package — the taxonomy + atom
 * registry now live in packages/taxonomy so the explorer and the extension
 * share one source of truth. Existing "@/config/*" import sites are unchanged.
 */
export * from "@0xsofia/taxonomy"
