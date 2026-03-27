/**
 * Types pour le système Bento Grid
 */

export interface BentoItem {
  name: string
  url: string
  category: string
  size: 'small' | 'tall' | 'mega'
}
