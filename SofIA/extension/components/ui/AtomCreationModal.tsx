import { useState, useEffect } from 'react'
import { useCheckExistingAtom } from '../../hooks/useCheckExistingAtom'
import { useOnChainTriplets } from '../../hooks/useOnChainTriplets'

interface AtomCreationModalProps {
  isOpen: boolean
  onClose: () => void
  objectData: {name: string; description?: string; url: string} | null
  tripletData?: {
    subject: string
    predicate: string 
    object: string
  }
  originalMessage?: {
    rawObjectDescription?: string
    rawObjectUrl?: string
  }
}

const AtomCreationModal = ({ isOpen, onClose, objectData, tripletData, originalMessage }: AtomCreationModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState<'idle' | 'checking' | 'existing' | 'creating' | 'success' | 'error'>('idle')
  const [progressMessage, setProgressMessage] = useState('')

  const { checkAndCreateAtom, isChecking, error } = useCheckExistingAtom()
  const { addTriplet } = useOnChainTriplets()

  const [receipt, setReceipt] = useState<{
    transactionHash?: string
    vaultId: string
    source: 'created' | 'existing'
    ipfsUri: string
  } | null>(null)
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
    if (isCreating || isChecking) {
      console.warn('Transaction already in progress')
      return
    }

    setIsCreating(true)
    setCurrentStep('checking')
    setProgressMessage('🔍 Checking if atom exists...')

    try {
      const atomMetadata = {
        name: name.trim(),
        description: description.trim() || "Contenu visité par l'utilisateur.",
        url: url.trim(),
        image: ''
      }
      
      console.log('🚀 Starting atom check/creation process...')
      
      // Use the new unified workflow
      const result = await checkAndCreateAtom(atomMetadata)
      
      // Update UI based on result
      if (result.exists) {
        setCurrentStep('existing')
        setProgressMessage('🔗 Atom found on-chain!')
      } else {
        setCurrentStep('creating')
        setProgressMessage('🆕 New atom created!')
      }
      
      // Save to receipt
      setReceipt({
        transactionHash: result.txHash,
        vaultId: result.vaultId,
        source: result.source,
        ipfsUri: result.ipfsUri
      })

      // Add triplet to on-chain storage if tripletData is provided
      if (tripletData) {
        await addTriplet({
          triplet: tripletData,
          atomVaultId: result.vaultId,
          txHash: result.txHash,
          source: result.source,
          url: url.trim(),
          ipfsUri: result.ipfsUri,
          originalMessage
        })
        console.log('✅ Triplet added to on-chain storage')
      }
      
      setCurrentStep('success')
      setProgressMessage(
        result.exists 
          ? '✅ Existing atom retrieved and triplet saved!' 
          : '✅ New atom created and triplet saved!'
      )
      setIsSuccess(true)

    } catch (error) {
      console.error('Error in atom workflow:', error)
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
    if (!isChecking && !isCreating) {
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