import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { usePinThingMutation } from '@0xsofia/graphql'
import { useDeposit } from '../hooks/useDeposit'
import { useFeeEstimate } from '../hooks/useFeeEstimate'
import { useUserAccountAtom } from '../hooks/useUserAccountAtom'
import { useTripleVerification } from '../hooks/useTripleVerification'
import { useSponsoredWrite } from '../hooks/useSponsoredWrite'
import { removeCertsFromProfileCache } from '../hooks/useUserOnChainProfile'
import {
  removeAttributesFromCache,
  addAttributesToCache,
} from '../hooks/useUserAttributes'
import type { UserAttribute } from '../services/userAttributesService'
import { getAttributeByLabel } from '@0xsofia/taxonomy'
import type { CartItem } from '../hooks/useCart'
import { EXPLORER_URL, PREDICATE_IDS, SOFIA_PROXY_ADDRESS } from '../config'
import { addOptimisticTrust } from '../lib/realtime/optimisticTrust'
import {
  ATOM_ID_TO_TOPIC,
  CANONICAL_PREDICATE_IDS,
  HAS_TAG_PREDICATE_ID,
  TOPIC_ATOM_IDS,
} from '../config/atomIds'
import {
  markPositionsAdded,
  markPositionsExited,
  pendingPosition,
  userPositionsKey,
} from '../lib/realtime/optimisticPositions'
import type {
  MarketPosition,
  UserPositionsResult,
} from '../services/userPositionsService'
import { SOFIA_TOPICS } from '../config/taxonomy'
import { TopicPill, VerbPill } from './profile/FeedPills'
import {
  executeCreateTriplesBatch,
  MIN_SIGNAL_TRUST,
  type BatchCreateTripleItem,
  type CreateTripleResult,
} from '../services/tripleCreationService'
import {
  redeemAtom,
  redeemLegs,
  REDEEM_BATCH_SIZE,
  type RedeemLeg,
  type RedeemPercent,
} from '../services/redeemService'
import type { BatchDepositItem } from '../services/depositService'
import { clearOptimisticPosition } from '../lib/realtime/derivations'
import {
  executeCreateAtomsBatch,
  type AtomIPFSPayload,
  type PinThingFn,
} from '../services/atomCreationService'
import { ensureProxyApproved } from '../services/proxyApprovalService'
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

// A circle mints a dedicated `{owner} | circle_owner | {circle}` triple so the
// group-api can resolve the owner deterministically. Only when the predicate
// atom is configured (minted) — 0 otherwise, so the batch and the cost
// estimate stay in lockstep. See PREDICATE_IDS.CIRCLE_OWNER.
const OWNER_TRIPLE_COUNT = PREDICATE_IDS.CIRCLE_OWNER ? 1 : 0

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

/** Rows that take TRUST out instead of depositing */
const isExitItem = (it: CartItem) =>
  it.kind === 'redeem' || it.kind === 'redeem-batch'

/** depositBatch items per tx — the chain caps a tx at ~32M gas */
const DEPOSIT_TX_SIZE = 80

const legKey = (l: { termId: string; curveId: bigint | string }) =>
  `${l.termId.toLowerCase()}:${String(l.curveId)}`

