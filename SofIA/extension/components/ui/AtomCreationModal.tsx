import React, { useState, useEffect } from 'react'
import { useCreateAtom } from '../../hooks/useCreateAtom'
import type { Triplet } from '../pages/graph-tabs/types'

interface AtomCreationModalProps {
  isOpen: boolean
  onClose: () => void
  objectData: Triplet['object']
}

const AtomCreationModal = ({ isOpen, onClose, objectData }: AtomCreationModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const {
    writeContractAsync,
    isIdle,
    awaitingWalletConfirmation,
    awaitingOnChainConfirmation,
    isError,
    isSuccess,
    receipt,
    reset
  } = useCreateAtom()

  // Pré-remplir les champs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && objectData) {
      setName(objectData.name || '')
      setDescription(objectData.description || '')
      setUrl(objectData.url || '')
      reset() // Reset transaction state
    }
  }, [isOpen, objectData, reset])

  // Fermer le modal après succès
  useEffect(() => {
    if (isSuccess && receipt) {
      setTimeout(() => {
        onClose()
        setIsCreating(false)
      }, 3000) // Afficher le succès pendant 3 secondes
    }
  }, [isSuccess, receipt, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Le nom est requis')
      return
    }

    setIsCreating(true)

    try {
      // Créer l'objet de métadonnées de l'atom
      const atomMetadata = {
        name: name.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined
      }

      // Convertir en JSON puis en bytes
      const atomUri = new TextEncoder().encode(JSON.stringify(atomMetadata))

      // Appeler le hook de création d'atom
      await writeContractAsync({
        args: [atomUri]
      })

    } catch (error) {
      console.error('Erreur lors de la création de l\'atom:', error)
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!awaitingWalletConfirmation && !awaitingOnChainConfirmation) {
      onClose()
      setIsCreating(false)
      reset()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content liquid-glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Créer un atom</h2>
          <button 
            className="modal-close"
            onClick={handleClose}
            disabled={awaitingWalletConfirmation || awaitingOnChainConfirmation}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="atom-form">
              <div className="form-group">
                <label htmlFor="name">Nom *</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nom de l'atom"
                  required
                  disabled={isCreating}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description optionnelle"
                  disabled={isCreating}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="url">URL</label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isCreating}
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={awaitingWalletConfirmation || awaitingOnChainConfirmation}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isCreating}
                  className="btn-primary"
                >
                  {awaitingWalletConfirmation && 'Confirmation wallet...'}
                  {awaitingOnChainConfirmation && 'Confirmation blockchain...'}
                  {isIdle && 'Créer l\'atom'}
                </button>
              </div>

              {isError && (
                <div className="error-message">
                  Erreur lors de la création de l'atom. Veuillez réessayer.
                </div>
              )}
            </form>
          ) : (
            <div className="success-message">
              <h3>✅ Atom créé avec succès !</h3>
              {receipt && (
                <p className="tx-hash">
                  Transaction: <code>{receipt.transactionHash}</code>
                </p>
              )}
              <p className="success-note">Ce modal se fermera automatiquement...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AtomCreationModal