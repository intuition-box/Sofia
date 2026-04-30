/**
 * Main service for recommendations.
 * Currently exposes only `clearCache` (called from SettingsPage).
 * Full generate flow was removed when `useRecommendations` hook went dead.
 */

import { StorageRecommendation } from '../../database/StorageRecommendation'

export class RecommendationService {
  static async clearCache(walletAddress: string): Promise<void> {
    await StorageRecommendation.clear(walletAddress)
  }
}
