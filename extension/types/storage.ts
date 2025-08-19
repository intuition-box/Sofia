/**
 * Storage types for extension data persistence
 * Uses @plasmohq/storage for Plasmo-specific storage handling
 */

import type { CompleteVisitData, SimplifiedHistoryEntry } from './history';

// Main storage data structure
export interface StorageData {
  historyEntries: SimplifiedHistoryEntry[];
  completeVisits: CompleteVisitData[];
  settings: ExtensionSettings;
  cache: CacheData;
}

// Extension settings and preferences
export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  autoBackup: boolean;
  debugMode: boolean;
  isTrackingEnabled: boolean;
}

// Cache and temporary data
export interface CacheData {
  lastSync: number;
  tempData: Record<string, unknown>;
  sessionData: Record<string, unknown>;
}

// Storage utility types
export type StorageKey = keyof StorageData;

// Storage change event handling
export interface StorageChangeEvent<T = unknown> {
  key: StorageKey;
  oldValue?: T;
  newValue?: T;
  area: 'sync' | 'local' | 'session';
}

// Storage configuration options
export interface StorageOptions {
  area?: 'sync' | 'local';
  compress?: boolean;
  encrypt?: boolean;
  ttl?: number;
}