/**
 * Storage types for extension data persistence
 */

// Extension settings and preferences
export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  autoBackup: boolean;
  debugMode: boolean;
  isTrackingEnabled: boolean;
  autoCleanup: boolean;
  autoCleanupInactiveDays: number;
  autoCleanupMinLevel: number;
}
