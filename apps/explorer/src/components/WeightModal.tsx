import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { usePinThingMutation } from '@0xsofia/graphql'
import { useDeposit } from '../hooks/useDeposit'
import { useFeeEstimate } from '../hooks/useFeeEstimate'
import { useUserAccountAtom } from '../hooks/useUserAccountAtom'
import { useTripleVerification } from '../hooks/useTripleVerification'
import type { CartItem } from '../hooks/useCart'
import { EXPLORER_URL, PREDICATE_IDS, SOFIA_PROXY_ADDRESS } from '../config'
import {
  HAS_TAG_PREDICATE_ID,
  TOPIC_ATOM_IDS,
} from '../config/atomIds'
import { intentionBadgeStyle } from '../config/intentions'
import {
  executeCreateTriplesBatch,
  type BatchCreateTripleItem,
  type CreateTripleResult,
} from '../services/tripleCreationService'
import {
  executeCreateAtomsBatch,
  type AtomIPFSPayload,
  type PinThingFn,
} from '../services/atomCreationService'
import SofiaLoader from './ui/SofiaLoader'
import './styles/weight-modal.css'

const WEIGHT_OPTIONS = [0.01, 0.5, 1, 5, 10]

interface WeightModalProps {
  isOpen: boolean
  items: CartItem[]
  onClose: () => void
  onSuccess: () => void
}

