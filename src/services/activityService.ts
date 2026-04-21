import {
  useGetAllActivityQuery,
} from '@0xsofia/dashboard-graphql'
import { SOFIA_PROXY_ADDRESS } from '../config'
import { processEvents, enrichWithTopicContexts } from './feedProcessing'
import type { CircleItem } from './circleService'

export async function fetchAllActivity(
  limit: number = 200,
  offset: number = 0,
): Promise<CircleItem[]> {
  const data = await useGetAllActivityQuery.fetcher({
    proxy: SOFIA_PROXY_ADDRESS.toLowerCase(),
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
  await enrichWithTopicContexts(items)
  return items
}
