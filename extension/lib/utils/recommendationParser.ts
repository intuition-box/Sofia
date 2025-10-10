/**
 * Parser pour les recommandations Ollama
 * Convertit le texte brut en objets structurés
 */

import type { Recommendation } from '../../types/recommendations'

export const parseRecommendations = (response: string): Recommendation[] => {
  try {
    console.log('🔍 Parser received response:')
    console.log('📝 Raw response:', response)
    console.log('📝 Response length:', response.length)
    
    // Nettoyer la réponse - supprimer les markdown ou texte avant/après le JSON
    let cleanResponse = response.trim()
    
    // Chercher le JSON dans la réponse (entre { et })
    const jsonStart = cleanResponse.indexOf('{')
    const jsonEnd = cleanResponse.lastIndexOf('}') + 1
    
    if (jsonStart === -1 || jsonEnd === 0) {
      console.warn('❌ No JSON found in response')
      return []
    }
    
    const jsonString = cleanResponse.substring(jsonStart, jsonEnd)
    console.log('🔧 Extracted JSON:', jsonString.substring(0, 200) + '...')
    
    // Parser le JSON
    const parsed = JSON.parse(jsonString)
    console.log('✅ JSON parsed successfully:', parsed)
    
    // Vérifier la structure
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      console.warn('❌ Invalid JSON structure - missing recommendations array')
      return []
    }
    
    // Convertir en format Recommendation[]
    const recommendations: Recommendation[] = parsed.recommendations.map((rec: any) => ({
      category: rec.category || 'Unknown',
      title: rec.title || 'Recommendations',
      reason: rec.reason || 'Based on your activity',
      suggestions: Array.isArray(rec.suggestions) ? rec.suggestions.filter((s: any) => 
        s.name && s.url && s.url.startsWith('http')
      ) : []
    }))
    
    console.log('✅ Final recommendations:', recommendations.length)
    console.log('📋 Recommendations details:', recommendations)
    
    return recommendations.filter(rec => rec.suggestions.length > 0)
    
  } catch (error) {
    console.error('❌ Error parsing JSON recommendations:', error)
    console.log('🔄 Falling back to text parsing...')
    
    // Fallback vers l'ancien système si le JSON échoue
    return parseTextFallback(response)
  }
}

// Fallback parser pour le texte si JSON échoue
function parseTextFallback(response: string): Recommendation[] {
  try {
    const lines = response.split('\n')
    const recommendations: Recommendation[] = []
    let currentRec: Partial<Recommendation> | null = null
    let inSuggestions = false
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.includes('**') && (trimmed.includes('Labels') || trimmed.includes('Outils') || trimmed.includes('Music'))) {
        if (currentRec && currentRec.category) {
          recommendations.push(currentRec as Recommendation)
        }
        currentRec = {
          category: trimmed.replace(/\*\*/g, '').trim(),
          title: 'Recommendations',
          reason: '',
          suggestions: []
        }
        inSuggestions = false
      }
      else if (trimmed.startsWith('Pourquoi :') || trimmed.startsWith('Why:')) {
        if (currentRec) {
          currentRec.reason = trimmed.replace('Pourquoi :', '').replace('Why:', '').trim()
        }
      }
      else if (trimmed.includes('Suggestion :') || inSuggestions) {
        inSuggestions = true
        if (trimmed.startsWith('-') && trimmed.includes(':')) {
          const parts = trimmed.substring(1).split(':')
          if (parts.length >= 2) {
            const name = parts[0].trim()
            const url = parts.slice(1).join(':').trim()
            if (currentRec && url.startsWith('http')) {
              currentRec.suggestions?.push({ name, url })
            }
          }
        }
      }
    }
    
    if (currentRec && currentRec.category) {
      recommendations.push(currentRec as Recommendation)
    }
    
    return recommendations.filter(rec => rec.suggestions.length > 0)
  } catch (error) {
    console.error('❌ Text fallback failed:', error)
    return []
  }
}