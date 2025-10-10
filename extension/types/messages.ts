/**
 * Message types for Chrome runtime communication
 * Centralizes all message types used in the extension
 */

// Base message structure
export interface BaseMessage {
  type: string
  data?: any
  timestamp?: number
}

// Chrome runtime message types
export type MessageType = 
  | 'GET_TAB_ID'
  | 'PAGE_DATA'
  | 'PAGE_DURATION'
  | 'SCROLL_DATA'
  | 'CONNECT_TO_METAMASK'
  | 'GET_METAMASK_ACCOUNT'
  | 'GET_TRACKING_STATS'
  | 'CLEAR_TRACKING_DATA'
  | 'GET_BOOKMARKS'
  | 'GET_HISTORY'
  | 'STORE_BOOKMARK_TRIPLETS'
  | 'STORE_DETECTED_TRIPLETS'
  | 'GET_INTENTION_RANKING'
  | 'GET_DOMAIN_INTENTIONS'
  | 'RECORD_PREDICATE'
  | 'GET_UPGRADE_SUGGESTIONS'
  | 'START_PULSE_ANALYSIS'
  | 'UPDATE_ECHO_BADGE'
  | 'TRIPLET_PUBLISHED'
  | 'TRIPLETS_DELETED'
  | 'INITIALIZE_BADGE'
  | 'AGENT_RESPONSE'
  | 'METAMASK_RESULT'
  | 'OLLAMA_REQUEST'

// Specific message interfaces
export interface ChromeMessage extends BaseMessage {
  type: MessageType
  pageLoadTime?: number
  // Additional properties for specific message types
  text?: string
  triplets?: any[]
  metadata?: any
  timestamp?: number
  payload?: any
}

export interface TripletMessage extends BaseMessage {
  type: 'TRIPLET_PUBLISHED' | 'TRIPLETS_DELETED' | 'UPDATE_ECHO_BADGE'
  tripletId?: string
  count?: number
}

export interface BadgeMessage extends BaseMessage {
  type: 'UPDATE_ECHO_BADGE' | 'INITIALIZE_BADGE'
  count?: number
}

export interface MetamaskMessage extends BaseMessage {
  type: 'METAMASK_RESULT'
  success: boolean
  account?: string
  chainId?: string
  error?: string
}

// Sofia message types (from existing messages.ts)
export interface Triplet {
  subject: string
  predicate: string
  object: string
  objectUrl?: string
}

export interface ParsedSofiaMessage {
  triplets: Triplet[]
  intention: string
  created_at: number
  rawObjectUrl?: string
  rawObjectDescription?: string
  extractedAt?: number
  sourceMessageId?: string
}

export interface SofiaMessage {
  id: string
  content: { text: string } | ParsedSofiaMessage
  created_at: number
  processed: boolean
  type?: 'raw_message' | 'parsed_message'
}

export interface SofiaRecord {
  messageId: string
  content: ParsedSofiaMessage | { text: string }
  timestamp: number
  type: 'raw_message' | 'parsed_message'
}

// Response types
export interface MessageResponse {
  success: boolean
  data?: any
  error?: string
  status?: number
  // Additional properties for specific responses
  id?: string
  count?: number
  themes?: any[]
  message?: string
}