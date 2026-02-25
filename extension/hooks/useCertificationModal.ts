/**
 * useCertificationModal Hook
 * Manages the WeightModal lifecycle for trust/distrust/intention certifications.
 * Encapsulates modal state and submit/close handlers.
 *
 * Unified approach: all certifications (trust, distrust, intentions) go through
 * useIntentionCertify (certifyWithIntention or certifyWithCustomPredicate),
 * mirroring the GroupDetailView pattern for a single source of state.
 */

import { useState, useCallback } from "react"
import { useIntentionCertify } from "./useIntentionCertify"
import { normalizeUrl } from "~/lib/utils"
import { discoveryScoreService } from "~/lib/services"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { INTENTION_PREDICATES } from "~/types/discovery"
import type { IntentionPurpose } from "~/types/discovery"
import type { IntentionType } from "~/types/intentionCategories"
import { createHookLogger } from "~/lib/utils/logger"

const logger = createHookLogger("useCertificationModal")

const DELAYS = {
  REFRESH_AFTER_TX: 1000,
  DISCOVERY_SCORE_REFRESH: 5000
} as const

// Type for triplets shown in the WeightModal
export interface ModalTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string
    object: string
  }
  description: string
  url: string
  intention?: IntentionPurpose | IntentionType
}

interface TrustDistrustState {
  loading: boolean
  success: boolean
  error: string | null
  operationType: "created" | "deposit" | null
  transactionHash: string | null
}

export interface CertificationModalResult {
  // Modal state
  showWeightModal: boolean
  modalTriplets: ModalTriplet[]
  modalType: "trust" | "distrust"
  // Actions
  openTrustModal: (currentUrl: string, pageTitle: string | null) => void
  openDistrustModal: (currentUrl: string, pageTitle: string | null) => void
  openIntentionModal: (
    currentUrl: string,
    pageTitle: string | null,
    intention: IntentionPurpose
  ) => void
  handleModalSubmit: (
    customWeights: (bigint | null)[] | undefined,
    context: {
      currentUrl: string | null
      pageTitle: string | null
      totalCertifications: number
      pauseRefresh: () => void
      resumeRefresh: () => void
      fetchDataForCurrentPage: () => void
      calculateAndTriggerReward: (prevTotal: number) => void
    }
  ) => Promise<void>
  handleModalClose: () => void
  // State exposed for WeightModal props and trust/distrust buttons
  trustState: TrustDistrustState
  distrustState: TrustDistrustState
  intentionState: {
    loading: boolean
    success: boolean
    error: string | null
    operationType: "created" | "deposit" | null
    transactionHash: string | null
    currentIntention: IntentionPurpose | null
  }
}

