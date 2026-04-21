/**
 * Level-up types used by both the hook and the service.
 */

export interface LevelUpPreview {
  canLevelUp: boolean
  cost: number
  availableGold: number
  currentLevel: number
  nextLevel: number
}

export interface LevelUpResult {
  success: boolean
  error?: string
  required?: number
  available?: number
  previousLevel?: number
  newLevel?: number
  previousPredicate?: string | null
  newPredicate?: string
  predicateReason?: string
  goldSpent?: number
}
