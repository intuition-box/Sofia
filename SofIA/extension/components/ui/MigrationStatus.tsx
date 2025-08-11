/**
 * Migration Status Component
 * Shows migration progress and allows manual migration control
 */

import React from 'react'
import { useMigration } from '~hooks/useMigration'
import './MigrationStatus.css'

interface MigrationStatusProps {
  showDetails?: boolean
  allowManualControl?: boolean
  className?: string
}

export const MigrationStatus: React.FC<MigrationStatusProps> = ({ 
  showDetails = false, 
  allowManualControl = false,
  className = ''
}) => {
  const {
    migrationStatus,
    isMigrationRunning,
    isMigrationCompleted,
    migrationError,
    runMigration,
    resetMigration,
    refreshStatus
  } = useMigration()

  // Don't show anything if migration is completed and details are hidden
  if (!showDetails && isMigrationCompleted && !migrationError) {
    return null
  }

  const getStatusIcon = () => {
    if (isMigrationRunning) return '🔄'
    if (migrationError) return '❌'
    if (isMigrationCompleted) return '✅'
    return '⏳'
  }

  const getStatusText = () => {
    if (isMigrationRunning) return 'Migration in progress...'
    if (migrationError) return 'Migration failed'
    if (isMigrationCompleted) return 'Migration completed'
    return 'Migration pending'
  }

  const getStatusClass = () => {
    if (isMigrationRunning) return 'migration-running'
    if (migrationError) return 'migration-error'
    if (isMigrationCompleted) return 'migration-completed'
    return 'migration-pending'
  }

  return (
    <div className={`migration-status ${getStatusClass()} ${className}`}>
      <div className="migration-status-header">
        <span className="migration-icon">{getStatusIcon()}</span>
        <span className="migration-text">{getStatusText()}</span>
      </div>

      {showDetails && migrationStatus && (
        <div className="migration-details">
          <div className="migration-info">
            <div className="migration-row">
              <span>Version:</span>
              <span>{migrationStatus.version}</span>
            </div>
            <div className="migration-row">
              <span>Date:</span>
              <span>{new Date(migrationStatus.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="migration-data">
            <h4>Migrated Data:</h4>
            <div className="migration-row">
              <span>Eliza Messages:</span>
              <span>{migrationStatus.migratedData.elizaMessages}</span>
            </div>
            <div className="migration-row">
              <span>Extracted Triplets:</span>
              <span>{migrationStatus.migratedData.extractedTriplets}</span>
            </div>
            <div className="migration-row">
              <span>User Settings:</span>
              <span>{migrationStatus.migratedData.userSettings ? 'Yes' : 'No'}</span>
            </div>
            <div className="migration-row">
              <span>Search Queries:</span>
              <span>{migrationStatus.migratedData.searchQueries}</span>
            </div>
            <div className="migration-row">
              <span>On-chain Triplets:</span>
              <span>{migrationStatus.migratedData.onChainTriplets} (kept in Plasmo)</span>
            </div>
          </div>

          {migrationStatus.errors.length > 0 && (
            <div className="migration-errors">
              <h4>Errors ({migrationStatus.errors.length}):</h4>
              {migrationStatus.errors.map((error, index) => (
                <div key={index} className="migration-error">
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {allowManualControl && (
        <div className="migration-controls">
          <button 
            onClick={runMigration} 
            disabled={isMigrationRunning || isMigrationCompleted}
            className="migration-button primary"
          >
            {isMigrationRunning ? 'Running...' : 'Run Migration'}
          </button>
          
          <button 
            onClick={refreshStatus} 
            disabled={isMigrationRunning}
            className="migration-button secondary"
          >
            Refresh
          </button>

          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={resetMigration} 
              disabled={isMigrationRunning}
              className="migration-button danger"
              title="Development only - reset migration status"
            >
              Reset (Dev)
            </button>
          )}
        </div>
      )}

      {migrationError && (
        <div className="migration-error-message">
          <strong>Error:</strong> {migrationError}
          <button 
            onClick={runMigration} 
            disabled={isMigrationRunning}
            className="migration-retry-button"
          >
            Retry Migration
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Simple migration indicator for status bar
 */
export const MigrationIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isMigrationCompleted, isMigrationRunning, migrationError } = useMigration()

  if (isMigrationCompleted && !migrationError) {
    return null // Don't show when everything is good
  }

  const getIndicatorClass = () => {
    if (isMigrationRunning) return 'indicator-running'
    if (migrationError) return 'indicator-error'
    return 'indicator-pending'
  }

  const getIndicatorText = () => {
    if (isMigrationRunning) return 'Migrating...'
    if (migrationError) return 'Migration Error'
    return 'Migration Needed'
  }

  return (
    <div className={`migration-indicator ${getIndicatorClass()} ${className}`}>
      <span className="indicator-dot"> </span>
      <span className="indicator-text">{getIndicatorText()}</span>
    </div>
  )
}

export default MigrationStatus