/**
 * Pins a new page's fields to IPFS (Intuition's pin service, server-side key)
 * — the step the extension does through the pin-proxy before minting.
 */
import { usePinThingMutation } from '@0xsofia/graphql'
import type { PageThing } from './policy'

export async function pinPage(thing: PageThing): Promise<string> {
  const data = await usePinThingMutation.fetcher({
    name: thing.name,
    description: thing.description,
    url: thing.url,
    image: thing.image,
  })()
  const uri = data.pinThing?.uri
  if (!uri) throw new Error('Pin returned no uri')
  return uri
}
