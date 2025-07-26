import type { MCPRequest, MCPResponse, MCPSession } from '../types/mcp'

interface SSESession {
  sessionId: string
  messagesEndpoint: string
  reader: ReadableStreamDefaultReader<Uint8Array> | null
  isInitialized: boolean
}

class MCPClient {
  private readonly baseUrl = 'http://localhost:3001'
  private session: SSESession | null = null
  private decoder = new TextDecoder()

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private async initializeSSESession(): Promise<boolean> {
    try {
      console.log('🔄 Initialisation session SSE...')
      
      // 1. Connexion SSE
      const sseResponse = await fetch(`${this.baseUrl}/sse`)
      if (!sseResponse.ok) {
        throw new Error(`SSE connection failed: ${sseResponse.status}`)
      }

      const reader = sseResponse.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get SSE reader')
      }

      // 2. Lire le premier événement pour obtenir l'endpoint
      const { value } = await reader.read()
      const text = this.decoder.decode(value)
      
      const dataLine = text.split('\n').find(line => line.startsWith('data: '))
      if (!dataLine) {
        throw new Error('Failed to get messages endpoint from SSE')
      }

      const messagesEndpoint = dataLine.replace('data: ', '').trim()
      const sessionMatch = messagesEndpoint.match(/sessionId=([^&]+)/)
      if (!sessionMatch) {
        throw new Error('Failed to extract sessionId')
      }

      const sessionId = sessionMatch[1]
      
      this.session = {
        sessionId,
        messagesEndpoint,
        reader,
        isInitialized: true
      }

      console.log(`✅ Session SSE initialisée: ${sessionId}`)
      return true

    } catch (error) {
      console.error('❌ Erreur initialisation SSE:', error)
      return false
    }
  }

  private async makeSSERequest(request: MCPRequest): Promise<MCPResponse> {
    if (!this.session || !this.session.isInitialized) {
      throw new Error('SSE session not initialized')
    }

    try {
      console.log(`📤 Envoi requête MCP: ${request.method}`, request.params)
      
      // 1. Envoyer la requête POST
      const response = await fetch(`${this.baseUrl}${this.session.messagesEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      console.log(`📥 Status: ${response.status}`)
      
      if (response.status === 202) {
        // 2. Attendre la réponse via SSE (uniquement pour 202 Accepted) 
        return await this.waitForSSEResponse(String(request.id))
      } else if (response.ok) {
        // 3. Réponse directe JSON
        const result = await response.json()
        return result as MCPResponse
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

    } catch (error) {
      console.error('❌ Erreur requête SSE:', error)
      throw error
    }
  }

  private async waitForSSEResponse(requestId: string, timeoutMs: number = 30000): Promise<MCPResponse> {
    if (!this.session?.reader) {
      throw new Error('SSE reader not available')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`SSE timeout waiting for response to ${requestId}`))
      }, timeoutMs)

      let buffer = '' // Buffer pour accumuler les chunks

      const readSSEEvents = async () => {
        try {
          while (true) {
            const { done, value } = await this.session!.reader!.read()
            if (done) break

            const chunk = this.decoder.decode(value)
            buffer += chunk
            console.log('📥 Chunk reçu, buffer size:', buffer.length)
            
            // Traiter les événements SSE complets dans le buffer
            const events = buffer.split('\n\n')
            buffer = events.pop() || '' // Garder le dernier chunk incomplet
            
            for (const event of events) {
              const lines = event.split('\n')
              const dataLine = lines.find(line => line.startsWith('data: '))
              
              if (dataLine && dataLine.includes('{')) {
                try {
                  const jsonStr = dataLine.substring(6).trim()
                  console.log('🔍 Parsing JSON complet, taille:', jsonStr.length)
                  const parsed = JSON.parse(jsonStr)
                  console.log('✅ JSON parsé:', { id: parsed.id, requestId })
                  
                  // Vérifier si c'est la réponse à notre requête
                  if (parsed.id === requestId || String(parsed.id) === requestId) {
                    console.log('🎯 Réponse trouvée pour', requestId)
                    clearTimeout(timeout)
                    resolve(parsed)
                    return
                  }
                } catch (e) {
                  console.warn('❌ Erreur parsing JSON:', e)
                  console.log('JSON incomplet:', dataLine.substring(6).trim().substring(0, 200))
                }
              }
            }
          }
        } catch (error) {
          clearTimeout(timeout)
          reject(error)
        }
      }

      readSSEEvents()
    })
  }

  async initialize(): Promise<boolean> {
    if (this.session?.isInitialized) {
      return true
    }

    try {
      // Test de santé du serveur
      const healthResponse = await fetch(`${this.baseUrl}/health`)
      if (!healthResponse.ok) {
        throw new Error('MCP Server is not available')
      }
      console.log('✅ Serveur MCP disponible')

      // Initialiser la session SSE
      const sseInitialized = await this.initializeSSESession()
      if (!sseInitialized) {
        return false
      }

      // Tester avec tools/list pour valider
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: this.generateId(),
        method: 'tools/list',
        params: {}
      }

      const response = await this.makeSSERequest(request)
      if (response.error) {
        throw new Error(`MCP Error: ${response.error.message}`)
      }

      console.log('✅ Client MCP SSE initialisé avec succès', {
        sessionId: this.session?.sessionId,
        tools: response.result?.tools?.length || 0
      })

      return true

    } catch (error) {
      console.error('❌ Échec initialisation MCP Client:', error)
      return false
    }
  }

  async callTool(toolName: string, arguments_: any): Promise<any> {
    if (!this.session?.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) {
        throw new Error('Failed to initialize MCP session')
      }
    }

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: arguments_
      }
    }

    const response = await this.makeSSERequest(request)
    if (response.error) {
      throw new Error(`MCP Tool Error: ${response.error.message}`)
    }

    return response.result
  }

  async searchAtoms(queries: string[]): Promise<any> {
    console.log('🔍 Recherche atoms:', queries)
    const result = await this.callTool('search_atoms', { queries })
    
    // Parser le texte JSON du résultat
    if (result?.content?.[0]?.resource?.text) {
      try {
        const atoms = JSON.parse(result.content[0].resource.text)
        console.log(`✅ ${atoms.length} atoms trouvés`)
        return atoms
      } catch (e) {
        console.error('❌ Erreur parsing atoms:', e)
        throw new Error('Failed to parse search results')
      }
    }
    
    throw new Error('No search results returned')
  }

  async searchLists(str: string): Promise<any> {
    return await this.callTool('search_lists', { str })
  }

  async getAccountInfo(identifier: string): Promise<any> {
    return await this.callTool('get_account_info', { identifier })
  }

  getSessionInfo(): MCPSession {
    return {
      sessionId: this.session?.sessionId || null,
      isInitialized: this.session?.isInitialized || false,
      requiresAuth: false // SSE ne nécessite pas d'auth
    }
  }

  isReady(): boolean {
    return this.session?.isInitialized || false
  }

  async cleanup(): Promise<void> {
    if (this.session?.reader) {
      try {
        await this.session.reader.cancel()
        console.log('🔒 Connexion SSE fermée')
      } catch (e) {
        console.warn('Erreur fermeture SSE:', e)
      }
      this.session = null
    }
  }
}

// Singleton instance
export const mcpClient = new MCPClient()
export default mcpClient