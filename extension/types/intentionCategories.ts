/**
 * Intention Categories Types
 * Types for grouping on-chain certified URLs by intention type
 */

export type IntentionType = 'work' | 'learning' | 'fun' | 'inspiration' | 'buying'

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
  work: { label: 'Work', color: '#3B82F6' },
  learning: { label: 'Learning', color: '#10B981' },
  fun: { label: 'Fun', color: '#F59E0B' },
  inspiration: { label: 'Inspiration', color: '#8B5CF6' },
  buying: { label: 'Buying', color: '#EF4444' }
}
