import type { ElizaRecord } from '~lib/database/indexedDB'
import type { Triplet } from './messages'

export interface EchoTriplet {
  id: string
  triplet: Triplet
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
  refreshMessages: () => Promise<void>
  elizaDataService: DatabaseServices['elizaDataService']
  sofiaDB: DatabaseServices['sofiaDB']
  STORES: DatabaseServices['STORES']
}