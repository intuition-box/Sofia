/**
 * Intention Categories Types
 * Types for grouping on-chain certified URLs by intention type
 */

export type IntentionType = 'trusted' | 'distrusted' | 'work' | 'learning' | 'fun' | 'inspiration' | 'buying'

export interface CategoryUrl {
  url: string
  label: string
  domain: string
  favicon: string
  certifiedAt: string
  shares: string
}

export interface IntentionCategory {
  id: IntentionType
  label: string
  color: string
  urls: CategoryUrl[]
  urlCount: number
}

export const INTENTION_CONFIG: Record<IntentionType, { label: string; color: string }> = {
  trusted: { label: 'Trusted', color: '#22C55E' },
  distrusted: { label: 'Distrusted', color: '#EF4444' },
  work: { label: 'Work', color: '#3B82F6' },
  learning: { label: 'Learning', color: '#06B6D4' },
  fun: { label: 'Fun', color: '#F59E0B' },
  inspiration: { label: 'Inspiration', color: '#8B5CF6' },
  buying: { label: 'Buying', color: '#EC4899' }
}
