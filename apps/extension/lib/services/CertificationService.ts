/**
 * CertificationService
 *
 * The whole "publish" pipeline (pin → atoms → triples → deposits → context
 * triples → votes), free of React so it runs in the side panel AND in the
 * service worker (right-click publishing). Writes go through the active
 * signer (lib/signer): injected wallet today, delegated session key later.
 *
 * Related files:
 * - hooks/useCartSubmit.ts, hooks/useCreateTripleOnChain.ts: thin facades
 * - AtomService.ts / TripleService.ts: on-chain primitives
 */

import { contextAtomRefForSlug } from "@0xsofia/taxonomy"
import type { Address, Hash } from "viem"

import { SofiaFeeProxyAbi } from "../../ABI/SofiaFeeProxy"
import type {
  AtomIPFSData,
  BatchTripleInput,
  BatchTripleResult,
  TripleOnChainResult
} from "../../types/blockchain"
import type { CartItemRecord } from "../../types/database"
import { getPublicClient } from "../clients/viemClients"
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES } from "../config/constants"
import { getSigner } from "../signer"
import { getFaviconUrl } from "../utils/formatters"
import { createServiceLogger } from "../utils/logger"
import { normalizeUrl } from "../utils/normalizeUrl"
import { atomService } from "./AtomService"
import { BlockchainService } from "./blockchainService"
import { cartService } from "./CartService"
import { platformPoolService } from "./PlatformPoolService"
import { tripleService, type ResolvedTriple } from "./TripleService"
import { txEventBus } from "./TxEventBus"

const logger = createServiceLogger("CertificationService")

const DEFAULT_OBJECT_DESCRIPTION = "Contenu visité par l'utilisateur."
const DEFAULT_VOTE_WEIGHT = BigInt(Math.floor(0.5 * 1e18))

export interface ObjectAtomData {
  name: string
  description?: string
  url: string
  image?: string
}

export interface ContextTripleItem {
  certTripleVaultId: string
  /** Set when the context atom is already on-chain (registry hit). */
  topicTermId?: string
  /** Set when the context atom must be minted first (registry miss). The
   *  canonical Sofia taxonomy payload — same as the explorer's, so both
   *  dedup to one shared atom. */
  mintPayload?: { name: string; description: string; url: string }
}

export interface DepositResult {
  success: boolean
  txHash?: Hash
  error?: string
}

export interface QuickPublishTarget {
  url: string
  title: string | null
  predicateName: string
}

export interface SubmitCartResult {
  /** null when the cart was refused before any transaction */
  batchResult: BatchTripleResult | null
  votesSucceeded: number
  error: string | null
}

class CertificationServiceClass {
  /** Load the wallet's pool preference (no React subscriber in the worker). */
  private async preparePools(wallet: string): Promise<void> {
    await platformPoolService.ensureLoaded(wallet)
  }

  /** Certify one object with one predicate (create or deposit). */
  async createTripleOnChain(
    wallet: string,
    predicateName: string,
    objectData: ObjectAtomData,
    customWeight?: bigint
  ): Promise<TripleOnChainResult> {
    try {
      if (!wallet) {
        throw new Error("No wallet connected")
      }

      // Ensure proxy is approved before any creation (one-time approval)
      await atomService.ensureProxyApproval(wallet)
      await this.preparePools(wallet)

      const userAtom = tripleService.getUserAtom(wallet)

      // Check if predicate already has a pre-defined ID
      const existingPredicateId =
        tripleService.getPredicateIdIfExists(predicateName)

      // Pin all atoms to IPFS in parallel, then create in single tx
      const atomsToPinAndCreate: AtomIPFSData[] = []

      if (!existingPredicateId) {
        atomsToPinAndCreate.push({
          name: predicateName,
          description: `Predicate representing the relation "${predicateName}"`,
          url: ""
        })
      }

      atomsToPinAndCreate.push({
        name: objectData.name,
        description: objectData.description,
        url: objectData.url,
        image: objectData.image
      })

      logger.debug("Pinning atoms to IPFS", {
        count: atomsToPinAndCreate.length
      })
      const pinnedAtoms = await Promise.all(
        atomsToPinAndCreate.map((atomData) =>
          atomService.pinAtomToIPFS(atomData)
        )
      )

      logger.debug("Creating atoms in single transaction", {
        count: pinnedAtoms.length
      })
      const createdAtoms = await atomService.createAtomsFromPinned(
        pinnedAtoms,
        wallet
      )

      const predicateVaultId =
        existingPredicateId || createdAtoms[predicateName].vaultId
      const objectVaultId =
        createdAtoms[objectData.url || objectData.name].vaultId

      return tripleService.createTripleOnChain(
        userAtom.vaultId,
        predicateVaultId,
        objectVaultId,
        wallet,
        customWeight
      )
    } catch (error) {
      logger.error("Triple creation failed", error)
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(
        `${ERROR_MESSAGES.TRIPLE_CREATION_FAILED}: ${errorMessage}`
      )
    }
  }

