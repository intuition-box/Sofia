import {
  useGetUserActivityQuery,
} from '@0xsofia/dashboard-graphql'
import { SOFIA_PROXY_ADDRESS } from '../config'
import { processEvents } from './feedProcessing'
import type { CircleItem } from './circleService'

/**
 * Fetch activity for a specific user wallet (server-side filtered)
 */
export async function fetchUserActivity(
  walletAddress: string,
  limit: number = 200,
  offset: number = 0,
): Promise<CircleItem[]> {
  const data = await useGetUserActivityQuery.fetcher({
    proxy: SOFIA_PROXY_ADDRESS.toLowerCase(),
    receiver: walletAddress.toLowerCase(),
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
