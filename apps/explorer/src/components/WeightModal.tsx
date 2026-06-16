import { useState, useEffect, useMemo, useCallback } from 'react'
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
  ATOM_ID_TO_TOPIC,
  HAS_TAG_PREDICATE_ID,
  TOPIC_ATOM_IDS,
} from '../config/atomIds'
import { SOFIA_TOPICS } from '../config/taxonomy'
import { TopicPill, VerbPill } from './profile/FeedPills'
import {
  executeCreateTriplesBatch,
  MIN_SIGNAL_TRUST,
  type BatchCreateTripleItem,
  type CreateTripleResult,
} from '../services/tripleCreationService'
import { redeemAtom } from '../services/redeemService'
import { clearOptimisticPosition } from '../lib/realtime/derivations'
import {
  executeCreateAtomsBatch,
  type AtomIPFSPayload,
  type PinThingFn,
} from '../services/atomCreationService'
import SofiaLoader from './ui/SofiaLoader'
import FeedCardView from './feed/FeedCardView'
import './styles/weight-modal.css'
import './styles/cart-amplify.css'
import './styles/feed-card.css'

/** Deposit strength presets — ported 1:1 from the extension's Amplify
 *  ticket (Light / Medium / Strong). Medium (0.5) is the default and
 *  matches the historical per-item default. */
const WEIGHT_TIERS = [
  { id: 'light', label: 'Light', value: 0.01 },
  { id: 'medium', label: 'Medium', value: 0.5 },
  { id: 'strong', label: 'Strong', value: 1 },
] as const

const TOPIC_BY_ID = new Map(SOFIA_TOPICS.map((t) => [t.id, t]))

/** Turn a raw wallet/viem error into a single human-readable line — the
 *  unmodified message dumps chain id, calldata and contract address, which
 *  overflows the panel and means nothing to the user. */
function humanizeTxError(raw?: string): string {
  if (!raw) return 'Something went wrong. Please try again.'
  const msg = String(raw)
  if (
    /user rejected|rejected the request|user denied|denied transaction/i.test(
      msg,
    )
  )
    return 'You rejected the transaction in your wallet.'
  if (/insufficient funds|exceeds balance|insufficient balance/i.test(msg))
    return 'Insufficient balance to cover this deposit.'
  // Otherwise surface just the first line / sentence, trimmed.
  const firstLine = msg.split('\n')[0].split('. ')[0].trim()
  return firstLine.length > 160 ? `${firstLine.slice(0, 157)}…` : firstLine
}

/** Resolve the topic a cart item ultimately points to, if any — same
 *  three paths the old CartDrawer covered (direct topic-atom deposit,
 *  Context-Manager nested triple `context-<cert>-<slug>`, has_tag triple
 *  whose objectId is the topic atom). Returns the taxonomy entry so the
 *  row can show the topic's icon + label instead of a raw context string. */
function resolveTopic(item: CartItem) {
  const direct = ATOM_ID_TO_TOPIC.get(item.termId)
  if (direct) return TOPIC_BY_ID.get(direct) ?? null
  if (item.id.startsWith('context-')) {
    const parts = item.id.split('-')
    const slug = parts[parts.length - 1]
    const meta = TOPIC_BY_ID.get(slug)
    if (meta) return meta
  }
  if (item.objectId) {
    const slug = ATOM_ID_TO_TOPIC.get(item.objectId)
    if (slug) return TOPIC_BY_ID.get(slug) ?? null
  }
  return null
}

interface WeightModalProps {
  isOpen: boolean
  items: CartItem[]
  onClose: () => void
  onSuccess: () => void
  /** Remove a single item from the cart. Renders a per-row remove
   *  control in the form state when provided. */
  onRemove?: (id: string) => void
}

