import type { WalletState } from './wallet'
import type { HistoryData } from './history'

export interface StorageData {
  wallet: WalletState
  history: HistoryData
  settings: ExtensionSettings
  cache: CacheData
}

export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: boolean
  autoBackup: boolean
  debugMode: boolean
}

export interface CacheData {
  lastSync: number
  tempData: Record<string, any>
  sessionData: Record<string, any>
}

export type StorageKey = keyof StorageData

export interface StorageChangeEvent<T = any> {
  key: StorageKey
  oldValue?: T
  newValue?: T
  area: 'sync' | 'local' | 'session'
}

export interface StorageOptions {
  area?: 'sync' | 'local'
  compress?: boolean
  encrypt?: boolean
  ttl?: number
} 