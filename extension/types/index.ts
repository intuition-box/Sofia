/**
 * Main type exports for SOFIA extension
 * Centralizes all type definitions
 */

// History and tracking types
export * from './history';

// Storage and persistence types
export * from './storage';

// Message passing types (now consolidated in messages.ts)

// Wallet integration types
export * from './wallet';

// Blockchain types
export * from './blockchain';

// Viem types
export * from './viem';

// Messages types
export * from './messages';

// Bookmarks types
export * from './bookmarks';

// Published triplets types
export * from './published-triplets';

// Utility types
export type Timestamp = number;
export type URL = string;
export type Duration = number;

// Extension-specific types
export interface ExtensionContext {
  tabId?: number;
  windowId?: number;
  frameId?: number;
  url?: string;
}

// Error handling types
export interface ExtensionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}