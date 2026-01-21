import type { Triplet } from './messages'

export interface EchoTriplet {
  id: string
  triplet: Triplet
  url: string
  description: string
  timestamp: number
  sourceMessageId: string
  status: 'available' | 'published'
}
