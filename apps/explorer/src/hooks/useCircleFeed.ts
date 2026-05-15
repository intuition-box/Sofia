/**
 * useCircleFeed — backwards-compat wrapper around `useSofiaFeed`.
 *
 * The canonical hook is now `useSofiaFeed({ accountIds })`; this
 * preserves the previous call signature so existing consumers
 * (CircleFeedSection, CircleDetailView, CircleTopTopicsCard) keep
 * working without churn. New code should call `useSofiaFeed` directly.
 *
 * Same cache key family as the canonical hook — navigating between
 * two consumers of the same trust circle hits the shared cache.
 */
import { useSofiaFeed } from './useSofiaFeed'

/**
 * Activity authored by the circle's roster.
 *
 * `certifierWallets` is the roster — Trust Circle members for the trust
 * circle, claimed group members for an on-chain group. The viewer's own
 * linked wallets are pulled from `useLinkedWallets()` inside the canonical
 * hook for the per-item support/oppose stake flags.
 */
export function useCircleFeed(certifierWallets: string[] | undefined) {
  return useSofiaFeed({
    accountIds: certifierWallets,
    enabled: !!certifierWallets && certifierWallets.length > 0,
  })
}