  /** Certify many objects at once: one atoms tx + batched triples/deposits. */
  async createTriplesBatch(
    wallet: string,
    inputs: BatchTripleInput[]
  ): Promise<BatchTripleResult> {
    try {
      if (!wallet) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      // Ensure proxy is approved before any creation (one-time approval)
      await atomService.ensureProxyApproval(wallet)
      await this.preparePools(wallet)

      logger.debug("Starting batch triple creation", { count: inputs.length })

      const userAtom = tripleService.getUserAtom(wallet)

      // Collect unique predicates and objects
      const uniquePredicates = new Set<string>()
      const uniqueObjects = new Map<string, ObjectAtomData>()
      // objectKey -> existing atom term_id, for items that picked an existing
      // atom in the title search (deposit on it, don't create a new one).
      const reusedObjects = new Map<string, string>()

      for (const input of inputs) {
        uniquePredicates.add(input.predicateName)
        const objectKey = input.objectData.url || input.objectData.name
        if (input.objectTermId) {
          reusedObjects.set(objectKey, input.objectTermId)
        } else {
          uniqueObjects.set(objectKey, {
            name: input.objectData.name,
            description: input.objectData.description,
            url: input.objectData.url,
            image: input.objectData.image
          })
        }
      }

      const atomResults = new Map<string, string>() // key -> vaultId
      atomResults.set("user:I", userAtom.vaultId)
      // Pre-resolve reused object atoms — no IPFS pin / no creation tx for them.
      for (const [objectKey, termId] of reusedObjects.entries()) {
        atomResults.set(`object:${objectKey}`, termId)
      }

      // Collect ALL atoms to create (predicates + objects) and create in SINGLE tx
      const atomsToPinAndCreate: (AtomIPFSData & { key: string })[] = []

      for (const predicateName of uniquePredicates) {
        const existingId = tripleService.getPredicateIdIfExists(predicateName)
        if (existingId) {
          atomResults.set(`predicate:${predicateName}`, existingId)
        } else {
          atomsToPinAndCreate.push({
            name: predicateName,
            description: `Predicate representing the relation "${predicateName}"`,
            url: "",
            key: `predicate:${predicateName}`
          })
        }
      }

      for (const [objectKey, objData] of uniqueObjects.entries()) {
        // A reused (existing) atom is already resolved — never recreate it.
        if (reusedObjects.has(objectKey)) continue
        atomsToPinAndCreate.push({
          name: objData.name,
          description: objData.description || DEFAULT_OBJECT_DESCRIPTION,
          url: objData.url,
          image: objData.image,
          key: `object:${objectKey}`
        })
      }

      if (atomsToPinAndCreate.length > 0) {
        logger.debug("Pinning all atoms to IPFS in parallel", {
          count: atomsToPinAndCreate.length
        })

        const pinnedAtoms = await Promise.all(
          atomsToPinAndCreate.map((atomData) =>
            atomService.pinAtomToIPFS(atomData)
          )
        )

        logger.debug("Creating all atoms in single transaction", {
          count: pinnedAtoms.length
        })
        const createdAtoms = await atomService.createAtomsFromPinned(
          pinnedAtoms,
          wallet
        )

        for (const atom of atomsToPinAndCreate) {
          atomResults.set(atom.key, createdAtoms[atom.url || atom.name].vaultId)
        }

        logger.debug("All atoms created in single tx", {
          predicatesCreated: atomsToPinAndCreate.filter((a) =>
            a.key.startsWith("predicate:")
          ).length,
          objectsCreated: atomsToPinAndCreate.filter((a) =>
            a.key.startsWith("object:")
          ).length
        })
      }

      const resolvedTriples: ResolvedTriple[] = inputs.map((input) => ({
        subjectId: atomResults.get("user:I")!,
        predicateId: atomResults.get(`predicate:${input.predicateName}`)!,
        objectId: atomResults.get(
          `object:${input.objectData.url || input.objectData.name}`
        )!,
        customWeight: input.customWeight
      }))

      const urls = inputs.map((i) => i.objectData.url).filter(Boolean)
      const batchResult = await tripleService.createTriplesBatch(
        resolvedTriples,
        wallet,
        urls
      )

      // Build a stable input-key → tripleVaultId map so callers don't have to
      // rely on positional indexing into `results` (which is reordered by the
      // service: created-first-then-deposit, after dedup).
      const vaultIdByInputKey: Record<string, string> = {}
      for (let i = 0; i < inputs.length; i++) {
        const triple = resolvedTriples[i]
        const match = batchResult.results.find(
          (r) =>
            r.subjectVaultId === triple.subjectId &&
            r.predicateVaultId === triple.predicateId &&
            r.objectVaultId === triple.objectId
        )
        if (match?.tripleVaultId) {
          const input = inputs[i]
          const key = `${input.predicateName}|${input.objectData.url || input.objectData.name}`
          vaultIdByInputKey[key] = match.tripleVaultId
        }
      }

      return { ...batchResult, vaultIdByInputKey }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      throw new Error(`Batch creation failed: ${errorMessage}`)
    }
  }

