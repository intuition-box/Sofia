import { useState, useEffect } from 'react'
import { useCreateAtom } from '../../hooks/useCreateAtom'

interface AtomCreationModalProps {
  isOpen: boolean
  onClose: () => void
  objectData: {name: string; description?: string; url: string} | null
}

const AtomCreationModal = ({ isOpen, onClose, objectData }: AtomCreationModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState<'idle' | 'pinning' | 'blockchain' | 'success' | 'error'>('idle')
  const [progressMessage, setProgressMessage] = useState('')

  const { createAtomWithMultivault, isLoading, error } = useCreateAtom()

  const [receipt, setReceipt] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Pre-fill fields when modal opens
  useEffect(() => {
    if (isOpen && objectData) {
      setName(objectData.name || '')
      setDescription(objectData.description || '')
      setUrl(objectData.url || '')
      setIsSuccess(false)
      setReceipt(null)
    }
  }, [isOpen, objectData])

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

    // Prévenir les double-soumissions
    if (isCreating || isLoading) {
      console.warn('Transaction already in progress')
      return
    }

    setIsCreating(true)
    setCurrentStep('pinning')
    setProgressMessage('📌 Creating atom...')

    try {
      const atomMetadata = {
        name: name.trim(),
        description: description.trim() || "Contenu visité par l'utilisateur.",
        url: url.trim(),
        image: ''
      }
      
      const result = await createAtomWithMultivault(atomMetadata)
      
      setCurrentStep('success')
      setProgressMessage('✅ Atom created successfully!')
      setIsSuccess(true)
      setReceipt({ transactionHash: result.txHash, vaultId: result.vaultId })

    } catch (error) {
      console.error('Error creating atom:', error)
      setCurrentStep('error')
      if (error instanceof Error) {
        setProgressMessage(`❌ Error: ${error.message}`)
      } else {
        setProgressMessage('❌ Unknown error occurred')
      }
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      setIsCreating(false)
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
            disabled={isLoading}
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
                  disabled={isLoading}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isCreating}
                  className="btn-primary"
                >
                  {currentStep === 'pinning' && '📌 Pinning to IPFS...'}
                  {currentStep === 'blockchain' && '💳 Creating atom...'}
                  {currentStep === 'idle' && 'Create atom'}
                </button>
              </div>

              {progressMessage && currentStep !== 'idle' && (
                <div className={`progress-message ${currentStep === 'error' ? 'error-message' : 'info-message'}`}>
                  {progressMessage}
                </div>
              )}

              {error && !progressMessage && (
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