/**
 * Intention group types used by hooks and UI components.
 */

import type { IntentionGroupRecord } from './database'
import type { CertificationType } from '~lib/services/GroupManager'

export interface IntentionGroupWithStats extends IntentionGroupRecord {
  activeUrlCount: number
  certifiedCount: number
  certificationBreakdown: Record<CertificationType, number>
  isVirtualGroup?: boolean
}

export type SortOption = 'level' | 'urls' | 'alphabetic' | 'recent'
