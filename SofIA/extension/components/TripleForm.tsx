import React, {
  useState,
  useImperativeHandle,
  forwardRef,
} from "react"
import './styles/TripleForm.css'

import { useCreateTriples } from '../hooks/useCreateTriple'
import { useCreatePosition } from '../hooks/useCreatePosition'
import { getClients } from "../lib/viemClients"
import { useDepositTriple } from "../hooks/useDepositTriple"
import { umami } from "../lib/umami"

interface Atom {
  id: string
  label: string
  vault_id: string
}

type TripleWithVote = {
  triple: [Atom, Atom, Atom]
  vote: "for" | "against" | null
}


export type TripleFormRef = {
  resetForm: () => void
}

const TripleForm = forwardRef<TripleFormRef, {}>((_, ref) => {
  const [subject, setSubject] = useState<Atom | null>(null)
  const [predicate, setPredicate] = useState<Atom | null>(null)
  const [object, setObject] = useState<Atom | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [labeledTriples, setLabeledTriples] = useState<TripleWithVote[]>([])
  const { createPosition } = useCreatePosition()

  const updateVote = (index: number, newVote: "for" | "against") => {
    setLabeledTriples(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, vote: newVote } : item
      )
    )
  }

  const canSubmit = labeledTriples.length > 0 && labeledTriples.every(t => t.vote !== null)

  const createTriplesMutation = useCreateTriples()
  
  // État local pour gérer les triples
  const [triples, setTriples] = useState<bigint[][]>([])
  const [vaultIds, setVaultIds] = useState<string[]>([])
  
  const addTriple = (triple: bigint[]) => {
    setTriples(prev => [...prev, triple])
  }
  
  const clearTriples = () => {
    setTriples([])
    setVaultIds([])
  }
  
  const removeTriple = (index: number) => {
    setTriples(prev => prev.filter((_, i) => i !== index))
  }
  
  const createTriples = async () => {
    // Simuler la création des vault IDs (à adapter selon votre logique)
    const newVaultIds = triples.map((_, i) => `vault_${Date.now()}_${i}`)
    setVaultIds(newVaultIds)
    return { vaultIds: newVaultIds }
  }
  
  const isLoading = createTriplesMutation.awaitingWalletConfirmation || createTriplesMutation.awaitingOnChainConfirmation
  const error = createTriplesMutation.isError ? "Erreur lors de la création des triples" : null
  const txHash = createTriplesMutation.data

  useImperativeHandle(ref, () => ({
    resetForm: () => {
      setSubject(null)
      setPredicate(null)
      setObject(null)
      setLabeledTriples([])
      clearTriples()
      setErrorMessage(null)
      setProgressMessage(null)
    }
  }))

  const handleRemoveTriple = (index: number) => {
    setLabeledTriples((prev) => prev.filter((_, i) => i !== index))
    removeTriple(index)
  }

  const handleAddTriple = () => {
    if (!subject || !predicate || !object) {
      setErrorMessage("All three atoms must be selected.")
      return
    }

    try {
      addTriple([
        BigInt(subject.vault_id),
        BigInt(predicate.vault_id),
        BigInt(object.vault_id)
      ])
      setLabeledTriples((prev) => [
        ...prev,
        {
          triple: [subject, predicate, object],
          vote: null
        }
      ])
      setSubject(null)
      setPredicate(null)
      setObject(null)
      setErrorMessage(null)
    } catch (err: any) {
      setErrorMessage("Invalid vault IDs or atoms.")
    }
  }


  const handleSubmitAll = async () => {
    setErrorMessage(null)

    try {
      if (triples.length === 0) {
        setErrorMessage("Please add at least one triple to submit.")
        return
      }
      const totalTxCount = 1 + labeledTriples.length

      setProgressMessage(`Transaction 1/${totalTxCount}: Creating triples...`)
      const { vaultIds: createdVaultIds } = await createTriples()

      umami("triples_created", {
        vaultIds: createdVaultIds.join(",")
      }).catch(console.error)

      if (!createdVaultIds || createdVaultIds.length !== labeledTriples.length) {
        throw new Error("Mismatch between created triples and local list")
      }

      setProgressMessage("Triples created. Preparing to vote...")

      const { walletClient, publicClient } = await getClients()
      const multivault = useDepositTriple

      for (let i = 0; i < createdVaultIds.length; i++) {
        const { triple: [s, p, o], vote } = labeledTriples[i]
        const vaultId = createdVaultIds[i]

        setProgressMessage(
          `Transaction ${i + 2}/${totalTxCount}: Voting ${vote?.toUpperCase()} for "${s.label} → ${p.label} → ${o.label}"`
        )


        let targetVaultId = vaultId

        if (vote === "against") {
          // Pour le vote "against", on utilise un vault ID différent
          // Cette logique doit être adaptée selon votre implémentation
          targetVaultId = `counter_${vaultId}`
        }

        await createPosition({ vaultId: BigInt(targetVaultId) })
      }

      setProgressMessage("✅ All votes submitted!")
      setLabeledTriples([])
      clearTriples()
      setSubject(null)
      setPredicate(null)
      setObject(null)
    } catch (err: any) {
      setErrorMessage(err.message || "An unknown error occurred.")
    }
  }


  return (
    <div className="triple-form-container">
      {labeledTriples.map((item, i) => {
        const triple = item.triple ?? [null, null, null]
        const vote = item.vote ?? null

        const [s, p, o] = triple

        if (!s || !p || !o) return null

        return (
          <li key={i} className="triple-item">
            <div className="triple-item-header">
              <span>{s.label} → {p.label} → {o.label}</span>
              <button
                onClick={() => handleRemoveTriple(i)}
                className="triple-remove-btn"
              >
                ✕
              </button>
            </div>

            <div className="vote-container">
              <label className="vote-label">
                <input
                  type="radio"
                  name={`vote-${i}`}
                  value="for"
                  checked={vote === "for"}
                  onChange={() => updateVote(i, "for")}
                />
                FOR
              </label>
              <label className="vote-label">
                <input
                  type="radio"
                  name={`vote-${i}`}
                  value="against"
                  checked={vote === "against"}
                  onChange={() => updateVote(i, "against")}
                />
                AGAINST
              </label>
            </div>
          </li>
        )
      })}

      <form
        className="triple-form"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="form-buttons">
          <button
            type="button"
            onClick={handleAddTriple}
            className="form-btn"
          >
            Add
          </button>

          <button
            type="button"
            onClick={handleSubmitAll}
            disabled={isLoading || !canSubmit}
            className={`form-btn ${!canSubmit || isLoading ? 'form-btn:disabled' : ''}`}
          >
            {isLoading ? "Send..." : "Submit"}
          </button>
        </div>

        {txHash && <p className="success-message">Tx: {txHash}</p>}
        {vaultIds && <p className="success-message">Vaults: {vaultIds.join(', ')}</p>}
        {progressMessage && (
          <p
            className={`progress-message ${progressMessage.startsWith("Transaction")
              ? "progress-transaction"
              : "progress-success"
              }`}
          >
            {progressMessage}
          </p>
        )}
        {(errorMessage || error) && (
          <p className="error-message">{errorMessage || error}</p>
        )}
      </form>
    </div>
  )
})

export default TripleForm;