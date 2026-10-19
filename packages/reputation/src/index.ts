/**
 * @0xsofia/reputation — pure reputation-scoring compute shared across apps.
 *
 * Platform catalog + signal matrix + reputation/signal types feed the
 * `computeReputationProfile` scorer; the derived-reputation calc turns
 * claim supporters into per-topic reputation. No data-layer or React deps.
 */
export * from './reputationScore'
export * from './derivedReputation'
export * from './config/platformCatalog'
export * from './config/signalMatrix'
export * from './types/reputation'
export * from './types/signals'
export * from './types/claimSupporters'
