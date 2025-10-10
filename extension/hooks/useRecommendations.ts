/**
 * useRecommendations Hook
 * Génère des recommandations personnalisées basées sur le wallet connecté avec persistance IndexedDB
 */

import { useState, useEffect, useCallback } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { OllamaService } from '../lib/services/OllamaService'
import type { UseRecommendationsResult, Recommendation } from '../types/recommendations'
import { parseRecommendations } from '../lib/utils/recommendationParser'
import { recommendationsService } from '../lib/database/indexedDB-methods'

const CACHE_EXPIRY_HOURS = 24

export const useRecommendations = (): UseRecommendationsResult => {
  const [rawResponse, setRawResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [account] = useStorage<string>("metamask-account")

  console.log('🔄 useRecommendations hook - account:', account)

  // Fonction pour charger les recommandations depuis IndexedDB
  const loadCachedRecommendations = useCallback(async (walletAddress: string): Promise<string | null> => {
    try {
      const isValid = await recommendationsService.areRecommendationsValid(walletAddress, CACHE_EXPIRY_HOURS)
      
      if (!isValid) {
        console.log('📭 No valid cached recommendations found for', walletAddress)
        return null
      }

      const record = await recommendationsService.getRecommendations(walletAddress)
      if (record) {
        console.log('✅ Loaded cached recommendations for', walletAddress, 
          `(${record.parsedRecommendations.length} categories)`)
        return record.rawResponse // Le JSON final formaté
      }
      
      return null
    } catch (error) {
      console.error('❌ Error loading cached recommendations:', error)
      return null
    }
  }, [])

  // Fonction pour mettre à jour les recommandations avec fusion et déduplication
  const updateCachedRecommendations = useCallback(async (walletAddress: string, newResponse: string): Promise<string> => {
    try {
      const newParsedRecommendations = parseRecommendations(newResponse)
      await recommendationsService.updateRecommendations(walletAddress, newResponse, newParsedRecommendations)
      
      // Récupérer les recommandations fusionnées
      const updatedRecord = await recommendationsService.getRecommendations(walletAddress)
      if (updatedRecord) {
        // Reconstituer le JSON final formaté
        const finalJsonResponse = JSON.stringify({
          recommendations: updatedRecord.parsedRecommendations
        })
        
        // Sauvegarder le JSON final formaté comme rawResponse
        await recommendationsService.saveRecommendations(
          walletAddress, 
          finalJsonResponse, 
          updatedRecord.parsedRecommendations
        )
        
        console.log('🔄 Updated recommendations in IndexedDB for', walletAddress)
        return finalJsonResponse
      }
      
      return newResponse
    } catch (error) {
      console.error('❌ Error updating recommendations:', error)
      return newResponse
    }
  }, [])

  const generateRecommendations = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 generateRecommendations called with account:', account, 'forceRefresh:', forceRefresh)
    if (!account) {
      console.log('❌ No account found, skipping recommendations')
      return
    }

    setIsLoading(true)

    try {
      // Charger le cache si pas de force refresh
      let cachedResponse: string | null = null
      if (!forceRefresh) {
        cachedResponse = await loadCachedRecommendations(account)
        if (cachedResponse) {
          setRawResponse(cachedResponse)
          setIsLoading(false)
          console.log('📋 Using cached recommendations, generating new ones in background...')
        }
      }

      // Générer de nouvelles recommandations
      console.log('🎯 Calling OllamaService.generateRecommendations...')
      const newResponse = await OllamaService.generateRecommendations(account)
      console.log('✅ Ollama response received:', newResponse?.length ? `${newResponse.length} chars` : 'empty')

      let finalResponse: string
      
      if (cachedResponse && !forceRefresh) {
        // Fusionner avec les recommandations existantes
        finalResponse = await updateCachedRecommendations(account, newResponse)
      } else {
        // Pas de cache ou force refresh - sauvegarder directement
        const parsedRecommendations = parseRecommendations(newResponse)
        await recommendationsService.saveRecommendations(account, newResponse, parsedRecommendations)
        finalResponse = newResponse
      }

      setRawResponse(finalResponse)
      
    } catch (error) {
      console.error('❌ Error in generateRecommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [account, loadCachedRecommendations, updateCachedRecommendations])

  // Charger le cache au démarrage
  useEffect(() => {
    console.log('🔄 useRecommendations useEffect triggered - account:', account)
    if (account) {
      // Charger immédiatement le cache s'il existe
      const loadAndGenerate = async () => {
        const cached = await loadCachedRecommendations(account)
        if (cached) {
          setRawResponse(cached)
          console.log('📋 Loaded cached recommendations immediately')
        }
        
        console.log('✅ Account found, generating fresh recommendations...')
        await generateRecommendations(false) // false = ne pas forcer, utiliser cache + nouvelles
      }
      
      loadAndGenerate()
    } else {
      console.log('❌ No account, not generating recommendations')
      setRawResponse(null)
    }
  }, [account, loadCachedRecommendations, generateRecommendations])

  return {
    rawResponse,
    generateRecommendations: (forceRefresh?: boolean) => generateRecommendations(forceRefresh || false),
    isLoading
  }
}