export default function WeightModal({
  isOpen,
  items,
  onClose,
  onSuccess,
}: WeightModalProps) {
  const [weights, setWeights] = useState<number[]>([])
  const [customValues, setCustomValues] = useState<string[]>([])
  const [balance, setBalance] = useState<string | null>(null)
  const [createTripleProcessing, setCreateTripleProcessing] = useState(false)
  const [createTripleResult, setCreateTripleResult] =
    useState<CreateTripleResult | null>(null)
  const {
    depositBatch,
    processing: depositProcessing,
    txResult: depositTxResult,
    reset,
    getBalance,
  } = useDeposit()
  const { estimate } = useFeeEstimate()
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const qc = useQueryClient()
  // Resolve the wallet's Account atom term_id — required as the subject
  // of any membership triple we mint when items[].kind === 'create-circle'.
  const userAccountAtom = useUserAccountAtom(wallets[0]?.address)
  // Defence against a poisoned indexer / stale cart entry: pre-check that
  // every `kind: 'deposit'` termId actually exists on-chain. If a triple is
  // missing the deposit would route TRUST into an attacker-controlled vault.
  const depositTermIds = useMemo(
    () =>
      items
        .filter((it) => (it.kind ?? 'deposit') === 'deposit')
        .map((it) => it.termId),
    [items],
  )
  const verifiedTriples = useTripleVerification(depositTermIds)
  const verifying = verifiedTriples === undefined && depositTermIds.length > 0
  const missingTripleIds = useMemo(() => {
    if (!verifiedTriples) return []
    return depositTermIds.filter(
      (id) => !verifiedTriples.get(id.toLowerCase())?.exists,
    )
  }, [verifiedTriples, depositTermIds])
  // Static fetcher exposed alongside the React Query mutation hook —
  // we use it here to keep the create flow fully callable from a sync
  // event handler without needing a separate `mutate` callback.
  const pinThing: PinThingFn = useCallback(
    (vars) =>
      usePinThingMutation.fetcher({
        name: vars.name,
        description: vars.description,
        image: vars.image,
        url: vars.url,
      })(),
    [],
  )

  useEffect(() => {
    if (isOpen && items.length > 0) {
      setWeights(new Array(items.length).fill(0.5))
      setCustomValues(new Array(items.length).fill(''))
      reset()
      setCreateTripleResult(null)
      setCreateTripleProcessing(false)
      getBalance().then(setBalance)
    }
  }, [isOpen, items.length, getBalance, reset])

  const getAmount = (index: number) => {
    const cv = customValues[index]
    return cv?.trim() ? parseFloat(cv) || 0 : (weights[index] ?? 0.5)
  }

  const totalDeposit = useMemo(() => {
    return items.reduce((sum, _, i) => sum + getAmount(i), 0)
  }, [items, weights, customValues])

  const balNum = balance ? parseFloat(balance) : 0

  const breakdown = useMemo(() => {
    const costEstimate = estimate?.(totalDeposit) ?? null
    return {
      deposit: totalDeposit,
      sofiaFixedFee: costEstimate?.sofiaFixedFee ?? 0,
      sofiaPercentFee: costEstimate?.sofiaPercentFee ?? 0,
      totalFees: costEstimate?.totalFees ?? 0,
      totalEstimate: costEstimate?.totalEstimate ?? totalDeposit,
    }
  }, [totalDeposit, estimate])

  const handleWeightSelect = (index: number, value: number) => {
    setWeights((prev) => {
      const n = [...prev]
      n[index] = value
      return n
    })
    setCustomValues((prev) => {
      const n = [...prev]
      n[index] = ''
      return n
    })
  }

  const handleCustomChange = (index: number, value: string) => {
    setCustomValues((prev) => {
      const n = [...prev]
      n[index] = value
      return n
    })
  }

  // Cart items split by kind so we route to the right contract call:
  //   - 'deposit'        → useDeposit.depositBatch
  //   - 'create-triple'  → executeCreateTriplesBatch
  //   - 'create-circle'  → executeCreateAtomsBatch THEN executeCreateTriplesBatch
  //                        (the membership + has_tag triples reference the
  //                        atom ids returned by the atom batch)
  const handleSubmit = useCallback(async () => {
    const depositItems: { termId: string; amountTrust: number }[] = []
    const createItems: BatchCreateTripleItem[] = []
    /** Indices of items[] that are 'create-circle', kept in order so
     *  we can map them back to their amounts after the atom batch. */
    const circleIndices: number[] = []
    items.forEach((item, i) => {
      const amount = getAmount(i)
      if (
        item.kind === 'create-triple' &&
        item.subjectId &&
        item.predicateId &&
        item.objectId
      ) {
        createItems.push({
          subjectId: item.subjectId,
          predicateId: item.predicateId,
          objectId: item.objectId,
          signalTrust: amount,
        })
      } else if (item.kind === 'create-circle' && item.circleDraft) {
        circleIndices.push(i)
      } else {
        depositItems.push({ termId: item.termId, amountTrust: amount })
      }
    })

    let allOk = true

    if (depositItems.length > 0) {
      const r = await depositBatch(depositItems)
      if (!r.success) allOk = false
    }

    // Phase A — mint every queued circle atom in one tx, then derive
    // the membership + has_tag triples that reference the new atom ids.
    if (circleIndices.length > 0) {
      if (!authenticated || wallets.length === 0) {
        setCreateTripleResult({ success: false, error: 'No wallet connected' })
        return
      }
      if (!userAccountAtom.exists || !userAccountAtom.termId) {
        setCreateTripleResult({
          success: false,
          error:
            'Your Account atom is not yet on-chain. Make any deposit or certification first, then retry.',
        })
        return
      }

      setCreateTripleProcessing(true)
      setCreateTripleResult(null)
      try {
        const payloads: AtomIPFSPayload[] = circleIndices.map((idx) => {
          const draft = items[idx].circleDraft!
          return {
            name: draft.name,
            description: draft.description,
            image: '',
            // Sentinel URL — the protocol uses this string for atom
            // dedupe. `circle:<name>` keeps it human-readable in the
            // indexer and avoids collisions with content URLs.
            url: `circle:${draft.name}`,
          }
        })

        const atomBatch = await executeCreateAtomsBatch(
          wallets[0],
          payloads,
          pinThing,
        )
        if (!atomBatch.success) {
          setCreateTripleResult({
            success: false,
            error: atomBatch.error ?? 'Circle atom creation failed',
          })
          return
        }

        // For each circle atom, push membership + has_tag triples into
        // the existing createItems batch — single triple-batch tx mints
        // them all together (1 + N per circle).
        const userAtomId = userAccountAtom.termId
        circleIndices.forEach((idx, i) => {
          const result = atomBatch.results[i]
          const atomId = result?.atomId
          if (!atomId) return
          const item = items[idx]
          const draft = item.circleDraft!
          const amount = getAmount(idx)

          // Membership: account → MEMBER_OF → circle
          createItems.push({
            subjectId: userAtomId,
            predicateId: PREDICATE_IDS.MEMBER_OF,
            objectId: atomId,
            signalTrust: amount,
          })

          // Topic tags: circle → has_tag → topic (one per selected topic)
          for (const topicSlug of draft.topicIds) {
            const topicAtomId = TOPIC_ATOM_IDS[topicSlug]
            if (!topicAtomId) continue
            createItems.push({
              subjectId: atomId,
              predicateId: HAS_TAG_PREDICATE_ID,
              objectId: topicAtomId,
              signalTrust: amount,
            })
          }
        })
      } catch (err) {
        setCreateTripleResult({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        })
        setCreateTripleProcessing(false)
        return
      }
    }

    // Phase B — single triple-batch tx (covers both pre-existing
    // create-triple items and newly-derived circle triples).
    if (createItems.length > 0) {
      if (!authenticated || wallets.length === 0) {
        setCreateTripleResult({
          success: false,
          error: 'No wallet connected',
        })
        allOk = false
      } else {
        setCreateTripleProcessing(true)
        setCreateTripleResult(null)
        try {
          const r = await executeCreateTriplesBatch(wallets[0], createItems)
          setCreateTripleResult(r)
          if (!r.success) {
            allOk = false
          } else {
            // Group panels read these queries, refresh after a join so
            // the user shows up immediately.
            qc.invalidateQueries({ queryKey: ['groups-list'] })
            qc.invalidateQueries({ queryKey: ['group-detail'] })
          }
        } finally {
          setCreateTripleProcessing(false)
        }
      }
    }

    if (allOk) onSuccess()
  }, [
    items,
    weights,
    customValues,
    depositBatch,
    authenticated,
    wallets,
    qc,
    onSuccess,
    userAccountAtom.exists,
    userAccountAtom.termId,
    pinThing,
  ])

  const handleClose = () => {
    reset()
    setCreateTripleResult(null)
    setCreateTripleProcessing(false)
    onClose()
  }

  const formatTrust = (val: number): string => {
    if (val === 0) return '0'
    return parseFloat(val.toFixed(4)).toString()
  }

  // Combine the deposit and create-triple states so the existing JSX
  // "form / processing / success / error" branches stay coherent
  // regardless of which contract path the cart items took. The local
  // `processing` / `txResult` shadow the deposit-only versions so the
  // rendering tree below doesn't have to know about the split.
  const processing = depositProcessing || createTripleProcessing
  const txResult = (() => {
    if (depositTxResult && !depositTxResult.success) return depositTxResult
    if (createTripleResult && !createTripleResult.success)
      return {
        success: false as const,
        error: createTripleResult.error,
      }
    if (depositTxResult?.success) return depositTxResult
    if (createTripleResult?.success)
      return {
        success: true as const,
        txHash: createTripleResult.txHash,
      }
    return null
  })()
  const isFormState = !txResult && !processing

  if (!isOpen || items.length === 0) return null

  return createPortal(
    <div
      className={`wm-overlay ${processing ? 'wm-processing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !processing) handleClose()
      }}
    >
      <div className="wm-content">
        <div className="wm-body">
          {/* Description — form state only */}
          {isFormState && (
            <p className="wm-description">
              Set your deposit amount and confirm.
            </p>
          )}

          {/* Triplet cards — always visible except on success */}
          {!txResult?.success && (
            <div className="wm-triplets-list">
              {items.map((item, index) => {
                const color = item.intentionColor || '#888'
                const isCustom = !!customValues[index]?.trim()
                const currentValue = isCustom
                  ? customValues[index] || ''
                  : (weights[index] ?? 0.5)

                return (
                  <div key={item.id} className="wm-triplet-card">
                    {/* Centered triplet text */}
                    <div className="wm-triplet-text">
                      {item.favicon && (
                        <img
                          src={item.favicon}
                          alt=""
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display =
                              'none'
                          }}
                        />
                      )}
                      <span style={{ fontWeight: 500 }}>{item.title}</span>
                      <span
                        style={{
                          ...intentionBadgeStyle(color),
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {item.intention}
                      </span>
                    </div>

                    {/* Amount input + pills — form state only */}
                    {isFormState && (
                      <div className="wm-amount-row">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={currentValue}
                          onChange={(e) => {
                            handleWeightSelect(index, 0) // clear preset
                            handleCustomChange(index, e.target.value)
                          }}
                          onFocus={(e) => {
                            handleCustomChange(index, String(currentValue))
                            e.target.select()
                          }}
                          className="wm-amount-input"
                          placeholder="0.01"
                          disabled={processing}
                        />
                        <div className="wm-pills">
                          {WEIGHT_OPTIONS.map((w) => (
                            <button
                              key={w}
                              onClick={() => handleWeightSelect(index, w)}
                              className={`wm-pill ${!isCustom && weights[index] === w ? 'wm-pill-active' : ''}`}
                              disabled={processing}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* On-chain verification warning — form state only */}
          {isFormState && missingTripleIds.length > 0 && (
            <div className="wm-error-section" style={{ marginTop: 12 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ margin: '0 0 4px' }}
                >
                  Triple verification failed
                </p>
                <p className="text-xs text-destructive" style={{ margin: 0 }}>
                  {missingTripleIds.length} item
                  {missingTripleIds.length > 1 ? 's' : ''} reference a triple
                  that does not exist on-chain. Refusing to deposit — the cart
                  data may be stale or the indexer may be out of sync. Remove
                  affected items and retry.
                </p>
              </div>
            </div>
          )}

          {/* Cost summary — form state only */}
          {isFormState && (
            <div className="wm-cost-summary">
              <div className="wm-cost-row">
                <span>Deposit</span>
                <span style={{ fontWeight: 500 }}>
                  {formatTrust(breakdown.deposit)} TRUST
                </span>
              </div>
              {breakdown.totalFees > 0 && (
                <>
                  <div className="wm-cost-divider" />
                  <div
                    className="wm-cost-row"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    <span>Fees</span>
                    <span>{formatTrust(breakdown.totalFees)} TRUST</span>
                  </div>
                  {breakdown.sofiaFixedFee > 0 && (
                    <div
                      className="wm-cost-row"
                      style={{ fontSize: 11, paddingLeft: 12, opacity: 0.6 }}
                    >
                      <span>Sofia fixed fee</span>
                      <span>{formatTrust(breakdown.sofiaFixedFee)} TRUST</span>
                    </div>
                  )}
                  {breakdown.sofiaPercentFee > 0 && (
                    <div
                      className="wm-cost-row"
                      style={{ fontSize: 11, paddingLeft: 12, opacity: 0.6 }}
                    >
                      <span>Sofia % fee</span>
                      <span>
                        {formatTrust(breakdown.sofiaPercentFee)} TRUST
                      </span>
                    </div>
                  )}
                  <div className="wm-cost-divider" />
                  <div className="wm-cost-row wm-cost-total">
                    <span>Total</span>
                    <span>{formatTrust(breakdown.totalEstimate)} TRUST</span>
                  </div>
                </>
              )}
              <div
                className={`wm-cost-row wm-cost-balance ${balNum < breakdown.totalEstimate ? 'wm-cost-insufficient' : ''}`}
              >
                <span>Balance</span>
                <span>
                  {balance
                    ? `${formatTrust(parseFloat(balance))} TRUST`
                    : '...'}
                </span>
              </div>
              <p className="wm-cost-note">* Estimated — actual may vary</p>
              {/* Surface the contract the wallet popup will sign against, so
                  a compromised bundle that swaps SOFIA_PROXY_ADDRESS can be
                  caught by reading the address against a known reference. */}
              <div
                className="wm-cost-row"
                style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}
              >
                <span>Signing against</span>
                <a
                  href={`${EXPLORER_URL}/address/${SOFIA_PROXY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: 'monospace' }}
                >
                  {SOFIA_PROXY_ADDRESS.slice(0, 6)}…
                  {SOFIA_PROXY_ADDRESS.slice(-4)} ↗
                </a>
              </div>
            </div>
          )}

          {/* Success state */}
          {txResult?.success && (
            <div className="wm-success-card">
              <div className="wm-success-glow" />
              <div className="wm-success-inner">
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Transaction
                  <br />
                  Validated
                </p>
                <p
                  className="text-sm text-muted-foreground"
                  style={{ margin: 0 }}
                >
                  {items.length} deposit{items.length > 1 ? 's' : ''} submitted
                  successfully
                </p>
                {txResult.txHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${txResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                    style={{ marginTop: 4 }}
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {txResult && !txResult.success && !processing && (
            <div className="wm-error-section">
              <span style={{ fontSize: 18 }}>❌</span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ margin: '0 0 4px' }}
                >
                  Transaction Failed
                </p>
                <p className="text-xs text-destructive" style={{ margin: 0 }}>
                  {txResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Processing state */}
          {processing && !txResult?.success && (
            <div className="wm-processing-section">
              <SofiaLoader size={56} />
              <div className="wm-processing-text">
                <p className="text-sm font-medium" style={{ margin: 0 }}>
                  Creating
                </p>
                <p
                  className="text-xs text-muted-foreground"
                  style={{ margin: 0 }}
                >
                  {items.length > 1
                    ? 'Batch deposit in progress...'
                    : 'Deposit in progress...'}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="wm-actions">
            <button className="wm-btn wm-btn-cancel" onClick={handleClose}>
              {txResult ? 'Close' : 'Cancel'}
            </button>
            {!txResult && (
              <button
                className="wm-btn wm-btn-submit"
                onClick={handleSubmit}
                disabled={
                  processing ||
                  verifying ||
                  missingTripleIds.length > 0 ||
                  totalDeposit <= 0 ||
                  balNum < breakdown.totalEstimate
                }
              >
                {processing
                  ? 'Submitting...'
                  : verifying
                    ? 'Verifying on-chain...'
                    : `Submit ${items.length} Deposit${items.length > 1 ? 's' : ''}`}
              </button>
            )}
            {txResult && !txResult.success && !processing && (
              <button
                className="wm-btn wm-btn-submit"
                onClick={() => {
                  reset()
                  setCreateTripleResult(null)
                  handleSubmit()
                }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
