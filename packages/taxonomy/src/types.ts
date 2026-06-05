/**
 * Sofia taxonomy types — Topic → Category → Niche.
 * The single source of truth shared by the explorer and the extension.
 */

export interface Niche {
  id: string
  label: string
  disambiguationSignal?: string
  disambiguationResult?: string
}

export interface Category {
  id: string
  label: string
  termId?: string
  niches: Niche[]
}

export interface Topic {
  id: string
  label: string
  icon: string
  color: string
  categories: Category[]
  primaryPlatforms: string[]
}