export const useCertificationModal = (): CertificationModalResult => {
  const {
    certifyWithIntention,
    certifyWithCustomPredicate,
    reset: resetIntention,
    loading: intentionLoading,
    success: intentionSuccess,
    error: intentionError,
    operationType: intentionOperationType,
    transactionHash: intentionTxHash,
    currentIntention
  } = useIntentionCertify()

  // Modal visibility
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [modalTriplets, setModalTriplets] = useState<ModalTriplet[]>([])
  const [modalType, setModalType] = useState<"trust" | "distrust">("trust")

  const openTrustModal = useCallback(
    (currentUrl: string, pageTitle: string | null) => {
      const { label: pageLabel } = normalizeUrl(currentUrl)
      setModalTriplets([
        {
          id: "trust-page",
          triplet: {
            subject: "I",
            predicate: "trust",
            object: pageTitle || pageLabel
          },
          description: `Trust ${pageTitle || pageLabel}`,
          url: currentUrl,
          intention: "trusted" as IntentionType
        }
      ])
      setModalType("trust")
      setShowWeightModal(true)
    },
    []
  )

  const openDistrustModal = useCallback(
    (currentUrl: string, pageTitle: string | null) => {
      const { label: pageLabel } = normalizeUrl(currentUrl)
      setModalTriplets([
        {
          id: "distrust-page",
          triplet: {
            subject: "I",
            predicate: "distrust",
            object: pageTitle || pageLabel
          },
          description: `Distrust ${pageTitle || pageLabel}`,
          url: currentUrl,
          intention: "distrusted" as IntentionType
        }
      ])
      setModalType("distrust")
      setShowWeightModal(true)
    },
    []
  )

  const openIntentionModal = useCallback(
    (
      currentUrl: string,
      pageTitle: string | null,
      intention: IntentionPurpose
    ) => {
      const { label: pageLabel } = normalizeUrl(currentUrl)
      const displayName = pageTitle || pageLabel
      setModalTriplets([
        {
          id: `intention-${intention}`,
          triplet: {
            subject: "I",
            predicate: INTENTION_PREDICATES[intention],
            object: displayName
          },
          description: `I ${INTENTION_PREDICATES[intention]} ${displayName}`,
          url: currentUrl,
          intention
        }
      ])
      setModalType("trust")
      setShowWeightModal(true)
    },
    []
  )

  const handleModalSubmit = useCallback(
    async (
      customWeights: (bigint | null)[] | undefined,
      ctx: {
        currentUrl: string | null
        pageTitle: string | null
        totalCertifications: number
        pauseRefresh: () => void
        resumeRefresh: () => void
        fetchDataForCurrentPage: () => void
        calculateAndTriggerReward: (prevTotal: number) => void
      }
    ) => {
      if (!ctx.currentUrl || !customWeights || customWeights.length === 0)
        return

      ctx.pauseRefresh()

      const prevTotal = ctx.totalCertifications
      const weight = customWeights[0] || undefined

      try {
        // Unified routing: trust/distrust via certifyWithCustomPredicate,
        // intentions via certifyWithIntention (same pattern as GroupDetailView)
        if (modalType === "trust") {
          logger.info("Starting trust certification via certifyWithCustomPredicate")
          await certifyWithCustomPredicate(
            ctx.currentUrl,
            "trusts",
            undefined,
            ctx.pageTitle || undefined,
            weight as bigint | undefined
          )
        } else if (modalType === "distrust") {
          logger.info("Starting distrust certification via certifyWithCustomPredicate")
          await certifyWithCustomPredicate(
            ctx.currentUrl,
            "distrust",
            undefined,
            ctx.pageTitle || undefined,
            weight as bigint | undefined
          )
        } else {
          const intentionFromTriplet = modalTriplets[0]?.intention as
            | IntentionPurpose
            | undefined
          if (intentionFromTriplet) {
            logger.info("Starting intention certification", {
              intention: intentionFromTriplet
            })
            await certifyWithIntention(
              ctx.currentUrl,
              intentionFromTriplet,
              ctx.pageTitle || undefined,
              weight as bigint | undefined
            )
          }
        }

        logger.info("Certification completed")
        ctx.resumeRefresh()
        ctx.calculateAndTriggerReward(prevTotal)
        // Wave 1: optimistic (indexer might not have caught up yet)
        setTimeout(
          () => ctx.fetchDataForCurrentPage(),
          DELAYS.REFRESH_AFTER_TX
        )
        // Wave 2: after cache clear (indexer should be synced)
        setTimeout(() => {
          intuitionGraphqlClient.clearCache()
          ctx.fetchDataForCurrentPage()
          discoveryScoreService.refetch()
        }, DELAYS.DISCOVERY_SCORE_REFRESH)
      } catch (error) {
        logger.error("Certification error", error)
        ctx.resumeRefresh()
      }
    },
    [modalTriplets, modalType, certifyWithIntention, certifyWithCustomPredicate]
  )

  const handleModalClose = useCallback(() => {
    setShowWeightModal(false)
    setModalTriplets([])
    resetIntention()
  }, [resetIntention])

  return {
    showWeightModal,
    modalTriplets,
    modalType,
    openTrustModal,
    openDistrustModal,
    openIntentionModal,
    handleModalSubmit,
    handleModalClose,
    // Derived trust/distrust state from intentionState + modalType
    // (for trust/distrust button loading/success display)
    trustState: {
      loading: modalType === "trust" && intentionLoading,
      success: modalType === "trust" && intentionSuccess,
      error: modalType === "trust" ? intentionError : null,
      operationType: modalType === "trust" ? intentionOperationType : null,
      transactionHash: modalType === "trust" ? intentionTxHash : null
    },
    distrustState: {
      loading: modalType === "distrust" && intentionLoading,
      success: modalType === "distrust" && intentionSuccess,
      error: modalType === "distrust" ? intentionError : null,
      operationType: modalType === "distrust" ? intentionOperationType : null,
      transactionHash: modalType === "distrust" ? intentionTxHash : null
    },
    intentionState: {
      loading: intentionLoading,
      success: intentionSuccess,
      error: intentionError,
      operationType: intentionOperationType,
      transactionHash: intentionTxHash,
      currentIntention
    }
  }
}
