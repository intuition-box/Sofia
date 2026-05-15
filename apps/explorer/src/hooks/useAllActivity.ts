/**
 * useAllActivity — backwards-compat wrapper around `useSofiaFeed`
 * with no account scope, i.e. the global Sofia feed.
 *
 * The canonical hook is `useSofiaFeed({})`; this name is kept so
 * existing consumers (DashboardPage) don't need to churn. New code
 * should prefer `useSofiaFeed` directly.
 */
import { useSofiaFeed } from './useSofiaFeed'

export function useAllActivity() {
  return useSofiaFeed({})
}
