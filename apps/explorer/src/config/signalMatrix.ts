/**
 * Re-export of the shared @0xsofia/reputation package — the signal matrix now
 * lives in packages/reputation so the explorer and other apps share one source
 * of truth. Existing "@/config/signalMatrix" import sites are unchanged.
 */
export * from '@0xsofia/reputation'