const toWei = (trust: number) => BigInt(Math.floor(trust * 1e18))

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
  // Every account: a Recommend-only cart is free (write-relayer)
  const sponsored = useSponsoredWrite(items)
  const qc = useQueryClient()
  /** What already went through in this cart (mined txs): skipped on a retry
   *  so nothing is exited or deposited twice, dropped from the cart on close */
  const settledRef = useRef({
    items: new Set<string>(),
    legs: new Set<string>(),
  })
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
            !isExitItem(it) &&
            // Oppose deposits target the counter vault, not a triple id
            it.side !== 'oppose' &&
            // Platform atom vaults (platform positions) are atoms, not
            // triples — skip the triple-existence check or it always fails.
            it.intention !== 'Invest' &&
            it.intention !== 'Take position' &&
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
      (id) => verifiedTriples.get(id.toLowerCase())?.exists === false,
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
      setCustomValues(
        items.map((it) =>
          it.presetAmount ? String(Number(it.presetAmount.toFixed(4))) : '',
        ),
      )
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
      (sum, it, i) => (isExitItem(it) ? sum : sum + getAmount(i)),
      0,
    )
  }, [items, weights, customValues])

  // A redeem-only cart deposits nothing (totalDeposit === 0) yet is a valid,
  // signable action — it recovers TRUST. Track it so the submit button isn't
  // gated by the `totalDeposit <= 0` "nothing to do" guard below.
  const hasRedeem = useMemo(() => items.some(isExitItem), [items])

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
      if (isExitItem(item)) {
        // Redeems don't deposit — skip from cost estimate.
      } else if (item.kind === 'create-circle' && item.circleDraft) {
        const validTopics = item.circleDraft.topicIds.filter(
          (slug) => !!TOPIC_ATOM_IDS[slug],
        )
        const tripleCount = 1 + OWNER_TRIPLE_COUNT + validTopics.length
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
    const settled = settledRef.current
    const depositItems: BatchDepositItem[] = []
    /** Cart row behind each deposit / create (null: derived triple) */
    const depositSources: CartItem[] = []
    const createSources: (CartItem | null)[] = []
    const createItems: BatchCreateTripleItem[] = []
    const redeemItems: { termId: string; percent?: RedeemPercent }[] = []
    /** Batched exits (a migration) — run first, the rest re-deposits */
    const exitLegs: RedeemLeg[] = []
    const exitRowIds: string[] = []
    /** Indices of items[] that are 'create-circle', kept in order so
     *  we can map them back to their amounts after the atom batch. */
    const circleIndices: number[] = []
    /** Indices of 'create-skill' items — mint skill/tool atom then triple. */
    const skillIndices: number[] = []
    /** Indices of 'create-context' items — mint the taxonomy context atom (if
     *  missing) then the [cert → in_context_of → context] triple. */
    const contextIndices: number[] = []
    items.forEach((item, i) => {
      if (settled.items.has(item.id)) return
      const amount = getAmount(i)
      if (item.kind === 'redeem-batch') {
        exitRowIds.push(item.id)
        for (const l of item.exitLegs ?? []) {
          if (settled.legs.has(legKey(l))) continue
          exitLegs.push({
            termId: l.termId,
            curveId: BigInt(l.curveId),
            shares: BigInt(l.shares),
          })
        }
      } else if (item.kind === 'redeem') {
        redeemItems.push({
          termId: item.termId,
          percent: item.redeemPercent,
        })
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
          curveId: item.curveId ? BigInt(item.curveId) : undefined,
        })
        createSources.push(item)
      } else if (item.kind === 'create-circle' && item.circleDraft) {
        circleIndices.push(i)
      } else if (item.kind === 'create-skill' && item.skillDraft) {
        skillIndices.push(i)
      } else if (item.kind === 'create-context' && item.contextDraft) {
        contextIndices.push(i)
      } else {
        depositItems.push({
          termId: item.termId,
          amountTrust: amount,
          curveId: item.curveId ? BigInt(item.curveId) : undefined,
        })
        depositSources.push(item)
      }
    })

    const wallet0 = wallets[0]?.address
    // My positions shows what a mined tx did right away (the indexer lags);
    // the overlay reconciles once these refetches see the indexed rows
    const scheduleReconcile = () => {
      for (const delay of [5_000, 15_000, 45_000]) {
        setTimeout(
          () =>
            void qc.invalidateQueries({
              queryKey: ['user-market-positions'],
            }),
          delay,
        )
      }
    }
    /** Positions opened / topped up by mined deposits */
    const showAdded = (
      sources: readonly CartItem[],
      amounts: readonly number[],
    ) => {
      if (!wallet0) return
      const indexed = new Map(
        (
          qc.getQueryData<UserPositionsResult>(userPositionsKey(wallet0))
            ?.positions ?? []
        ).map((p) => [p.termId.toLowerCase(), p]),
      )
      const added: MarketPosition[] = []
      sources.forEach((it, k) => {
        const amount = String(toWei(amounts[k]))
        const held = indexed.get(it.termId.toLowerCase())
        if (held) {
          // Top-up: the merge adds this on top of the indexed row
          added.push({ ...held, value: amount, deposited: amount })
          return
        }
        // New page-market position (tags and other claims show once indexed)
        if (
          it.predicateId !== CANONICAL_PREDICATE_IDS.recommends &&
          it.curveId !== 2
        )
          return
        added.push(
          pendingPosition({
            termId: it.termId,
            amountWei: BigInt(amount),
            title: it.title,
            image: it.favicon || null,
            objectTermId: it.objectId ?? null,
            predicateLabel: 'recommends',
            side: it.side,
          }),
        )
      })
      markPositionsAdded(qc, wallet0, added)
      scheduleReconcile()
    }

    // Free Recommends: the relayer publishes them, positions on this wallet
    if (sponsored.active && sponsored.request) {
      const rows = sponsored.request.recommendRows
      setCreateTripleProcessing(true)
      setCreateTripleResult(null)
      try {
        const r = await sponsored.submit()
        if (r.partial) {
          setCreateTripleResult({
            success: false,
            error:
              'Only part of it was published — check My positions before retrying.',
          })
          return
        }
        if (!r.dryRun)
          showAdded(
            rows,
            rows.map(() => r.deposit),
          )
        for (const it of items) settled.items.add(it.id)
        setCreateTripleResult({ success: true, txHash: r.txHashes.at(-1) })
      } catch (err) {
        setCreateTripleResult({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        })
      } finally {
        setCreateTripleProcessing(false)
      }
      return
    }

    // Deposits land on this wallet through the proxy: a wallet that never
    // approved it (first time, explorer only) does so once, before anything —
    // exits included — goes through
    const writesThroughProxy =
      depositItems.length +
        createItems.length +
        circleIndices.length +
        skillIndices.length +
        contextIndices.length >
      0
    if (writesThroughProxy && wallets[0]) {
      setCreateTripleProcessing(true)
      setCreateTripleResult(null)
      try {
        await ensureProxyApproved(wallets[0])
      } catch (err) {
        setCreateTripleResult({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        })
        return
      } finally {
        setCreateTripleProcessing(false)
      }
    }

    let allOk = true

    // Batched exits first (one redeemBatch per 100 legs). If one fails, stop:
    // the Recommends after it were meant to re-deposit what came back.
    if (exitLegs.length > 0) {
      if (!authenticated || wallets.length === 0) {
        setCreateTripleResult({ success: false, error: 'No wallet connected' })
        return
      }
      setCreateTripleProcessing(true)
      setCreateTripleResult(null)
      let lastExitHash: string | undefined
      try {
        for (let i = 0; i < exitLegs.length; i += REDEEM_BATCH_SIZE) {
          const chunk = exitLegs.slice(i, i + REDEEM_BATCH_SIZE)
          const r = await redeemLegs(wallets[0], chunk)
          if (r.success) {
            for (const l of chunk) settled.legs.add(legKey(l))
            if (wallet0) {
              markPositionsExited(
                qc,
                wallet0,
                chunk.map((l) => l.termId),
              )
              scheduleReconcile()
            }
          }
          if (!r.success) {
            setCreateTripleResult({
              success: false,
              error: `Exit stopped (${r.error ?? 'failed'}) — nothing was re-deposited.`,
            })
            return
          }
          if (r.txHash) lastExitHash = r.txHash
        }
      } catch (err) {
        setCreateTripleResult({
          success: false,
          error: `Exit stopped (${err instanceof Error ? err.message : String(err)}) — nothing was re-deposited.`,
        })
        return
      } finally {
        setCreateTripleProcessing(false)
      }
      for (const id of exitRowIds) settled.items.add(id)
      if (
        redeemItems.length === 0 &&
        depositItems.length === 0 &&
        createItems.length === 0 &&
        circleIndices.length === 0 &&
        skillIndices.length === 0 &&
        contextIndices.length === 0
      ) {
        setCreateTripleResult({ success: true, txHash: lastExitHash })
      }
    }

    // Redeem: recover TRUST from each cert vault one by one. `redeemAtom`
    // throws on wallet rejection / revert (it doesn't catch internally), so
    // the loop is wrapped — otherwise a rejected popup leaves the panel stuck
    // with no error. `createTripleProcessing` drives the spinner since redeem
    // takes neither the deposit nor the create-triple path.
    if (redeemItems.length > 0) {
      if (!authenticated || wallets.length === 0) {
        setCreateTripleResult({ success: false, error: 'No wallet connected' })
        return
      }
      const wallet = wallets[0]
      let lastRedeemHash: string | undefined
      const redeemedOk: string[] = []
      /** Full exits only — a partial exit keeps a position, so its row must
       *  stay in the profile / attributes caches. */
      const fullyExited: string[] = []
      let noopCount = 0
      setCreateTripleProcessing(true)
      setCreateTripleResult(null)
      try {
        for (const { termId, percent } of redeemItems) {
          const r = await redeemAtom(wallet, termId, undefined, percent)
          if (!r.success) {
            allOk = false
            setCreateTripleResult({
              success: false,
              error: r.error ?? 'Exit failed',
            })
          } else if (r.noop) {
            // No shares on any curve → nothing was redeemed. Don't treat this
            // as a real redemption: no cache drop, no synthetic success.
            noopCount++
          } else {
            if (r.txHash) lastRedeemHash = r.txHash
            redeemedOk.push(termId)
            for (const it of items) {
              if (it.kind === 'redeem' && it.termId === termId)
                settled.items.add(it.id)
            }
            if ((percent ?? 100) === 100) {
              clearOptimisticPosition(qc, wallet.address, termId)
              fullyExited.push(termId)
              markPositionsExited(qc, wallet.address, [termId])
              scheduleReconcile()
            }
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
      // Drop the redeemed certs from the profile cache immediately — the tx
      // passed, so the vault is empty. Don't invalidate/refetch here: that
      // races the indexer (still reporting the position for a few seconds)
      // and re-persists the stale row, so it reappears on reload. staleTime
      // reconciles on the next natural refetch once the indexer catches up.
      if (fullyExited.length > 0) {
        // A redeemed termId is either a URL cert (profile cache) or a
        // skill/tool declaration (attributes cache) — filter both; the one
        // that doesn't match is a no-op.
        removeCertsFromProfileCache(qc, fullyExited)
        removeAttributesFromCache(qc, fullyExited)
      }
      if (allOk) {
        // A redeem-only cart has no deposit/create result to drive the
        // success screen — synthesize one so the panel shows "validated"
        // and the Close tap hands off to onSuccess (clears the cart).
        if (
          depositItems.length === 0 &&
          createItems.length === 0 &&
          circleIndices.length === 0
        ) {
          if (redeemedOk.length > 0) {
            setCreateTripleResult({ success: true, txHash: lastRedeemHash })
          } else if (noopCount > 0) {
            // Every redeem found 0 shares — no wallet popup ever appeared.
            // Report it honestly instead of a phantom "validated".
            setCreateTripleResult({
              success: false,
              error:
                'Nothing to exit — you hold no position on this from this wallet.',
            })
          }
        }
      }
    }

    for (let k = 0; k < depositItems.length; k += DEPOSIT_TX_SIZE) {
      const chunk = depositItems.slice(k, k + DEPOSIT_TX_SIZE)
      const sources = depositSources.slice(k, k + DEPOSIT_TX_SIZE)
      const r = await depositBatch(chunk)
      if (!r.success) {
        allOk = false
        break
      }
      for (const it of sources) settled.items.add(it.id)
      showAdded(
        sources,
        chunk.map((d) => d.amountTrust),
      )
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
          const tripleCount = 1 + OWNER_TRIPLE_COUNT + validTopicIds.length
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

          // Ownership: account → circle_owner → circle. The deterministic
          // signal the group-api reads to seed the circle's OWNER (the atom's
          // `creator` is the proxy; MEMBER_OF can't distinguish creator from
          // joiner). Skipped while the predicate atom is unminted.
          if (PREDICATE_IDS.CIRCLE_OWNER) {
            createItems.push({
              subjectId: userAtomId,
              predicateId: PREDICATE_IDS.CIRCLE_OWNER,
              objectId: atomId,
              signalTrust: perTripleAmount,
            })
          }

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

    // Phase A (skills) — mint every queued skill/tool atom in one tx, then
    // push the `[you → is_skilled_in/uses → skill]` triple into the batch.
    // Mirrors the circle path: deterministic Thing → same atom termId as
    // Atlas, so the triples interoperate.
    if (skillIndices.length > 0) {
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
        const payloads: AtomIPFSPayload[] = skillIndices.map(
          (idx) => items[idx].skillDraft!.payload,
        )
        const atomBatch = await executeCreateAtomsBatch(
          wallets[0],
          payloads,
          pinThing,
        )
        if (!atomBatch.success) {
          setCreateTripleResult({
            success: false,
            error: atomBatch.error ?? 'Skill atom creation failed',
          })
          return
        }

        const userAtomId = userAccountAtom.termId
        skillIndices.forEach((idx, i) => {
          const atomId = atomBatch.results[i]?.atomId
          if (!atomId) return
          const draft = items[idx].skillDraft!
          createItems.push({
            subjectId: userAtomId,
            predicateId: draft.predicateId,
            objectId: atomId,
            signalTrust: Math.max(getAmount(idx), MIN_SIGNAL_TRUST),
          })
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

    // Phase A' (contexts) — mint any taxonomy context atom that isn't on-chain
    // yet (idempotent: an existing atom is reused with no atom tx), then push
    // the [cert → in_context_of → context] triple into the batch. Unlike
    // skills/circles the subject is the CERT term_id, not the user's account.
    if (contextIndices.length > 0) {
      if (!authenticated || wallets.length === 0) {
        setCreateTripleResult({ success: false, error: 'No wallet connected' })
        return
      }
      setCreateTripleProcessing(true)
      setCreateTripleResult(null)
      try {
        const payloads: AtomIPFSPayload[] = contextIndices.map(
          (idx) => items[idx].contextDraft!.payload,
        )
        const atomBatch = await executeCreateAtomsBatch(
          wallets[0],
          payloads,
          pinThing,
        )
        if (!atomBatch.success) {
          setCreateTripleResult({
            success: false,
            error: atomBatch.error ?? 'Context atom creation failed',
          })
          return
        }
        contextIndices.forEach((idx, i) => {
          const atomId = atomBatch.results[i]?.atomId
          const item = items[idx]
          if (!atomId || !item.subjectId || !item.predicateId) return
          createItems.push({
            subjectId: item.subjectId,
            predicateId: item.predicateId,
            objectId: atomId,
            signalTrust: Math.max(getAmount(idx), MIN_SIGNAL_TRUST),
          })
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
          // Mined batches count even when a later one failed
          const mined = new Set(
            (r.confirmedTermIds ?? []).map((id) => id.toLowerCase()),
          )
          const minedRows: CartItem[] = []
          const minedAmounts: number[] = []
          createSources.forEach((it, k) => {
            if (!it || !mined.has(it.termId.toLowerCase())) return
            settled.items.add(it.id)
            minedRows.push(it)
            minedAmounts.push(createItems[k].signalTrust)
          })
          showAdded(minedRows, minedAmounts)
          if (!r.success) {
            allOk = false
          } else {
            // Group panels read these queries, refresh after a join so the
            // user shows up. A declared skill/tool ([you → is_skilled_in/uses →
            // X]) lands via this same create path — refresh those too.
            const refreshAfterMint = () => {
              qc.invalidateQueries({ queryKey: ['groups-list'] })
              qc.invalidateQueries({ queryKey: ['group-detail'] })
              qc.invalidateQueries({ queryKey: ['userAttributes'] })
              qc.invalidateQueries({ queryKey: ['user-onchain-profile'] })
              // Trusting a person mints an I→TRUSTS→account triple; refetch the
              // Trust Circle so the new member reconciles from the optimistic
              // placeholder to the real indexed triple.
              qc.invalidateQueries({ queryKey: ['trustCircle'] })
            }
            // Immediate refresh for the join gate + profile. userAttributes is
            // deliberately excluded here: refetching now returns pre-index state
            // and would wipe the optimistic chip below before the indexer has
            // the triple. It reconciles on the scheduled runs instead.
            qc.invalidateQueries({ queryKey: ['groups-list'] })
            qc.invalidateQueries({ queryKey: ['group-detail'] })
            qc.invalidateQueries({ queryKey: ['user-onchain-profile'] })
            // Optimistic: surface the just-declared skills/tools immediately,
            // before the indexer even acknowledges the new atoms. The scheduled
            // refetch below reconciles the real termId/endorserCount; the
            // resilient name-fallback in userAttributesService keeps a
            // still-unresolved atom in the list so the chip doesn't flicker out.
            if (skillIndices.length > 0) {
              const owner = wallets[0]?.address
              const declared = skillIndices.flatMap((idx) => {
                const draft = items[idx].skillDraft
                const attr = draft && getAttributeByLabel(draft.label)
                return attr
                  ? [
                      {
                        id: attr.id,
                        label: attr.label,
                        category: attr.category,
                        endorserCount: 1,
                        viewerEndorsed: true,
                        termId: '',
                      } as UserAttribute,
                    ]
                  : []
              })
              if (owner && declared.length) {
                addAttributesToCache(qc, owner, declared)
              }
            }
            // Optimistic: surface just-trusted members in the Trust Circle
            // immediately. A signed trust triple WILL be indexed, so we show
            // the member now (placeholder) and let the scheduled refetch above
            // reconcile it with the real indexed account (see optimisticTrust +
            // useTrustCircle).
            const trustItems = items.filter(
              (it) =>
                it.kind === 'create-triple' &&
                it.predicateId === PREDICATE_IDS.TRUSTS &&
                !!it.objectId,
            )
            for (const it of trustItems) {
              addOptimisticTrust(qc, {
                id: `optimistic-${it.objectId}`,
                termId: it.objectId as string,
                tripleId: `optimistic-${it.objectId}`,
                label: it.title || 'New member',
                image: it.favicon || null,
                walletAddress: undefined,
                trustAmount: 0,
                createdAt: Date.now(),
              })
            }
            // The indexer lags the chain by a few seconds, so the immediate
            // refetch above returns the pre-mint state and re-caches it (the
            // join gate would stay locked even after a manual reload). Re-run
            // on a short schedule so the new membership/skill surfaces on its
            // own once the indexer catches up — no manual reload needed.
            for (const delay of [4000, 9000, 18000]) {
              setTimeout(refreshAfterMint, delay)
            }
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
    sponsored,
  ])

  const handleClose = () => {
    // Capture before reset() nulls the result. On success the dismiss
    // doubles as the cart-clear (onSuccess), which empties the cart and
    // lets the aside auto-close. On cancel we just close, items intact.
    const succeeded = txResult?.success ?? false
    reset()
    setCreateTripleResult(null)
    setCreateTripleProcessing(false)
    if (succeeded) {
      settledRef.current = { items: new Set(), legs: new Set() }
      onSuccess()
      return
    }
    // Part of the cart went through before a failure: keep only the rest
    const done = settledRef.current.items
    if (onRemove && done.size > 0) {
      for (const it of items) if (done.has(it.id)) onRemove(it.id)
      done.clear()
    }
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

              {items.length > 1 && !sponsored.active && (
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
                  const isRedeem = isExitItem(item)

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
                          <span className="b3-row-trust-unit">
                            {item.kind === 'redeem-batch'
                              ? `EXIT · ~${(item.exitValue ?? 0).toFixed(2)} T BACK`
                              : (item.redeemPercent ?? 100) < 100
                                ? `EXIT ${item.redeemPercent}%`
                                : 'EXIT'}
                          </span>
                        </div>
                      ) : sponsored.active ? (
                        <div className="b3-row-trust">
                          <span className="b3-row-trust-unit">FREE</span>
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
                            {item.kind === 'redeem-batch'
                              ? `${item.exitLegs?.length ?? 0} legacy positions exited first, then re-deposited below`
                              : (item.redeemPercent ?? 100) < 100
                                ? `${item.redeemPercent}% of your shares returned`
                                : 'All shares returned'}
                          </span>
                        </div>
                      ) : sponsored.active ? null : (
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

              {/* Free Recommends — Sofia pays, the position is the user's */}
              {sponsored.active ? (
                <div className="b3-ledger">
                  <div className="b3-ledger-row b3-ledger-total">
                    <span>Free Recommend{items.length > 1 ? 's' : ''}</span>
                    <span>0 TRUST</span>
                  </div>
                  <div className="b3-ledger-row b3-ledger-row--muted">
                    <span>Sofia pays · the position is yours</span>
                    <span>{sponsored.left} left</span>
                  </div>
                </div>
              ) : (
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
                  {sponsored.hint && (
                    <div className="b3-ledger-row b3-ledger-row--muted">
                      <span>{sponsored.hint}</span>
                    </div>
                  )}
                </div>
              )}
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

          {!txResult && (
            <p
              className="text-xs text-muted-foreground"
              style={{ margin: '0 0 8px', textAlign: 'center' }}
            >
              Position value can go down. Rewards are not guaranteed.
            </p>
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
                  (sponsored.active
                    ? false
                    : verifying ||
                      missingTripleIds.length > 0 ||
                      (totalDeposit <= 0 && !hasRedeem) ||
                      balNum < breakdown.totalEstimate)
                }
              >
                {sponsored.active
                  ? processing
                    ? 'Publishing…'
                    : 'Recommend for free'
                  : processing
                    ? 'Signing…'
                    : verifying
                      ? 'Verifying…'
                      : 'Sign'}
                {!sponsored.active &&
                  !processing &&
                  !verifying &&
                  breakdown.totalEstimate > 0 && (
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
