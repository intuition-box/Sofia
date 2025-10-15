/**
 * Types pour le système Bento Grid
 */

export interface BentoItem {
  name: string
  url: string
  category: string
  size: 'small' | 'tall' | 'mega'
}

export interface BentoItemWithImage extends BentoItem {
  ogImage: string
}

export interface BentoState {
  validItems: BentoItemWithImage[]
  isLoading: boolean
  error: string | null
  lastProcessedHash: string | null
}

export type BentoStateListener = (state: BentoState) => void