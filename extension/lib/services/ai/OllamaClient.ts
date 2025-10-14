/**
 * Client Ollama simplifié - Communication pure avec Ollama
 */

import type { OllamaMessage } from './types'

export class OllamaClient {
  private static readonly DEFAULT_MODEL = 'llama3:latest'
  private static readonly TIMEOUT = 30000 // 30 secondes

  /**
   * Envoie un message à Ollama via le background script
   */
  static async chat(messages: OllamaMessage[], model?: string): Promise<string> {
    try {
      console.log('🤖 [OllamaClient] Sending request to background script')
      
      const response = await chrome.runtime.sendMessage({
        type: 'OLLAMA_REQUEST',
        payload: {
          model: model || this.DEFAULT_MODEL,
          messages,
          stream: false
        }
      })

      if (!response.success) {
        throw new Error(`Ollama error: ${response.error || 'Unknown error'}`)
      }

      const content = response.data?.message?.content
      if (!content) {
        throw new Error('No content in Ollama response')
      }

      console.log('✅ [OllamaClient] Response received:', content.substring(0, 100) + '...')
      return content

    } catch (error) {
      console.error('❌ [OllamaClient] Error:', error)
      throw error
    }
  }

  /**
   * Vérifie si Ollama est disponible
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const testResponse = await this.chat([
        { role: 'user', content: 'Hello' }
      ])
      return !!testResponse
    } catch {
      return false
    }
  }
}