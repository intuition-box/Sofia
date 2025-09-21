import React, { useState, useEffect } from 'react'
import { sessionWallet } from '../../lib/services/sessionWallet'
import { useStorage } from "@plasmohq/storage/hook"
import TrackingStatus from './TrackingStatus'

interface SessionWalletStatus {
  isReady: boolean
  address?: string
  balance?: string
  balanceWei?: bigint
}

export const SessionWalletManager: React.FC = () => {
  const [status, setStatus] = useState<SessionWalletStatus>({ isReady: false })
  const [useSessionWallet, setUseSessionWallet] = useStorage<boolean>("sofia-use-session-wallet", false)
  const [refillAmount, setRefillAmount] = useState("0.1")
  const [isRefilling, setIsRefilling] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    updateStatus()
  }, [])

  const updateStatus = async () => {
    const currentStatus = sessionWallet.getStatus()
    if (currentStatus.isReady) {
      await sessionWallet.getBalance()
      setStatus(sessionWallet.getStatus())
    } else {
      setStatus(currentStatus)
    }
  }

  const handleCreateWallet = async () => {
    setIsCreating(true)
    try {
      await sessionWallet.createNew()
      await updateStatus()
      setUseSessionWallet(true)
    } catch (error) {
      console.error('Failed to create session wallet:', error)
      alert('Error creating session wallet')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRefill = async () => {
    if (!refillAmount || parseFloat(refillAmount) <= 0) {
      alert('Invalid amount')
      return
    }

    setIsRefilling(true)
    try {
      const txHash = await sessionWallet.refillFromMetaMask(refillAmount)
      console.log('Refill transaction:', txHash)
      
      setTimeout(async () => {
        await updateStatus()
        setIsRefilling(false)
      }, 3000)
      
      alert(`Refill in progress... Transaction: ${txHash.slice(0, 10)}...`)
    } catch (error) {
      console.error('Refill failed:', error)
      alert('Refill error')
      setIsRefilling(false)
    }
  }

  const handleDestroyWallet = () => {
    if (confirm('Are you sure you want to destroy the session wallet? All funds will be lost.')) {
      sessionWallet.destroy()
      setUseSessionWallet(false)
      setStatus({ isReady: false })
    }
  }

  const toggleSessionWallet = () => {
    if (!useSessionWallet && !status.isReady) {
      handleCreateWallet()
    } else {
      setUseSessionWallet(!useSessionWallet)
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🚀 Automatic Mode (Test)</h3>
      <div style={styles.description}>
        Transactions without MetaMask popups. Preview of future Sofia experience.
      </div>
      
      {/* Important Warning */}
      <div style={styles.warningBox}>
        <span style={styles.warningIcon}>⚠️</span>
        <div style={styles.warningText}>
          <strong>Important:</strong> Session wallet funds are temporary. 
          They will be lost if you close the browser or destroy the wallet.
        </div>
      </div>

      {/* Toggle principal */}
      <div style={styles.settingsItem}>
        <span>Enable automatic mode</span>
        <TrackingStatus isEnabled={useSessionWallet} onToggle={toggleSessionWallet} />
      </div>

      {/* Wallet Status */}
      {status.isReady && (
        <div style={styles.walletStatus}>
          <div style={styles.statusHeader}>
            <span style={styles.walletLabel}>Session Wallet</span>
            <span style={styles.activeIndicator}>● Active</span>
          </div>
          <div style={styles.walletDetails}>
            <div style={styles.addressText}>
              {status.address?.slice(0, 6)}...{status.address?.slice(-4)}
            </div>
            <div style={styles.balanceText}>
              Balance: {parseFloat(status.balance || '0').toFixed(4)} TRUST
            </div>
          </div>
        </div>
      )}

      {/* Refill Section */}
      {status.isReady && (
        <div style={styles.settingsItem}>
          <div style={styles.refillContainer}>
            <span>Refill</span>
            <div style={styles.refillInputContainer}>
              <input
                type="number"
                value={refillAmount}
                onChange={(e) => setRefillAmount(e.target.value)}
                placeholder="0.1"
                step="0.01"
                min="0"
                style={styles.refillInput}
              />
              <button
                onClick={handleRefill}
                disabled={isRefilling}
                style={{
                  ...styles.actionButton,
                  backgroundColor: isRefilling ? 'rgba(40, 167, 69, 0.5)' : 'rgba(40, 167, 69, 0.8)'
                }}
              >
                {isRefilling ? '...' : '↑'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {status.isReady && (
        <div style={styles.settingsItem}>
          <span>Actions</span>
          <div style={styles.actionButtonsContainer}>
            <button onClick={updateStatus} style={styles.refreshButton}>
              ↻
            </button>
            <button onClick={handleDestroyWallet} style={styles.destroyButton}>
              🗑️
            </button>
          </div>
        </div>
      )}

      {/* Create Wallet Button */}
      {!status.isReady && useSessionWallet && (
        <div style={styles.settingsItem}>
          <span>Wallet not created</span>
          <button
            onClick={handleCreateWallet}
            disabled={isCreating}
            style={{
              ...styles.actionButton,
              backgroundColor: isCreating ? 'rgba(199, 134, 108, 0.5)' : 'rgba(199, 134, 108, 0.8)'
            }}
          >
            {isCreating ? '...' : 'Create'}
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    padding: '20px',
    transition: 'all 0.3s ease'
  },
  title: {
    fontFamily: "'Gotu', cursive",
    fontSize: '18px',
    fontWeight: '500',
    color: '#FBF7F5',
    marginBottom: '10px',
    marginTop: '0'
  },
  description: {
    fontSize: '14px',
    color: '#F2DED6',
    marginBottom: '20px',
    lineHeight: '1.4'
  },
  settingsItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    color: '#FBF7F5',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease'
  },
  walletStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '10px',
    border: '1px solid rgba(255, 255, 255, 0.125)'
  },
  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  walletLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#FBF7F5'
  },
  activeIndicator: {
    fontSize: '12px',
    color: '#28a745'
  },
  walletDetails: {
    fontSize: '12px',
    color: '#F2DED6'
  },
  addressText: {
    fontFamily: 'monospace',
    marginBottom: '4px'
  },
  balanceText: {
    fontWeight: '500'
  },
  refillContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    justifyContent: 'space-between'
  },
  refillInputContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  refillInput: {
    backgroundColor: 'rgba(251, 247, 245, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    padding: '6px 8px',
    borderRadius: '6px',
    color: '#FBF7F5',
    width: '80px',
    fontSize: '12px'
  },
  actionButton: {
    backgroundColor: 'rgba(199, 134, 108, 0.8)',
    color: '#FBF7F5',
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  actionButtonsContainer: {
    display: 'flex',
    gap: '8px'
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FBF7F5',
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease'
  },
  destroyButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    color: '#FBF7F5',
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.3s ease'
  },
  warningBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    border: '1px solid rgba(255, 193, 7, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },
  warningIcon: {
    fontSize: '16px',
    flexShrink: 0
  },
  warningText: {
    fontSize: '13px',
    color: '#F2DED6',
    lineHeight: '1.4'
  }
}