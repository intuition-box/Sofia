/**
 * Service for Ollama LLM integration
 * Handles communication with local Ollama instance and MCP tools using ElizaOS plugin
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

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
  private static mcpClient: Client | null = null;
  private static mcpTransport: SSEClientTransport | null = null;

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
   * Initialize MCP client connection
   */
  private static async initializeMCPClient(): Promise<void> {
    if (this.mcpClient && this.mcpTransport) {
      return; // Already initialized
    }

    try {
      this.mcpTransport = new SSEClientTransport(new URL(`${this.MCP_SERVER_URL}/sse`));
      this.mcpClient = new Client(
        { name: 'Sofia', version: '1.0.0' },
        { capabilities: {} }
      );

      await this.mcpClient.connect(this.mcpTransport);
      console.log('MCP client connected successfully');
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      throw error;
    }
  }

  /**
   * Call MCP tool via proper MCP SDK
   */
  static async callMCPTool(toolName: string, parameters: any): Promise<any> {
    try {
      await this.initializeMCPClient();
      
      if (!this.mcpClient) {
        throw new Error('MCP client not initialized');
      }

      const result = await this.mcpClient.callTool({
        name: toolName,
        arguments: parameters,
      });

      return result;
    } catch (error) {
      console.error('Error calling MCP tool:', error);
      throw error;
    }
  }

  /**
   * Get account triples using Ollama + MCP integration
   */
  static async getAccountTriples(walletAddress: string): Promise<string> {
    try {
      // First, get data from MCP
      console.log('🔍 Calling MCP tool get_account_info for:', walletAddress);
      const mcpResponse = await this.callMCPTool('get_account_info', {
        address: walletAddress,
      });
      
      console.log('📊 MCP Response received:', JSON.stringify(mcpResponse, null, 2));

      // Then ask Ollama to generate recommendations
      const messages: OllamaMessage[] = [
        {
          role: 'system',
          content: `Tu es un expert en recommandations Web3 personnalisées. 
          Analyse les triples et positions blockchain pour identifier les préférences utilisateur.
          Génère des recommandations basées sur l'ordre d'importance des positions (shares).
          Affiche seulement les données réelles, n'invente rien.`,
        },
        {
          role: 'user',
          content: `Analyse ce profil wallet et génère des recommandations personnalisées pour ${walletAddress}:
          
          Données: ${JSON.stringify(mcpResponse)}
          
          Instructions:
          1. Identifie les préférences par ordre d'importance des positions
          2. Génère 3-5 recommandations personnalisées basées sur ces préférences
          3. Explique pourquoi chaque recommandation correspond au profil`,
        },
      ];

      const ollamaResponse = await this.chat(messages);
      return ollamaResponse.message.content;
    } catch (error) {
      console.error('Error getting account triples:', error);
      return `Erreur lors de la récupération des triples pour ${walletAddress}: ${error}`;
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

  /**
   * Close MCP connection
   */
  static async closeMCPConnection(): Promise<void> {
    try {
      if (this.mcpClient) {
        await this.mcpClient.close();
        this.mcpClient = null;
      }
      if (this.mcpTransport) {
        await this.mcpTransport.close();
        this.mcpTransport = null;
      }
    } catch (error) {
      console.error('Error closing MCP connection:', error);
    }
  }
}