/**
 * Service for Ollama LLM integration
 * Handles communication with local Ollama instance and MCP tools using ElizaOS plugin
 */

import { intuitionGraphqlClient } from '../clients/graphql-client';
import { SUBJECT_IDS } from '../config/constants';
import { getAddress } from 'viem';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: any;
}

export class OllamaService {
  private static readonly DEFAULT_MODEL = 'llama3:latest';
  private static readonly OLLAMA_BASE_URL = 'http://localhost:11434';
  private static readonly MCP_SERVER_URL = 'http://localhost:3001';

  /**
   * Send a chat message to Ollama
   */
  static async chat(
    messages: OllamaMessage[],
    model: string = this.DEFAULT_MODEL,
    tools?: MCPTool[]
  ): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          tools: tools || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw error;
    }
  }

  /**
   * Get account triples using Sofia's proven GraphQL approach
   */
  static async getAccountTriples(walletAddress: string): Promise<any> {
    try {
      console.log('🔍 Getting account triples for:', walletAddress);
      
      // Use Sofia's checksum conversion
      const checksumAddress = getAddress(walletAddress);
      console.log('🔄 Checksum address:', checksumAddress);

      // Use Sofia's exact query that works
      const triplesQuery = `
        query Query_root($where: triples_bool_exp) {
          triples(where: $where) {
            subject { label }
            predicate { label }
            object { label }
            term_id
            created_at
            positions {
              shares
              created_at
            }
          }
        }
      `;
      
      const where = {
        "_and": [
          {
            "positions": {
              "account": {
                "id": {
                  "_eq": checksumAddress
                }
              }
            }
          },
          {
            "subject": {
              "term_id": {
                "_eq": SUBJECT_IDS.I
              }
            }
          }
        ]
      };
      
      console.log('🚀 Making GraphQL request with where:', where);
      
      const response = await intuitionGraphqlClient.request(triplesQuery, { where });
      
      console.log('📥 GraphQL response:', response);
      console.log('✅ Found triples:', response?.triples?.length || 0);
      
      return response;
    } catch (error) {
      console.error('Error getting account triples:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations using Sofia's real data + Ollama  
   */
  static async generateRecommendations(walletAddress: string): Promise<string> {
    try {
      // Get real data using Sofia's proven method
      const triplesData = await this.getAccountTriples(walletAddress);
      
      if (!triplesData?.triples?.length) {
        return "Aucune donnée trouvée pour ce wallet. Assurez-vous que l'adresse est correcte et qu'elle a de l'activité sur Intuition.";
      }

      // Ask Ollama to generate recommendations based on real data
      const messages: OllamaMessage[] = [
        {
          role: 'system',
          content: `Tu es un expert en recommandations Web3 ultra-précises avec des liens directs. 
          Analyse les triples blockchain pour identifier les préférences exactes et génère des recommandations actionables.
          Format de réponse OBLIGATOIRE pour chaque recommandation:
          
          **🎯 [Catégorie] - [Titre précis]**
          💡 **Pourquoi:** Tu as investi dans [triple exact] car tu "follow" [projet exact]
          🔗 **Suggestion:** Voici [nombre] autres [type] qui pourraient t'intéresser:
          - [Nom 1]: [URL directe]
          - [Nom 2]: [URL directe]  
          - [Nom 3]: [URL directe]
          
          Utilise UNIQUEMENT les données réelles fournies. Génère des URLs réelles vers des sites web existants.`,
        },
        {
          role: 'user',
          content: `Analyse ce profil wallet et génère des recommandations de NOUVEAUX projets similaires pour ${walletAddress}:
          
          Triples trouvés: ${triplesData.triples.length}
          Données: ${JSON.stringify(triplesData, null, 2)}
          
          Instructions STRICTES:
          1. Analyse les projets que je suis déjà : ResinaRecords, High Tone, looneymoonrecords, etc.
          2. Identifie les catégories (psytrance, labels musicaux, outils, etc.)
          3. NE PAS suggérer les mêmes projets que je suis déjà
          4. Suggère 3-5 NOUVEAUX projets similaires dans chaque catégorie
          5. Format: "Tu suis [projets existants], voici 5 autres [catégorie] similaires:"
          6. Fournis des URLs réelles vers de nouveaux projets (pas ceux que je suis déjà)
          
          Exemple attendu:
          🎯 **Labels Psytrance - Nouveaux labels similaires**
          💡 **Pourquoi:** Tu suis ResinaRecords et High Tone (labels psytrance)
          🔗 **Suggestion:** 5 autres labels psytrance qui pourraient t'intéresser:
          - Ektoplazm: https://ektoplazm.com/
          - Sangoma Records: https://sangoma.bandcamp.com/
          - etc.`,
        },
      ];

      const ollamaResponse = await this.chat(messages);
      return ollamaResponse.message.content;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return `Erreur lors de la génération des recommandations pour ${walletAddress}: ${error}`;
    }
  }

  /**
   * Check if Ollama is running
   */
  static async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if MCP server is running
   */
  static async isMCPServerRunning(): Promise<boolean> {
    try {
      await this.initializeMCPClient();
      return this.mcpClient !== null;
    } catch {
      return false;
    }
  }
}