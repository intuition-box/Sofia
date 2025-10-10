/**
 * useRecommendations Hook
 * Génère des recommandations personnalisées basées sur le wallet connecté
 */

import { useState, useEffect, useCallback } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { OllamaService } from '../lib/services/OllamaService'
import type { UseRecommendationsResult } from '../types/recommendations'

export const useRecommendations = (): UseRecommendationsResult => {
  const [rawResponse, setRawResponse] = useState<string | null>(null)
  const [account] = useStorage<string>("metamask-account")

  console.log('🔄 useRecommendations hook - account:', account)

  const generateRecommendations = useCallback(async (): Promise<void> => {
    console.log('🚀 generateRecommendations called with account:', account)
    if (!account) {
      console.log('❌ No account found, skipping recommendations')
      return
    }

    console.log('🎯 Calling OllamaService.generateRecommendations...')
    try {
      const response = await OllamaService.generateRecommendations(account)
      console.log('✅ Ollama response received:', response?.length ? `${response.length} chars` : 'empty')
      setRawResponse(response)
    } catch (error) {
      console.error('❌ Error in generateRecommendations:', error)
    }
  }, [account])

  useEffect(() => {
    console.log('🔄 useRecommendations useEffect triggered - account:', account)
    if (account) {
      console.log('✅ Account found, generating recommendations...')
      generateRecommendations()
    } else {
      console.log('❌ No account, not generating recommendations')
    }
  }, [account, generateRecommendations])

  return {
    rawResponse,
    generateRecommendations
  }
}