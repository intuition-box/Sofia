import type { ElizaRecord } from '~lib/database/indexedDB'
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

export interface DatabaseServices {
  elizaDataService: {
    getAllMessages: () => Promise<ElizaRecord[]>
  }
  sofiaDB: {
    delete: (store: string, id: string | number) => Promise<void>
  }
  STORES: {
    ELIZA_DATA: string
  }
}

export interface UseEchoSelectionProps {
  availableEchoes: EchoTriplet[]
  echoTriplets: EchoTriplet[]
  setEchoTriplets: (triplets: EchoTriplet[]) => void
  refreshMessages: () => Promise<ElizaRecord[]>
  elizaDataService: DatabaseServices['elizaDataService']
  sofiaDB: DatabaseServices['sofiaDB']
  STORES: DatabaseServices['STORES']
}