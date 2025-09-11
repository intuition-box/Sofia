/**
 * Message and Parsing Types
 * Used across the extension for Sofia message handling
 */

export interface Message {
  content: { text: string }
  created_at: number
}

export interface Triplet {
  subject: string
  predicate: string
  object: string
}

export interface ParsedSofiaMessage {
  triplets: Triplet[]
  intention: string
  created_at: number
  rawObjectUrl?: string  // Keep the original URL for atom creation
  rawObjectDescription?: string  // Keep the original description for atom creation
  extractedAt?: number  // Timestamp when triplets were extracted and stored
  sourceMessageId?: string  // ID of the source message
}