/**
 * Message types for Chrome runtime communication
 * Centralizes all message types used in the extension
 */

// Chrome runtime message types
export type MessageType =
  | 'GET_TAB_ID'
  | 'PAGE_DATA'
  | 'PAGE_DURATION'
  | 'SCROLL_DATA'
  | 'SEND_CHATBOT_MESSAGE'
  | 'FETCH_BOOKMARKS'
  | 'IMPORT_SELECTED_BOOKMARKS'
  | 'UPDATE_ECHO_BADGE'
  | 'TRIPLET_PUBLISHED'
  | 'TRIPLETS_DELETED'
  | 'INITIALIZE_BADGE'
  | 'GET_PAGE_DATA'
  | 'GET_CLEAN_URL'
  | 'URL_CHANGED'
  | 'GENERATE_RECOMMENDATIONS'
  | 'WALLET_CONNECTED'
  | 'WALLET_DISCONNECTED'
  // Intention Groups messages
  | 'GET_INTENTION_GROUPS'
  | 'GET_GROUP_DETAILS'
  | 'GET_USER_XP'
  | 'CERTIFY_URL'
  | 'REMOVE_URL_FROM_GROUP'
  | 'DELETE_GROUP'
  | 'UPDATE_GROUP_LEVEL'
  | 'GET_LEVEL_UP_COST'
  | 'LEVEL_UP_GROUP'
  | 'PREVIEW_LEVEL_UP'
  | 'TRACK_URL'
  // Deep link from share page
  | 'DEEP_LINK_PROFILE'
  // Onboarding first claim from landing page
  | 'FIRST_CLAIM'
  // Wallet bridge messages
  | 'WALLET_REQUEST'
  | 'WALLET_EVENT'
  // Browsing nudge notifications
  | 'BROWSING_NUDGE'
  | 'NUDGE_DISMISSED'

export interface ChromeMessage {
  type: MessageType
  data?: any
  timestamp?: number
  pageLoadTime?: number
  // Additional properties for specific message types
  text?: string
  triplets?: any[]
  metadata?: any
  payload?: any
  walletAddress?: string
  // Intention Groups properties
  groupId?: string
  url?: string
  certification?: string
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

/** Legacy alias kept for storage layer (storeMessage accepts the SofiaMessage shape). */
export type Message = SofiaMessage

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
  title?: string
  tabId?: number
  recommendations?: any[]
}