  /**
   * Create "in context of" nested triples after cert batch.
   * Subject = cert triple vault ID, Predicate = "in context of", Object = topic atom.
   */
  async createContextTriplesBatch(
    wallet: string,
    contextItems: ContextTripleItem[]
  ): Promise<BatchTripleResult> {
    try {
      if (!wallet) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      await atomService.ensureProxyApproval(wallet)
      await this.preparePools(wallet)

      logger.debug("Starting context triples batch", {
        count: contextItems.length
      })

      let predicateVaultId =
        tripleService.getPredicateIdIfExists("in context of")

      if (!predicateVaultId) {
        // Create predicate atom on first use
        const pinned = await atomService.pinAtomToIPFS({
          name: "in context of",
          description: 'Predicate: certification is "in context of" a topic',
          url: ""
        })
        const created = await atomService.createAtomsFromPinned(
          [pinned],
          wallet
        )
        predicateVaultId = created["in context of"].vaultId
        logger.info("Created 'in context of' predicate atom", {
          predicateVaultId
        })
      }

      // Mint any context object atoms that aren't on-chain yet (registry miss).
      // createAtomsFromPinned is idempotent — an existing atom is resolved, not
      // re-minted. Keyed by atom name (= taxonomy label, unique per context).
      const mintByName: Record<string, string> = {}
      const toMint = contextItems.filter((i) => !i.topicTermId && i.mintPayload)
      if (toMint.length > 0) {
        const uniquePayloads = Array.from(
          new Map(
            toMint.map((i) => [i.mintPayload!.name, i.mintPayload!])
          ).values()
        )
        const pinned = await Promise.all(
          uniquePayloads.map((p) => atomService.pinAtomToIPFS(p))
        )
        const created = await atomService.createAtomsFromPinned(pinned, wallet)
        for (const [name, atom] of Object.entries(created)) {
          mintByName[name] = atom.vaultId
        }
        logger.info("Minted/resolved context atoms", {
          count: uniquePayloads.length
        })
      }

      // Drop any item whose object couldn't be resolved (mint failure) so a
      // bad context never poisons the whole batch.
      const resolvedTriples: ResolvedTriple[] = []
      for (const item of contextItems) {
        const objectId =
          item.topicTermId ??
          (item.mintPayload ? mintByName[item.mintPayload.name] : undefined)
        if (!objectId) continue
        resolvedTriples.push({
          subjectId: item.certTripleVaultId,
          predicateId: predicateVaultId,
          objectId
        })
      }

      if (resolvedTriples.length === 0) {
        return { success: true, results: [], failedTriples: [] }
      }

      return tripleService.createTriplesBatch(resolvedTriples, wallet)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      throw new Error(`Context triples batch failed: ${errorMessage}`)
    }
  }

