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
  | 'SEND_CHATBOT_MESSAGE'
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
  | 'GET_PAGE_BLOCKCHAIN_DATA'
  | 'PAGE_ANALYSIS'
  | 'GET_PAGE_DATA'
  | 'GET_CLEAN_URL'
  | 'URL_CHANGED'
  | 'GENERATE_RECOMMENDATIONS'
  | 'WALLET_CONNECTED'
  | 'WALLET_DISCONNECTED'

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
  walletAddress?: string
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

// Page analysis types
export interface PageMetadata {
  title: string
  description: string
  keywords: string
  ogTitle: string
  ogDescription: string
  ogType: string
  canonical: string
  h1: string
}

export interface PageAnalysisData {
  rawUrl: string
  cleanUrl: string
  domain: string
  pathname: string
  metadata: PageMetadata
  timestamp: number
}

export interface PageBlockchainData {
  url: string
  totalStaked: number
  totalShares: number
  tripletCount: number
  lastActivity?: string
  topPredicates: Array<{
    predicate: string
    count: number
    value: number
  }>
  recentTriplets: Array<{
    subject: string
    predicate: string
    object: string
    timestamp: number
    value: number
  }>
}

export interface PageAnalysisMessage extends BaseMessage {
  type: 'PAGE_ANALYSIS'
  data: PageAnalysisData
}

export interface PageBlockchainMessage extends BaseMessage {
  type: 'GET_PAGE_BLOCKCHAIN_DATA'
  data: { url: string }
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
  url?: string
  tabId?: number
  recommendations?: any[]
}