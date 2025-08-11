/**
 * useUserSettings Hook
 * Manages user settings with IndexedDB  
 * Replaces individual setting storage with centralized settings management
 */

import { useState, useEffect, useCallback } from 'react'
import { userSettingsService } from '~lib/indexedDB-methods'
import type { ExtensionSettings } from '~types/storage'

interface UseUserSettingsResult {
  // Settings data
  settings: ExtensionSettings
  
  // Individual settings (for convenience)
  theme: ExtensionSettings['theme']
  language: ExtensionSettings['language']
  notifications: boolean
  autoBackup: boolean
  debugMode: boolean
  isTrackingEnabled: boolean
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  updateSettings: (updates: Partial<ExtensionSettings>) => Promise<void>
  updateSetting: <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => Promise<void>
  resetSettings: () => Promise<void>
  refreshSettings: () => Promise<void>
  
  // Convenience setters
  setTheme: (theme: ExtensionSettings['theme']) => Promise<void>
  setLanguage: (language: string) => Promise<void>
  setNotifications: (enabled: boolean) => Promise<void>
  setAutoBackup: (enabled: boolean) => Promise<void>
  setDebugMode: (enabled: boolean) => Promise<void>
  setTrackingEnabled: (enabled: boolean) => Promise<void>
}

const defaultSettings: ExtensionSettings = {
  theme: 'auto',
  language: 'en',
  notifications: true,
  autoBackup: true,
  debugMode: false,
  isTrackingEnabled: true
}

/**
 * Hook for managing user settings
 */
export const useUserSettings = (): UseUserSettingsResult => {
  // State
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load settings from IndexedDB
   */
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const userSettings = await userSettingsService.getSettings()
      setSettings(userSettings)
      
      console.log('⚙️ Settings loaded successfully:', userSettings)

    } catch (err) {
      console.error('❌ Error loading settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      
      // Fallback to default settings on error
      setSettings(defaultSettings)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update multiple settings at once
   */
  const updateSettings = useCallback(async (updates: Partial<ExtensionSettings>) => {
    try {
      setIsSaving(true)
      setError(null)

      await userSettingsService.saveSettings(updates)
      
      // Update local state
      setSettings(prev => ({ ...prev, ...updates }))
      
      console.log('⚙️ Settings updated successfully:', updates)

    } catch (err) {
      console.error('❌ Error updating settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * Update a single setting
   */
  const updateSetting = useCallback(async <K extends keyof ExtensionSettings>(
    key: K, 
    value: ExtensionSettings[K]
  ) => {
    await updateSettings({ [key]: value } as Partial<ExtensionSettings>)
  }, [updateSettings])

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)

      await userSettingsService.saveSettings(defaultSettings)
      setSettings(defaultSettings)
      
      console.log('🔄 Settings reset to defaults')

    } catch (err) {
      console.error('❌ Error resetting settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset settings')
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * Refresh settings from storage
   */
  const refreshSettings = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  // Convenience setters
  const setTheme = useCallback(async (theme: ExtensionSettings['theme']) => {
    await updateSetting('theme', theme)
  }, [updateSetting])

  const setLanguage = useCallback(async (language: string) => {
    await updateSetting('language', language)
  }, [updateSetting])

  const setNotifications = useCallback(async (enabled: boolean) => {
    await updateSetting('notifications', enabled)
  }, [updateSetting])

  const setAutoBackup = useCallback(async (enabled: boolean) => {
    await updateSetting('autoBackup', enabled)
  }, [updateSetting])

  const setDebugMode = useCallback(async (enabled: boolean) => {
    await updateSetting('debugMode', enabled)
  }, [updateSetting])

  const setTrackingEnabled = useCallback(async (enabled: boolean) => {
    await updateSetting('isTrackingEnabled', enabled)
  }, [updateSetting])

  /**
   * Load settings on mount
   */
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    // Settings data
    settings,
    
    // Individual settings
    theme: settings.theme,
    language: settings.language,
    notifications: settings.notifications,
    autoBackup: settings.autoBackup,
    debugMode: settings.debugMode,
    isTrackingEnabled: settings.isTrackingEnabled,
    
    // Loading states
    isLoading,
    isSaving,
    error,
    
    // Actions
    updateSettings,
    updateSetting,
    resetSettings,
    refreshSettings,
    
    // Convenience setters
    setTheme,
    setLanguage,
    setNotifications,
    setAutoBackup,
    setDebugMode,
    setTrackingEnabled
  }
}

/**
 * Hook for tracking settings specifically (replaces existing useTracking for settings part)
 */
export const useTrackingSettings = () => {
  const {
    isTrackingEnabled,
    setTrackingEnabled,
    isSaving,
    error
  } = useUserSettings()

  const toggleTracking = useCallback(async () => {
    await setTrackingEnabled(!isTrackingEnabled)
  }, [isTrackingEnabled, setTrackingEnabled])

  return {
    isTrackingEnabled,
    setTrackingEnabled,
    toggleTracking,
    isSaving,
    error
  }
}

/**
 * Hook for theme settings specifically
 */
export const useThemeSettings = () => {
  const {
    theme,
    setTheme,
    isSaving,
    error
  } = useUserSettings()

  const isDarkMode = theme === 'dark'
  const isLightMode = theme === 'light'
  const isAutoMode = theme === 'auto'

  const setDarkMode = useCallback(() => setTheme('dark'), [setTheme])
  const setLightMode = useCallback(() => setTheme('light'), [setTheme])
  const setAutoMode = useCallback(() => setTheme('auto'), [setTheme])

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'light' ? 'dark' : 
                     theme === 'dark' ? 'auto' : 
                     'light'
    setTheme(nextTheme)
  }, [theme, setTheme])

  return {
    theme,
    isDarkMode,
    isLightMode,
    isAutoMode,
    setTheme,
    setDarkMode,
    setLightMode,
    setAutoMode,
    toggleTheme,
    isSaving,
    error
  }
}

/**
 * Hook for debug settings specifically
 */
export const useDebugSettings = () => {
  const {
    debugMode,
    setDebugMode,
    isSaving,
    error
  } = useUserSettings()

  const toggleDebugMode = useCallback(async () => {
    await setDebugMode(!debugMode)
  }, [debugMode, setDebugMode])

  return {
    debugMode,
    setDebugMode,
    toggleDebugMode,
    isSaving,
    error
  }
}

/**
 * Simple read-only hook for settings
 */
export const useSettingsData = () => {
  const {
    settings,
    theme,
    language,
    notifications,
    autoBackup,
    debugMode,
    isTrackingEnabled,
    isLoading,
    error
  } = useUserSettings()

  return {
    settings,
    theme,
    language,
    notifications,
    autoBackup,
    debugMode,
    isTrackingEnabled,
    isLoading,
    error
  }
}

export default useUserSettings