  /** Single deposit on an existing triple (no pool split). Never throws. */
  async depositWithPool(
    wallet: string,
    tripleVaultId: string,
    depositAmount: bigint,
    curveId: bigint = 1n
  ): Promise<DepositResult> {
    try {
      if (!wallet) {
        throw new Error("No wallet connected")
      }

      const signer = await getSigner()
      const publicClient = getPublicClient()
      const contractAddress = BlockchainService.getContractAddress()

      const totalCost =
        await BlockchainService.getTotalDepositCost(depositAmount)
      const minShares = await BlockchainService.previewDepositMinShares(
        tripleVaultId,
        curveId,
        depositAmount
      )

      logger.debug("deposit", {
        depositAmount: depositAmount.toString(),
        totalCost: totalCost.toString(),
        curveId: curveId.toString()
      })

      const hash = await signer.writeContract({
        address: contractAddress,
        abi: SofiaFeeProxyAbi,
        functionName: "deposit",
        args: [wallet as Address, tripleVaultId as Address, curveId, minShares],
        value: totalCost,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS
      })

      logger.debug("Deposit transaction sent", { hash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== "success") {
        throw new Error(
          `${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`
        )
      }

      txEventBus.emit("deposit", hash)
      return { success: true, txHash: hash }
    } catch (error) {
      logger.error("Deposit failed", error)
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      return { success: false, error: `Deposit failed: ${errorMessage}` }
    }
  }

  /**
   * Publish one page with one predicate right now (right-click), without
   * touching the cart. Never throws — errors land in `error`.
   */
  async publishNow(
    wallet: string,
    target: QuickPublishTarget,
    weight: bigint
  ): Promise<DepositResult> {
    try {
      const { label } = normalizeUrl(target.url)
      // Same object atom shape as cartService.toBatchInputs → same atom
      const result = await this.createTriplesBatch(wallet, [
        {
          predicateName: target.predicateName,
          objectData: {
            name: target.title || label,
            description: `Page: ${label}`,
            url: target.url,
            image: getFaviconUrl(target.url, 128) || undefined
          },
          customWeight: weight
        }
      ])
      if (!result.success) {
        return { success: false, error: result.error ?? "Publish failed" }
      }
      const txHash = result.results[0]?.txHash as Hash | undefined
      txEventBus.emit("certification", txHash)
      txEventBus.relayToUi("certification", txHash)
      return { success: true, txHash }
    } catch (error) {
      logger.error("publishNow failed", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      }
    }
  }

  /** One `in context of` triple per chosen context of each certified item. */
  private buildContextItems(
    certItems: CartItemRecord[],
    batchResult: BatchTripleResult
  ): ContextTripleItem[] {
    return certItems.flatMap((item) => {
      // All chosen contexts for this cert (topics and/or categories);
      // fall back to the legacy single field.
      const slugs =
        item.interestContexts && item.interestContexts.length
          ? item.interestContexts
          : item.interestContext
            ? [item.interestContext]
            : []
      if (slugs.length === 0) return []
      // Look up the triple vault by stable input key. Indexing into
      // `batchResult.results` positionally is wrong: the service reorders
      // entries (created first, then deposits) after dedup.
      const inputKey = `${item.predicateName}|${item.url}`
      const tripleVaultId = batchResult.vaultIdByInputKey?.[inputKey]
      if (!tripleVaultId) {
        logger.warn("Skip context triples: no vaultId resolved", {
          inputKey,
          contexts: slugs
        })
        return []
      }
      // A slug is a topic OR a category. Hybrid resolve: use the registered
      // atom when known, else carry the canonical payload so the atom is
      // minted (once, idempotently) at submit instead of silently dropped.
      const items: ContextTripleItem[] = []
      for (const slug of slugs) {
        const ref = contextAtomRefForSlug(slug)
        if (!ref) continue
        items.push(
          ref.kind === "known"
            ? { certTripleVaultId: tripleVaultId, topicTermId: ref.termId }
            : {
                certTripleVaultId: tripleVaultId,
                mintPayload: {
                  name: ref.payload.name,
                  description: ref.payload.description,
                  url: ref.payload.url
                }
              }
        )
      }
      return items
    })
  }

  /** Votes via depositWithPool (curve 1n), only on triples that exist on-chain. */
  private async submitVotes(
    wallet: string,
    voteItems: CartItemRecord[],
    voteWeight: bigint
  ): Promise<number> {
    // Verify all vote target triples exist on-chain before depositing.
    // A poisoned indexer or stale cart entry could otherwise route TRUST
    // into an attacker-controlled vault. Single multicall3 roundtrip.
    const termIds = voteItems
      .map((v) => v.tripleTermId)
      .filter((id): id is string => !!id)
    const existsMap =
      await BlockchainService.checkTriplesExistByTermIds(termIds)

    let votesSucceeded = 0
    for (const vote of voteItems) {
      if (!vote.tripleTermId) continue
      if (!existsMap.get(vote.tripleTermId)) {
        logger.warn("Skip vote: triple does not exist on-chain", {
          tripleTermId: vote.tripleTermId
        })
        continue
      }
      const voteResult = await this.depositWithPool(
        wallet,
        vote.tripleTermId,
        voteWeight,
        1n // Curve 1n for votes
      )
      if (!voteResult.success) {
        logger.error("Vote deposit failed", {
          tripleTermId: vote.tripleTermId,
          error: voteResult.error
        })
        continue
      }
      votesSucceeded++
    }
    return votesSucceeded
  }

  /**
   * Publish a cart: certifications (one batch) → votes → context triples.
   * Empties the cart on success. Never throws — errors land in `error`.
   */
  async submitCart(
    wallet: string,
    items: CartItemRecord[],
    customWeight?: bigint
  ): Promise<SubmitCartResult> {
    if (!wallet || items.length === 0) {
      return { batchResult: null, votesSucceeded: 0, error: null }
    }

    // Refuse to sign for cart items that don't belong to the active wallet.
    // An async wallet swap between cart load and submit (chrome.storage
    // listeners are independent) could otherwise cause the user to sign a
    // batch they never assembled.
    const submitter = wallet.toLowerCase()
    const orphan = items.find(
      (item) => item.walletAddress.toLowerCase() !== submitter
    )
    if (orphan) {
      const msg = "Cart wallet mismatch — refresh the cart"
      logger.error(msg, {
        submitter,
        orphanWallet: orphan.walletAddress,
        orphanId: orphan.id
      })
      return { batchResult: null, votesSucceeded: 0, error: msg }
    }

    let batchResult: BatchTripleResult | null = null
    let votesSucceeded = 0

    try {
      const certItems = items.filter((item) => !item.voteAction)
      const voteItems = cartService.getVoteItems(items)

      // 1. Certifications
      if (certItems.length > 0) {
        const batchInputs = cartService.toBatchInputs(certItems)
        if (customWeight) {
          for (const input of batchInputs) {
            input.customWeight = customWeight
          }
        }

        logger.info("Submitting cart certifications", {
          count: batchInputs.length,
          weight: customWeight?.toString()
        })
        batchResult = await this.createTriplesBatch(wallet, batchInputs)
      }

      // 2. Votes
      if (voteItems.length > 0) {
        votesSucceeded = await this.submitVotes(
          wallet,
          voteItems,
          customWeight || DEFAULT_VOTE_WEIGHT
        )
      }

      // 3. Interest context triples (nested triples) — non-blocking
      if (batchResult?.success) {
        const contextItems = this.buildContextItems(certItems, batchResult)
        if (contextItems.length > 0) {
          try {
            logger.info("Submitting context triples", {
              count: contextItems.length
            })
            await this.createContextTriplesBatch(wallet, contextItems)
            logger.info("Context triples submitted successfully")
          } catch (ctxError) {
            // Cert succeeded, context is bonus
            logger.warn("Context triples failed (non-blocking)", {
              error: ctxError
            })
          }
        }
      }

      if (batchResult) {
        if (!batchResult.success) {
          logger.error("Cart batch partially failed", {
            failed: batchResult.failedTriples.length
          })
          return {
            batchResult,
            votesSucceeded,
            error: "Some certifications failed. Check results."
          }
        }

        // URLs are now validated on-chain — empty the cart immediately
        // (incl. items that were already in the cart before this run).
        // The reward screen renders from its own snapshot, so this is safe.
        await cartService.clearCart(wallet)
        logger.info("Cart batch submitted successfully", {
          created: batchResult.createdCount,
          deposited: batchResult.depositCount,
          votes: votesSucceeded
        })
        txEventBus.emit("batch_certification", batchResult.results[0]?.txHash)
        return { batchResult, votesSucceeded, error: null }
      }

      // Votes only — synthetic result
      const voteOnlyResult: BatchTripleResult = {
        success: votesSucceeded > 0,
        results: [],
        failedTriples: [],
        createdCount: 0,
        depositCount: votesSucceeded
      }
      if (votesSucceeded > 0) {
        await cartService.clearCart(wallet)
        logger.info("Vote-only cart submitted", { votes: votesSucceeded })
        txEventBus.emit("vote")
      }
      return { batchResult: voteOnlyResult, votesSucceeded, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error("Cart batch submission failed", { error: msg })
      return { batchResult: null, votesSucceeded, error: msg }
    }
  }
}

export const certificationService = new CertificationServiceClass()
export { CertificationServiceClass }
