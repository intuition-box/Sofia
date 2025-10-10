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
  private static readonly OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
  private static readonly MCP_SERVER_URL = 'http://localhost:3001';

  /**
   * Send a chat message to Ollama directly from sidepanel
   */
  static async chat(
    messages: OllamaMessage[],
    model: string = this.DEFAULT_MODEL,
    tools?: MCPTool[]
  ): Promise<OllamaResponse> {
    try {
      console.log('🔗 [Background] Routing to Ollama via background script');
      
      const response = await chrome.runtime.sendMessage({
        type: 'OLLAMA_REQUEST',
        payload: {
          model,
          messages,
          stream: false,
          tools: tools || []
        }
      });

      console.log('🔗 [Background] Ollama response:', response);

      if (!response.success) {
        throw new Error(`Ollama API error: ${response.status || ""} ${response.error || ""}`.trim());
      }

      return response.data;
    } catch (error) {
      console.error('Error calling Ollama via background:', error);
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

      // PASS 1: Génération libre et naturelle
      const freeGenerationMessages: OllamaMessage[] = [
        {
          role: 'system',
          content: `Tu es un expert en recommandations Web3 et blockchain. Analyse les données du wallet et génère des recommandations naturelles.
          
          Format attendu par catégorie:
          **[Catégorie] - Nouveaux projets similaires**
          Pourquoi : [Raison basée sur les données]
          Suggestions :
          - [Nom]: [URL]
          - [Nom]: [URL]
          - [Nom]: [URL]
          - [Nom]: [URL]
          - [Nom]: [URL]
          
          Donne 5 suggestions par catégorie avec des URLs réelles.`,
        },
        {
          role: 'user',
          content: `Analyse ce profil wallet ${walletAddress} et génère des recommandations de NOUVEAUX projets similaires:
          
          Données trouvées: ${triplesData.triples.length} activités blockchain
          Projets suivis: ${JSON.stringify(triplesData.triples.slice(0, 10), null, 2)}
          
          Instructions:
          1. Identifie les catégories d'intérêt (psytrance, labels musicaux, outils, etc.)
          2. Ne suggère PAS les mêmes projets que je suis déjà
          3. Donne 5 nouveaux projets similaires par catégorie
          4. Fournis des URLs réelles et accessibles`,
        },
      ];

      console.log('🎯 PASS 1: Génération libre...');
      const freeResponse = await this.chat(freeGenerationMessages);
      console.log('✅ PASS 1 completed:', freeResponse.message.content.substring(0, 200) + '...');

      // PASS 2: Reformatage en JSON strict
      const formatMessages: OllamaMessage[] = [
        {
          role: 'system',
          content: `Tu dois convertir cette réponse en JSON valide avec EXACTEMENT ce format:
{
  "recommendations": [
    {
      "category": "Nom de la catégorie",
      "reason": "Raison basée sur les données",
      "suggestions": [
        {"name": "Nom du projet", "url": "URL complète"},
        {"name": "Nom du projet", "url": "URL complète"}
      ]
    }
  ]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, rien d'autre.`,
        },
        {
          role: 'user',
          content: `Convertis cette réponse en JSON format strict:

${freeResponse.message.content}

Garde toutes les catégories et suggestions, mais formate en JSON valide.`,
        },
      ];

      console.log('🎯 PASS 2: Formatage JSON...');
      const formatResponse = await this.chat(formatMessages);
      console.log('✅ PASS 2 completed:', formatResponse.message.content.substring(0, 200) + '...');
      
      return formatResponse.message.content;
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
}