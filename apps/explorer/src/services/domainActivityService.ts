import { getAddress } from 'viem'
import { useGetUserActivityQuery } from '@0xsofia/graphql'
import { processEvents, enrichWithTopicContexts } from './feedProcessing'
import type { CircleItem } from './circleService'

/**
 * Fetch activity for a user, aggregated across their linked wallets.
 *
 * Filters on the receiver only — every cert the user owns is theirs to
 * surface, regardless of which contract minted it. Sofia is the only
 * producer of the `visits for X` cert shape this hook consumes, so the
 * old `sender_id == SofiaProxy` clause was redundant and just risked
 * filtering out legitimate rows when the proxy address shifted.
 *
 * Receiver casing varies across emitters in the indexer — `_in` is exact
 * match, so we pass both checksummed and lowercase (deduped) to catch
 * everything. Same pattern as the useOnChainIntentionGroups fix.
 */
export async function fetchUserActivity(
  addresses: string[],
  limit: number = 200,
  offset: number = 0,
): Promise<CircleItem[]> {
  if (addresses.length === 0) return []

  const checksumAddresses = addresses.map((a) => getAddress(a))
  const lowercaseAddresses = addresses.map((a) => a.toLowerCase())
  const allCaseAddresses = Array.from(
    new Set([...checksumAddresses, ...lowercaseAddresses]),
  )

  const data = await useGetUserActivityQuery.fetcher({
    receivers: allCaseAddresses,
    limit,
    offset,
  })()

  const items = processEvents(data.events ?? [], (evt) => {
    const receiver = evt.deposit?.receiver
    return {
      address: receiver?.id || '',
      label: receiver?.label || receiver?.id || '',
    }
  })
  // Resolve "in context of" nested triples → topicContexts on each item.
  // Without this, the calendar / radar / per-topic stats see empty
  // topicContexts on every item and produce zeros.
  await enrichWithTopicContexts(items)
  return items
}
