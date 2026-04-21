/**
 * UserCertificationsService
 *
 * Singleton store for the user's on-chain certifications.
 * Manages paginated GraphQL fetches and a Map<normalizedUrl, CertificationEntry>.
 *
 * Related files:
 * - hooks/useUserCertifications.ts: React hook consumer (useSyncExternalStore)
 * - lib/config/predicateConstants.ts: predicate constants
 */

import { intuitionGraphqlClient } from "../clients/graphql-client"
import {
  ALL_PREDICATE_IDS,
  ALL_PREDICATE_LABELS,
  OAUTH_PREDICATE_LABELS,
  PREDICATE_LABEL_TO_INTENTION,
  TRUST_LABEL_TO_TYPE
} from "../config/predicateConstants"
import { createServiceLogger } from "../utils/logger"
import { txEventBus } from "./TxEventBus"
import { normalizeUrl } from "../utils"
import { UserAllCertificationsDocument } from "@0xsofia/graphql"
import { ATOM_ID_TO_TOPIC } from "../config/topicConfig"
import type { IntentionPurpose } from "../../types/discovery"

const logger = createServiceLogger("UserCertificationsService")

// ── Types ──

export interface TripleDetail {
  tripleTermId: string
  shares: string
  predicateLabel: string
}

export interface CertificationEntry {
  label: string
  intentions: IntentionPurpose[]
  oauthPredicates: string[]
  trustPredicates: string[]
  isRootDomain: boolean
  triples: TripleDetail[]
  interestContexts: string[]  // topic slugs from nested "in context of" triples
}

export interface CertificationsStoreState {
  certifications: Map<string, CertificationEntry>
  loading: boolean
  error: string | null
  lastFetchedAt: number | null
  walletAddress: string | null
}

// ── Service ──

class UserCertificationsServiceClass {
  private state: CertificationsStoreState = {
    certifications: new Map(),
    loading: false,
    error: null,
    lastFetchedAt: null,
    walletAddress: null
  }

  private isFetching = false
  private listeners = new Set<() => void>()
  private initialized = false

  // ── Store protocol (useSyncExternalStore) ──

