import React, { useState, useEffect } from 'react'
import { sessionWallet } from '../../lib/services/sessionWallet'
import { useStorage } from "@plasmohq/storage/hook"

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
      // Mettre à jour balance en temps réel
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
      alert('Erreur lors de la création du wallet de session')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRefill = async () => {
    if (!refillAmount || parseFloat(refillAmount) <= 0) {
      alert('Montant invalide')
      return
    }

    setIsRefilling(true)
    try {
      const txHash = await sessionWallet.refillFromMetaMask(refillAmount)
      console.log('Refill transaction:', txHash)
      
      // Attendre un peu puis mettre à jour
      setTimeout(async () => {
        await updateStatus()
        setIsRefilling(false)
      }, 3000)
      
      alert(`Recharge en cours... Transaction: ${txHash.slice(0, 10)}...`)
    } catch (error) {
      console.error('Refill failed:', error)
      alert('Erreur lors de la recharge')
      setIsRefilling(false)
    }
  }

  const handleDestroyWallet = () => {
    if (confirm('Êtes-vous sûr de vouloir détruire le wallet de session ? Les fonds seront perdus.')) {
      sessionWallet.destroy()
      setUseSessionWallet(false)
      setStatus({ isReady: false })
    }
  }

  const toggleSessionWallet = (enabled: boolean) => {
    if (enabled && !status.isReady) {
      // Si on active mais pas de wallet, en créer un
      handleCreateWallet()
    } else {
      setUseSessionWallet(enabled)
    }
  }

  return (
    <div className="session-wallet-manager p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🚀 Mode Automatique (Test)</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useSessionWallet}
            onChange={(e) => toggleSessionWallet(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Activer</span>
        </label>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <p>Transactions sans popup MetaMask. Aperçu de l'expérience future Sofia.</p>
      </div>

      {!status.isReady ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Aucun wallet de session créé</p>
          <button
            onClick={handleCreateWallet}
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? 'Création...' : 'Créer Wallet de Session'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status du wallet */}
          <div className="bg-white p-3 rounded border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Wallet de Session</span>
              <span className="text-xs text-green-600">● Actif</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                <span className="font-mono">{status.address?.slice(0, 6)}...{status.address?.slice(-4)}</span>
              </div>
              <div className="font-medium">
                Balance: {parseFloat(status.balance || '0').toFixed(4)} TRUST
              </div>
            </div>
          </div>

          {/* Refill manuel */}
          <div className="bg-white p-3 rounded border">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Montant à recharger (TRUST)
                </label>
                <input
                  type="number"
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                  placeholder="0.1"
                  step="0.01"
                  min="0"
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <button
                onClick={handleRefill}
                disabled={isRefilling}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {isRefilling ? 'Recharge...' : 'Recharger'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={updateStatus}
              className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              Actualiser
            </button>
            <button
              onClick={handleDestroyWallet}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Détruire
            </button>
          </div>
        </div>
      )}

      {/* Informations */}
      <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
        <p><strong>Mode Test:</strong> Ce wallet temporaire permet de tester l'expérience sans popup. Dans la version finale, Sofia gérera tout automatiquement.</p>
      </div>
    </div>
  )
}