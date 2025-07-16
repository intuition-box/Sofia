/**
 * Main type exports for SOFIA extension
 * Centralizes all type definitions
 */

// History and tracking types
export * from './history';

// Storage and persistence types
export * from './storage';

// Message passing types
export * from './messaging';

// Wallet integration types
export * from './wallet';

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