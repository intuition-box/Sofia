/**
 * useUserActivity — backwards-compat wrapper around `useSofiaFeed`
 * scoped to a specific set of wallets (typically the current user's
 * linked wallets, or a public profile's address).
 *
 * The canonical hook is `useSofiaFeed({ accountIds })`; this preserves
 * the previous call signature for existing consumers.
 */
import { useSofiaFeed } from './useSofiaFeed'

export function useUserActivity(addresses: string[] | undefined) {
  return useSofiaFeed({
    accountIds: addresses,
    enabled: !!addresses && addresses.length > 0,
  })
}