  getSnapshot = (): CertificationsStoreState => this.state

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    if (!this.initialized) this.initTxSubscription()
    return () => this.listeners.delete(listener)
  }

  private initTxSubscription() {
    if (this.initialized) return
    this.initialized = true

    // Track wallet for TX-triggered refetch
    chrome.storage.session
      .get(["walletAddress"])
      .then((result) => {
        if (result.walletAddress) {
          this.state = { ...this.state, walletAddress: result.walletAddress.toLowerCase() }
        }
      })
      .catch(() => {})

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "session" && changes.walletAddress) {
        const wallet = changes.walletAddress.newValue || null
        this.state = { ...this.state, walletAddress: wallet ? wallet.toLowerCase() : null }
      }
    })

    // Refetch on certification/vote TX events
    const handleTx = () => {
      const wallet = this.state.walletAddress
      if (wallet) this.fetchCertifications(wallet)
    }
    txEventBus.on("certification", handleTx)
    txEventBus.on("batch_certification", handleTx)
    txEventBus.on("vote", handleTx)
  }

  private emitChange() {
    for (const listener of this.listeners) listener()
  }

  // ── Core fetch ──

  async fetchCertifications(walletAddress: string): Promise<void> {
    if (
      !walletAddress ||
      (ALL_PREDICATE_IDS.length === 0 && ALL_PREDICATE_LABELS.length === 0)
    ) {
      this.state = { ...this.state, certifications: new Map(), loading: false }
      this.emitChange()
      return
    }

    if (this.isFetching) {
      logger.debug("Skipping fetch - already in progress")
      return
    }

    this.isFetching = true
    this.state = { ...this.state, loading: true, error: null }
    this.emitChange()

    try {
      logger.info("Fetching ALL user certifications with pagination", {
        predicateIds: ALL_PREDICATE_IDS.length,
        predicateLabels: ALL_PREDICATE_LABELS.length
      })

      interface CertTripleResult {
        term_id?: string
        predicate: { term_id?: string; label: string }
        object: { label: string; value?: { thing?: { url?: string } } }
        positions?: Array<{ shares: string }>
      }

      const triples =
        await intuitionGraphqlClient.fetchAllPages<CertTripleResult>(
          UserAllCertificationsDocument,
          {
            predicateIds: ALL_PREDICATE_IDS,
            predicateLabels: ALL_PREDICATE_LABELS,
            userAddress: walletAddress.toLowerCase()
          },
          "triples",
          100,
          100
        )
      logger.info("Fetched user certifications (paginated)", {
        count: triples.length
      })

      logger.debug(
        "Raw triples from GraphQL:",
        triples.map(
          (t: {
            predicate?: { label?: string }
            object?: { label?: string }
          }) => ({
            predicate: t.predicate?.label,
            object: t.object?.label
          })
        )
      )

      const newCertifications = new Map<string, CertificationEntry>()

      for (const triple of triples) {
        const objectLabel = triple.object?.label || ""
        const predicateLabel = triple.predicate?.label || ""

        const intention = PREDICATE_LABEL_TO_INTENTION[predicateLabel]
        const isOAuthPredicate =
          OAUTH_PREDICATE_LABELS.includes(predicateLabel)
        const isTrustPredicate = predicateLabel in TRUST_LABEL_TO_TYPE

        logger.debug("Processing triple:", {
          objectLabel,
          predicateLabel,
          intention,
          isOAuthPredicate,
          isTrustPredicate
        })

        if (
          !objectLabel ||
          (!intention && !isOAuthPredicate && !isTrustPredicate)
        )
          continue

        // Use URL field as primary key (new atoms have title as name, URL in value.thing.url)
        // Fallback to label for old atoms where name = normalized URL
        const objectUrl = triple.object?.value?.thing?.url

        let normalizedLabel: string
        let isRootDomain: boolean

        if (objectUrl) {
          try {
            const result = normalizeUrl(objectUrl)
            normalizedLabel = result.label
            isRootDomain = result.isRootDomain
          } catch {
            normalizedLabel = objectLabel.toLowerCase()
            isRootDomain = !normalizedLabel.includes("/")
          }
        } else {
          // Old atoms: label IS the normalized URL
          normalizedLabel = objectLabel
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/$/, "")
            .toLowerCase()
          isRootDomain = !normalizedLabel.includes("/")
        }

        const tripleDetail: TripleDetail = {
          tripleTermId: triple.term_id || "",
          shares: triple.positions?.[0]?.shares || "0",
          predicateLabel
        }

        const existing = newCertifications.get(normalizedLabel)
        if (existing) {
          if (intention && !existing.intentions.includes(intention)) {
            existing.intentions.push(intention)
          }
          if (
            isOAuthPredicate &&
            !existing.oauthPredicates.includes(predicateLabel)
          ) {
            existing.oauthPredicates.push(predicateLabel)
          }
          if (
            isTrustPredicate &&
            !existing.trustPredicates.includes(predicateLabel)
          ) {
            existing.trustPredicates.push(predicateLabel)
          }
          if (
            tripleDetail.tripleTermId &&
            !existing.triples.some(
              (t) => t.tripleTermId === tripleDetail.tripleTermId
            )
          ) {
            existing.triples.push(tripleDetail)
          }
        } else {
          newCertifications.set(normalizedLabel, {
            label: normalizedLabel,
            intentions: intention ? [intention] : [],
            oauthPredicates: isOAuthPredicate ? [predicateLabel] : [],
            trustPredicates: isTrustPredicate ? [predicateLabel] : [],
            isRootDomain,
            triples: tripleDetail.tripleTermId ? [tripleDetail] : [],
            interestContexts: []
          })
        }
      }

      // ── Secondary query: fetch "in context of" nested triples ──
      // Collect all cert triple term_ids, then query triples where
      // subject.term_id IN [certTermIds] AND predicate.label = "in context of"
      await this.fetchInterestContexts(newCertifications)

      this.state = {
        ...this.state,
        certifications: newCertifications,
        loading: false,
        lastFetchedAt: Date.now(),
        walletAddress
      }

      logger.info("User certifications cache updated", {
        uniqueLabels: newCertifications.size,
        labels: Array.from(newCertifications.keys()).slice(0, 20)
      })

      newCertifications.forEach((entry, key) => {
        if (entry.intentions.length > 0 || entry.oauthPredicates.length > 0) {
          logger.debug("Cached certification:", {
            key,
            intentions: entry.intentions,
            oauthPredicates: entry.oauthPredicates,
            isRootDomain: entry.isRootDomain
          })
        }
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch certifications"
      logger.error("Failed to fetch user certifications", err)
      this.state = { ...this.state, loading: false, error: errorMessage }
    } finally {
      this.isFetching = false
      this.emitChange()
    }
  }

  /**
   * Fetch "in context of" nested triples for all cert triples.
   * Mutates the CertificationEntry.interestContexts in place.
   */
  private async fetchInterestContexts(
    certifications: Map<string, CertificationEntry>
  ): Promise<void> {
    // Collect all tripleTermIds and build reverse lookup: termId → entry
    const termIdToEntry = new Map<string, CertificationEntry>()
    for (const entry of certifications.values()) {
      for (const triple of entry.triples) {
        if (triple.tripleTermId) {
          termIdToEntry.set(triple.tripleTermId, entry)
        }
      }
    }

    const allTermIds = Array.from(termIdToEntry.keys())
    if (allTermIds.length === 0) return

    try {
      // Query: triples where subject is one of our cert triples
      // and predicate is "in context of"
      // Use subject_id (not subject { term_id }) because the subject is a
      // nested triple, not a regular atom — subject join returns null for triples.
      const CONTEXT_QUERY = `
        query GetContextTriples($subjectTermIds: [String!]!) {
          triples(
            where: {
              subject_id: { _in: $subjectTermIds }
              predicate: { label: { _eq: "in context of" } }
            }
            limit: 500
          ) {
            subject_id
            object { term_id label }
          }
        }
      `

      const data = await intuitionGraphqlClient.request(
        CONTEXT_QUERY,
        { subjectTermIds: allTermIds }
      )

      const contextTriples = data.triples || []
      logger.debug("Context triples fetched", { count: contextTriples.length })

      for (const ct of contextTriples) {
        const subjectId = ct.subject_id
        const objectTermId = ct.object?.term_id
        if (!subjectId || !objectTermId) continue

        const entry = termIdToEntry.get(subjectId)
        if (!entry) continue

        // Resolve topic slug from atom term_id
        const topicSlug = ATOM_ID_TO_TOPIC.get(objectTermId)
        if (topicSlug && !entry.interestContexts.includes(topicSlug)) {
          entry.interestContexts.push(topicSlug)
        }
      }
    } catch (err) {
      // Non-blocking: context is bonus info
      logger.warn("Failed to fetch context triples", err)
    }
  }

  clearCache(): void {
    this.state = {
      certifications: new Map(),
      loading: false,
      error: null,
      lastFetchedAt: null,
      walletAddress: null
    }
    this.emitChange()
  }

  // ── Static helper ──

  static getCertificationForUrl(
    certifications: Map<string, CertificationEntry>,
    url: string
  ): CertificationEntry | null {
    try {
      const { label } = normalizeUrl(url)
      return certifications.get(label) || null
    } catch {
      return null
    }
  }
}

export const userCertificationsService = new UserCertificationsServiceClass()
export { UserCertificationsServiceClass }
