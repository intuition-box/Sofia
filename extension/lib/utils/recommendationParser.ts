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
    
    // Vérifier la structure - format standard ou format Ollama
    let recommendations: Recommendation[] = []
    
    if ((parsed.recommendations && Array.isArray(parsed.recommendations)) || 
        (parsed.Recommendations && Array.isArray(parsed.Recommendations))) {
      // Format standard : {"recommendations": [...]} ou {"Recommendations": [...]}
      console.log('🎯 Format standard détecté')
      const recs = parsed.recommendations || parsed.Recommendations
      
      recommendations = recs.map((rec: any) => {
        let suggestions = []
        
        // Format suggestions comme array d'objets {name, url}
        if (Array.isArray(rec.suggestions)) {
          suggestions = rec.suggestions.filter((s: any) => 
            s.name && s.url && s.url.startsWith('http')
          )
        }
        // Format suggestions comme array d'objets {name, url} avec clé majuscule
        else if (Array.isArray(rec.Suggestions)) {
          // Si c'est des strings "Nom: URL", les convertir
          if (typeof rec.Suggestions[0] === 'string') {
            suggestions = rec.Suggestions
              .filter((s: string) => s.includes(':') && s.includes('http'))
              .map((s: string) => {
                const parts = s.split(':')
                const name = parts[0].trim()
                const url = parts.slice(1).join(':').trim()
                return { name, url }
              })
          } else {
            suggestions = rec.Suggestions.filter((s: any) => 
              s.name && s.url && s.url.startsWith('http')
            )
          }
        }
        
        return {
          category: rec.category || rec.Category || 'Unknown',
          title: rec.title || 'Recommendations',
          reason: rec.reason || rec.Why || 'Based on your activity',
          suggestions
        }
      })
    } else {
      // Format Ollama : {"psytrance_projects": [...], "labels_musicaux": [...]}
      console.log('🎯 Format Ollama détecté - conversion en cours')
      
      for (const [key, value] of Object.entries(parsed)) {
        if (Array.isArray(value)) {
          const categoryName = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
          const suggestions = value
            .filter((item: any) => item.title && item.url && item.url.startsWith('http'))
            .map((item: any) => ({
              name: item.title,
              url: item.url
            }))
          
          if (suggestions.length > 0) {
            recommendations.push({
              category: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
              title: 'Nouveaux projets similaires',
              reason: `Basé sur votre activité dans ${categoryName}`,
              suggestions
            })
          }
        }
      }
    }
    
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
      
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
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
      else if (trimmed === 'Suggestions :') {
        inSuggestions = true
      }
      else if (inSuggestions && trimmed.startsWith('-') && trimmed.includes(':')) {
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
    
    if (currentRec && currentRec.category) {
      recommendations.push(currentRec as Recommendation)
    }
    
    return recommendations.filter(rec => rec.suggestions.length > 0)
  } catch (error) {
    console.error('❌ Text fallback failed:', error)
    return []
  }
}