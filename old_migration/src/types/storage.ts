import type { CompleteVisitData, SimplifiedHistoryEntry } from './history';

export interface StorageData {
  historyEntries: SimplifiedHistoryEntry[];
  completeVisits: CompleteVisitData[];
  settings: ExtensionSettings;
  cache: CacheData;
}

export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  autoBackup: boolean;
  debugMode: boolean;
  isTrackingEnabled: boolean;
}

export interface CacheData {
  lastSync: number;
  tempData: Record<string, unknown>;
  sessionData: Record<string, unknown>;
}

export type StorageKey = keyof StorageData;

export interface StorageChangeEvent<T = unknown> {
  key: StorageKey;
  oldValue?: T;
  newValue?: T;
  area: 'sync' | 'local' | 'session';
}

export interface StorageOptions {
  area?: 'sync' | 'local';
  compress?: boolean;
  encrypt?: boolean;
  ttl?: number;
}