export default function WeightModal({
  isOpen,
  items,
  onClose,
  onSuccess,
  onRemove,
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
        .filter(
          (it) =>
            (it.kind ?? 'deposit') === 'deposit' &&
            it.kind !== 'redeem' &&
            // Platform atom vaults (Invest) are atoms, not triples — skip
            // the triple-existence check or it always fails.
            it.intention !== 'Invest' &&
            !it.id.startsWith('invest-'),
        )
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

  // Redeem rows recover TRUST — they don't deposit. Excluding them keeps the
  // ledger total (and the balance-gated submit button) from charging a
  // phantom 0.5 default per redeem row.
  const totalDeposit = useMemo(() => {
    return items.reduce(
      (sum, it, i) => (it.kind === 'redeem' ? sum : sum + getAmount(i)),
      0,
    )
  }, [items, weights, customValues])

  const balNum = balance ? parseFloat(balance) : 0

  // Each cart item maps to one or more on-chain operations:
  //   - 'deposit' / 'create-triple' → 1 deposit, 0 or 1 triple creation
  //   - 'create-circle' → 1 + N triples (membership + has_tag per topic)
  // Both counts feed `estimateDepositCost` so the Sofia fixed fee and the
  // protocol's per-triple creation cost are reflected in the modal total
  // (otherwise the wallet popup shows a much higher number than the UI).
  const { depositCount, tripleCreateCount } = useMemo(() => {
    let deposits = 0
    let creates = 0
    for (const item of items) {
      if (item.kind === 'redeem') {
        // Redeems don't deposit — skip from cost estimate.
      } else if (item.kind === 'create-circle' && item.circleDraft) {
        const validTopics = item.circleDraft.topicIds.filter(
          (slug) => !!TOPIC_ATOM_IDS[slug],
        )
        const tripleCount = 1 + validTopics.length
        deposits += tripleCount
        creates += tripleCount
      } else if (item.kind === 'create-triple') {
        deposits += 1
        creates += 1
      } else {
        deposits += 1
      }
    }
    return { depositCount: deposits, tripleCreateCount: creates }
  }, [items])

  const breakdown = useMemo(() => {
    const costEstimate =
      estimate?.(totalDeposit, { depositCount, tripleCreateCount }) ?? null
    return {
      deposit: totalDeposit,
      sofiaFixedFee: costEstimate?.sofiaFixedFee ?? 0,
      sofiaPercentFee: costEstimate?.sofiaPercentFee ?? 0,
      tripleCreationCost: costEstimate?.tripleCreationCost ?? 0,
      totalFees: costEstimate?.totalFees ?? 0,
      totalEstimate: costEstimate?.totalEstimate ?? totalDeposit,
    }
  }, [totalDeposit, depositCount, tripleCreateCount, estimate])

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

  // Apply one tier to every row at once — the Amplify "QUICK" presets.
  const handleApplyAll = (value: number) => {
    setWeights(new Array(items.length).fill(value))
    setCustomValues(new Array(items.length).fill(''))
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
    const redeemTermIds: string[] = []
    /** Indices of items[] that are 'create-circle', kept in order so
     *  we can map them back to their amounts after the atom batch. */
    const circleIndices: number[] = []
    items.forEach((item, i) => {
      const amount = getAmount(i)
      if (item.kind === 'redeem') {
        redeemTermIds.push(item.termId)
      } else if (
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

    // Redeem: recover TRUST from each cert vault one by one. `redeemAtom`
    // throws on wallet rejection / revert (it doesn't catch internally), so
    // the loop is wrapped — otherwise a rejected popup leaves the panel stuck
    // with no error. `createTripleProcessing` drives the spinner since redeem
    // takes neither the deposit nor the create-triple path.
    if (redeemTermIds.length > 0) {
      if (!authenticated || wallets.length === 0) {
        setCreateTripleResult({ success: false, error: 'No wallet connected' })
        return
      }
      const wallet = wallets[0]
      let lastRedeemHash: string | undefined
      setCreateTripleProcessing(true)
      setCreateTripleResult(null)
      try {
        for (const termId of redeemTermIds) {
          const r = await redeemAtom(wallet, termId)
          if (!r.success) {
            allOk = false
            setCreateTripleResult({
              success: false,
              error: r.error ?? 'Redeem failed',
            })
          } else {
            if (r.txHash) lastRedeemHash = r.txHash
            clearOptimisticPosition(qc, wallet.address, termId)
          }
        }
      } catch (err) {
        allOk = false
        setCreateTripleResult({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        })
      } finally {
        setCreateTripleProcessing(false)
      }
      if (allOk) {
        qc.invalidateQueries({ queryKey: ['user-onchain-profile'] })
        // A redeem-only cart has no deposit/create result to drive the
        // success screen — synthesize one so the panel shows "validated"
        // and the Close tap hands off to onSuccess (clears the cart).
        if (
          depositItems.length === 0 &&
          createItems.length === 0 &&
          circleIndices.length === 0
        ) {
          setCreateTripleResult({ success: true, txHash: lastRedeemHash })
        }
      }
    }

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
        // them all together (1 + N per circle). The amount the user
        // entered is treated as the TOTAL signal deposit for the circle,
        // split evenly across the derived triples (membership + each
        // valid has_tag). Floors at `MIN_SIGNAL_TRUST` so each individual
        // deposit clears the protocol minimum.
        const userAtomId = userAccountAtom.termId
        circleIndices.forEach((idx, i) => {
          const result = atomBatch.results[i]
          const atomId = result?.atomId
          if (!atomId) return
          const item = items[idx]
          const draft = item.circleDraft!
          const totalAmount = getAmount(idx)

          const validTopicIds = draft.topicIds.filter(
            (slug) => !!TOPIC_ATOM_IDS[slug],
          )
          const tripleCount = 1 + validTopicIds.length
          const perTripleAmount = Math.max(
            totalAmount / tripleCount,
            MIN_SIGNAL_TRUST,
          )

          // Membership: account → MEMBER_OF → circle
          createItems.push({
            subjectId: userAtomId,
            predicateId: PREDICATE_IDS.MEMBER_OF,
            objectId: atomId,
            signalTrust: perTripleAmount,
          })

          // Topic tags: circle → has_tag → topic (one per selected topic)
          for (const topicSlug of validTopicIds) {
            const topicAtomId = TOPIC_ATOM_IDS[topicSlug]
            createItems.push({
              subjectId: atomId,
              predicateId: HAS_TAG_PREDICATE_ID,
              objectId: topicAtomId,
              signalTrust: perTripleAmount,
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

    // NB: cart clearing is deferred to `handleClose` (the post-success
    // "Close" tap). The panel now lives inside the cart aside, whose
    // visibility is tied to `cart.isOpen` — and the cart auto-closes when
    // it empties (useCart). Clearing here would collapse the aside before
    // the success screen could render. We keep `allOk` so success state
    // is reflected, and hand off the clear when the user dismisses.
    void allOk
  }, [
    items,
    weights,
    customValues,
    depositBatch,
    authenticated,
    wallets,
    qc,
    userAccountAtom.exists,
    userAccountAtom.termId,
    pinThing,
  ])

  const handleClose = () => {
    // Capture before reset() nulls the result. On success the dismiss
    // doubles as the cart-clear (onSuccess), which empties the cart and
    // lets the aside auto-close. On cancel we just close, items intact.
    const succeeded = txResult?.success ?? false
    reset()
    setCreateTripleResult(null)
    setCreateTripleProcessing(false)
    if (succeeded) onSuccess()
    else onClose()
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

  // Rendered inline inside the cart aside (the sidepanel) — no portal,
  // no overlay. The aside owns the slide-in shell and scrolling; this is
  // just the panel body: basket + weights + cost + actions + states.
  return (
    <div className="amp b3">
      <div className="b3-ticket">
        <div className="b3-body">
          {isFormState && (
            <>
              <div className="b3-headline">
                <span className="b3-drop">A</span>
                <h1 className="b3-h1">mplify.</h1>
              </div>

              {items.length > 1 && (
                <div className="b3-presets">
                  <span className="b3-presets-k">QUICK</span>
                  {WEIGHT_TIERS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="b3-preset"
                      disabled={processing}
                      onClick={() => handleApplyAll(t.value)}
                    >
                      All · {t.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="b3-basket">
                {items.map((item, index) => {
                  const rowTrust = getAmount(index)
                  const topicMeta = resolveTopic(item)
                  const isRedeem = item.kind === 'redeem'

                  // Extract real domain from favicon URL — handles both the
                  // Google favicon service (?domain=example.com) and direct
                  // favicon URLs (e.g. platform favicons served directly).
                  const faviconDomain = (() => {
                    if (!item.favicon) return ''
                    try {
                      const u = new URL(item.favicon)
                      // Google S2 service: extract the domain query param
                      const qd = u.searchParams.get('domain')
                      if (qd) return qd
                      // Direct favicon URL: use its hostname
                      return u.hostname.replace(/^www\./, '')
                    } catch {
                      return ''
                    }
                  })()

                  // Verb/topic chips built AFTER badgeTopic resolution so topic
                  // pills work for circle-feed vote items too.
                  // (computed after badgeTopic below)

                  // Resolve the topic for the pill below the title. resolveTopic
                  // returns null for circle-feed vote items (termId is a context
                  // triple, not a topic atom), so fall back to matching the
                  // intention label against the taxonomy.
                  const badgeTopic =
                    topicMeta ??
                    (() => {
                      const byLabel = [...TOPIC_BY_ID.values()].find(
                        (t) =>
                          t.label.toLowerCase() ===
                          item.intention?.toLowerCase(),
                      )
                      return byLabel ?? null
                    })()

                  // Topic pill below the title (no favicon overlay badge).
                  const topics = badgeTopic
                    ? [
                        {
                          id: badgeTopic.id,
                          label: badgeTopic.label,
                          color: badgeTopic.color,
                        },
                      ]
                    : []
                  const verbs =
                    !badgeTopic && item.intention
                      ? [{ label: item.intention, color: item.intentionColor }]
                      : []

                  return (
                    <div
                      className={`b3-row is-on${isRedeem ? ' b3-row--redeem' : ''}`}
                      key={item.id}
                    >
                      {/* Remove control */}
                      <button
                        className="b3-check"
                        type="button"
                        aria-label="Remove from cart"
                        disabled={processing}
                        onClick={() => onRemove?.(item.id)}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M5 12l4 4L19 6"
                            stroke="var(--ds-on-accent)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {/* xs FeedCardView — favicon thumbnail + topic badge + title + pills */}
                      <div className="b3-row-card">
                        <FeedCardView
                          size="xs"
                          handle=""
                          when=""
                          title={item.title}
                          domain={faviconDomain}
                          verbs={verbs}
                          topics={topics}
                          up={-1}
                          down={-1}
                          thumbnailSrc={item.favicon || undefined}
                        />
                      </div>

                      {isRedeem ? (
                        <div className="b3-row-trust b3-row-trust--redeem">
                          <span className="b3-row-trust-unit">REDEEM</span>
                        </div>
                      ) : (
                        <div className="b3-row-trust">
                          <span className="b3-row-trust-val">
                            {formatTrust(rowTrust)}
                          </span>
                          <span className="b3-row-trust-unit">TRUST</span>
                        </div>
                      )}

                      {isRedeem ? (
                        <div className="b3-tiers b3-tiers--redeem">
                          <span className="b3-tier-label">
                            All shares returned
                          </span>
                        </div>
                      ) : (
                        <div className="b3-tiers" role="radiogroup">
                          {WEIGHT_TIERS.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              role="radio"
                              aria-checked={weights[index] === t.value}
                              className={`b3-tier${weights[index] === t.value ? ' is-on' : ''}`}
                              disabled={processing}
                              onClick={() => handleWeightSelect(index, t.value)}
                            >
                              <span className="b3-tier-label">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* On-chain verification warning */}
              {missingTripleIds.length > 0 && (
                <div className="wm-error-section" style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ margin: '0 0 4px' }}
                    >
                      Triple verification failed
                    </p>
                    <p
                      className="text-xs text-destructive"
                      style={{ margin: 0 }}
                    >
                      {missingTripleIds.length} item
                      {missingTripleIds.length > 1 ? 's' : ''} reference a
                      triple that does not exist on-chain. Refusing to deposit —
                      the cart data may be stale or the indexer may be out of
                      sync. Remove affected items and retry.
                    </p>
                  </div>
                </div>
              )}

              {/* Ledger — deposit + fees + total + balance + signing target */}
              <div className="b3-ledger">
                <div className="b3-ledger-row">
                  <span>Subtotal</span>
                  <span>{formatTrust(breakdown.deposit)} TRUST</span>
                </div>
                {breakdown.totalFees > 0 && (
                  <div className="b3-ledger-row">
                    <span>Fees</span>
                    <span>{formatTrust(breakdown.totalFees)} TRUST</span>
                  </div>
                )}
                <div className="b3-ledger-row b3-ledger-total">
                  <span>Total deposit</span>
                  <span>{formatTrust(breakdown.totalEstimate)} TRUST</span>
                </div>
                <div
                  className={`b3-ledger-row b3-ledger-row--muted${balNum < breakdown.totalEstimate ? ' wm-cost-insufficient' : ''}`}
                >
                  <span>Your balance</span>
                  <span>
                    {balance
                      ? `${formatTrust(parseFloat(balance))} TRUST`
                      : '…'}
                  </span>
                </div>
                {/* Surface the contract the wallet popup will sign against,
                    so a compromised bundle that swaps SOFIA_PROXY_ADDRESS can
                    be caught by reading the address against a known ref. */}
                <div className="b3-ledger-row b3-ledger-row--muted">
                  <span>Signing against</span>
                  <a
                    href={`${EXPLORER_URL}/address/${SOFIA_PROXY_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    {SOFIA_PROXY_ADDRESS.slice(0, 6)}…
                    {SOFIA_PROXY_ADDRESS.slice(-4)} ↗
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Success — the peach "Transaction validated" reward takeover. */}
          {txResult?.success && (
            <div className="wm-reward">
              <div className="wm-reward-rays" aria-hidden="true" />
              <div className="wm-reward-inner">
                <span className="wm-reward-eyebrow">Thank you</span>
                <h2 className="wm-reward-title">
                  Transaction
                  <br />
                  validated
                </h2>
                <p className="wm-reward-msg">One more truth, on-chain.</p>
                <div className="wm-reward-meta">
                  <span>
                    {items.length} signal{items.length > 1 ? 's' : ''} recorded
                  </span>
                  {txResult.txHash && (
                    <a
                      href={`${EXPLORER_URL}/tx/${txResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wm-reward-link"
                    >
                      View on Explorer ↗
                    </a>
                  )}
                </div>
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
                  {humanizeTxError(txResult.error)}
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

          {/* Footer actions */}
          <div className="b3-actions">
            <button className="b3-btn" type="button" onClick={handleClose}>
              {txResult ? 'Close' : 'Cancel'}
            </button>
            {!txResult && (
              <button
                className="b3-btn b3-btn--primary"
                type="button"
                onClick={handleSubmit}
                disabled={
                  processing ||
                  verifying ||
                  missingTripleIds.length > 0 ||
                  totalDeposit <= 0 ||
                  balNum < breakdown.totalEstimate
                }
              >
                {processing ? 'Signing…' : verifying ? 'Verifying…' : 'Sign'}
                {!processing && !verifying && (
                  <span className="b3-btn-amt">
                    {formatTrust(breakdown.totalEstimate)} T
                  </span>
                )}
              </button>
            )}
            {txResult && !txResult.success && !processing && (
              <button
                className="b3-btn b3-btn--primary"
                type="button"
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
    </div>
  )
}
