import { useState, useEffect } from 'react'
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

  // Pre-fill fields when modal opens
  useEffect(() => {
    if (isOpen && objectData) {
      setName(objectData.name || '')
      setDescription(objectData.description || '')
      setUrl(objectData.url || '')
      reset() // Reset transaction state
    }
  }, [isOpen, objectData, reset])

  // Close modal after success
  useEffect(() => {
    if (isSuccess && receipt) {
      setTimeout(() => {
        onClose()
        setIsCreating(false)
      }, 3000) // Show success for 3 seconds
    }
  }, [isSuccess, receipt, onClose])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Name is required')
      return
    }

    setIsCreating(true)

    try {
      // Create the atom metadata object
      const atomMetadata = {
        name: name.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined
      }

      // Convert to JSON then to bytes
      const atomUri = new TextEncoder().encode(JSON.stringify(atomMetadata))

      // Call the atom creation hook
      await writeContractAsync({
        args: [atomUri]
      } as any)

    } catch (error) {
      console.error('Error creating atom:', error)
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
          <h2 className="modal-title">Create atom</h2>
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
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="atom name"
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
                  placeholder="Optional description"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isCreating}
                  className="btn-primary"
                >
                  {awaitingWalletConfirmation && 'Confirmation wallet...'}
                  {awaitingOnChainConfirmation && 'Confirmation blockchain...'}
                  {isIdle && 'Create atom'}
                </button>
              </div>

              {isError && (
                <div className="error-message">
                  Error creating atom. Please try again.
                </div>
              )}
            </form>
          ) : (
            <div className="success-message">
              <h3>✅ Atom created successfully!</h3>
              {receipt && (
                <p className="tx-hash">
                  Transaction: <code>{receipt.transactionHash}</code>
                </p>
              )}
              <p className="success-note">This modal will close automatically...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AtomCreationModal