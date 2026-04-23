import {
  useGetUserActivityQuery,
} from '@0xsofia/graphql'
import { SOFIA_PROXY_ADDRESS } from '../config'
import { processEvents } from './feedProcessing'
import type { CircleItem } from './circleService'

/**
 * Fetch activity for a user, aggregated across their linked wallets.
 *
 * Pass all `useLinkedWallets().addresses` to match every wallet owned by the
 * current user. The indexer stores receiver IDs in EIP-55 mixed case — the
 * callers must pass checksummed addresses (the query uses `_in`, strict match).
 */
export async function fetchUserActivity(
  addresses: string[],
  limit: number = 200,
  offset: number = 0,
): Promise<CircleItem[]> {
  if (addresses.length === 0) return []

  const data = await useGetUserActivityQuery.fetcher({
    proxy: SOFIA_PROXY_ADDRESS.toLowerCase(),
    receivers: addresses,
    limit,
    offset,
  })()

  return processEvents(data.events ?? [], (evt) => {
    const receiver = evt.deposit?.receiver
    return {
      address: receiver?.id || '',
      label: receiver?.label || receiver?.id || '',
    }
  })
}
