/**
 * React Hook for IndexedDB Migration
 * Manages the migration process from Plasmo Storage to IndexedDB
 */

import { useState, useEffect, useCallback } from 'react'
import { migrationService, type MigrationStatus } from '~lib/migration-service'

interface UseMigrationResult {
  migrationStatus: MigrationStatus | null
  isMigrationRunning: boolean
  isMigrationCompleted: boolean
  migrationError: string | null
  runMigration: () => Promise<void>
  resetMigration: () => Promise<void>
  refreshStatus: () => Promise<void>
}

/**
 * Hook to manage IndexedDB migration process
 */
export const useMigration = (): UseMigrationResult => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null)
  const [isMigrationRunning, setIsMigrationRunning] = useState(false)
  const [migrationError, setMigrationError] = useState<string | null>(null)

  /**
   * Load migration status from storage
   */
  const refreshStatus = useCallback(async () => {
    try {
      const status = await migrationService.getMigrationStatus()
      setMigrationStatus(status)
      
      if (status) {
        console.log('📊 Migration status loaded:', {
          completed: status.isCompleted,
          version: status.version,
          errors: status.errors.length
        })
      }
    } catch (error) {
      console.error('❌ Error loading migration status:', error)
      setMigrationError(error.message)
    }
  }, [])

  /**
   * Run the migration process
   */
  const runMigration = useCallback(async () => {
    if (isMigrationRunning) {
      console.log('⚠️ Migration is already running')
      return
    }

    setIsMigrationRunning(true)
    setMigrationError(null)

    try {
      console.log('🚀 Starting migration process...')
      const result = await migrationService.runMigration()
      setMigrationStatus(result)
      
      if (result.isCompleted) {
        console.log('✅ Migration completed successfully')
      } else {
        const errorMsg = 'Migration completed with errors'
        console.warn('⚠️', errorMsg)
        setMigrationError(errorMsg)
      }
    } catch (error) {
      console.error('❌ Migration failed:', error)
      setMigrationError(error.message)
    } finally {
      setIsMigrationRunning(false)
    }
  }, [isMigrationRunning])

  /**
   * Reset migration status (for testing)
   */
  const resetMigration = useCallback(async () => {
    try {
      await migrationService.resetMigrationStatus()
      setMigrationStatus(null)
      setMigrationError(null)
      console.log('🔄 Migration status reset')
    } catch (error) {
      console.error('❌ Error resetting migration:', error)
      setMigrationError(error.message)
    }
  }, [])

  /**
   * Auto-check migration status on mount
   */
  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  /**
   * Auto-run migration if not completed (optional - can be disabled)
   */
  useEffect(() => {
    const autoRunMigration = async () => {
      // Only auto-run if migration is not completed and not currently running
      if (migrationStatus === null || (!migrationStatus.isCompleted && !isMigrationRunning)) {
        // Check if migration is needed
        const isCompleted = await migrationService.isMigrationCompleted()
        if (!isCompleted) {
          console.log('🔄 Auto-running migration on first load...')
          await runMigration()
        }
      }
    }

    // Auto-run migration on first load (uncomment to enable)
    // autoRunMigration()
  }, [migrationStatus, isMigrationRunning, runMigration])

  return {
    migrationStatus,
    isMigrationRunning,
    isMigrationCompleted: migrationStatus?.isCompleted || false,
    migrationError,
    runMigration,
    resetMigration,
    refreshStatus
  }
}

/**
 * Hook that automatically runs migration if needed
 * Use this in your main app component
 */
export const useAutoMigration = (options: { 
  autoRun?: boolean 
  showLogs?: boolean 
} = {}): Pick<UseMigrationResult, 'isMigrationCompleted' | 'isMigrationRunning' | 'migrationError'> => {
  const { autoRun = true, showLogs = true } = options
  
  const {
    migrationStatus,
    isMigrationRunning,
    isMigrationCompleted,
    migrationError,
    runMigration,
    refreshStatus
  } = useMigration()

  useEffect(() => {
    const handleAutoMigration = async () => {
      if (!autoRun) return

      // Check if migration is needed
      if (migrationStatus === null) {
        await refreshStatus()
        return
      }

      if (!migrationStatus.isCompleted && !isMigrationRunning) {
        if (showLogs) {
          console.log('🔄 Auto-migration: Starting migration...')
        }
        await runMigration()
      }
    }

    handleAutoMigration()
  }, [autoRun, migrationStatus, isMigrationRunning, showLogs, runMigration, refreshStatus])

  return {
    isMigrationCompleted,
    isMigrationRunning,
    migrationError
  }
}

export default useMigration