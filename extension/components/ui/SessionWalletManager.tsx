import { useState, useEffect } from 'react'
import { sessionWallet } from '../../lib/services/sessionWallet'
import { useStorage } from "@plasmohq/storage/hook"
import SwitchButton from './SwitchButton'
import '../styles/SettingsPage.css'

interface SessionWalletStatus {
  isReady: boolean
  address?: string
  balance?: string
  balanceWei?: bigint
}

export const SessionWalletManager= () => {
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
    <div className="session-wallet-container">
      <h3 className="session-wallet-title">Embeded Wallet</h3>
      <div className="session-wallet-description">
        Transactions without MetaMask interaction. Preview of future Sofia experience.
      </div>

      {/* Important Warning */}
      <div className="wallet-warning-box">
        <span className="wallet-warning-icon">⚠️</span>
        <div className="wallet-warning-text">
          <strong>Important:</strong> Session wallet funds are temporary.
          They will be lost for ever .
        </div>
      </div>

      {/* Toggle principal */}
      <div className="session-wallet-item">
        <span>Enable automatic mode</span>
        <SwitchButton isEnabled={useSessionWallet} onToggle={toggleSessionWallet} />
      </div>

      {/* Wallet Status */}
      {status.isReady && (
        <div className="wallet-status">
          <div className="wallet-status-header">
            <span className="wallet-label">Session Wallet</span>
            <span className="wallet-active-indicator">● Active</span>
          </div>
          <div className="wallet-details">
            <div className="wallet-address-text">
              {status.address?.slice(0, 6)}...{status.address?.slice(-4)}
            </div>
            <div className="wallet-balance-text">
              Balance: {parseFloat(status.balance || '0').toFixed(4)} TRUST
            </div>
          </div>
        </div>
      )}

      {/* Refill Section */}
      {status.isReady && (
        <div className="session-wallet-item">
          <div className="wallet-refill-container">
            <span>Refill</span>
            <div className="wallet-refill-input-container">
              <input
                type="number"
                value={refillAmount}
                onChange={(e) => setRefillAmount(e.target.value)}
                placeholder="0.1"
                step="0.01"
                min="0"
                className="wallet-refill-input"
              />
              <button
                onClick={handleRefill}
                disabled={isRefilling}
                className="wallet-action-button"
                style={{
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
        <div className="session-wallet-item">
          <span>Actions</span>
          <div className="wallet-action-buttons-container">
            <button onClick={updateStatus} className="wallet-refresh-button">
              ↻
            </button>
            <button onClick={handleDestroyWallet} className="wallet-destroy-button">
              🗑️
            </button>
          </div>
        </div>
      )}

      {/* Create Wallet Button */}
      {!status.isReady && useSessionWallet && (
        <div className="session-wallet-item">
          <span>Wallet not created</span>
          <button
            onClick={handleCreateWallet}
            disabled={isCreating}
            className="wallet-action-button"
            style={{
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