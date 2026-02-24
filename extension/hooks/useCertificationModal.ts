/**
 * useCertificationModal Hook
 * Manages the WeightModal lifecycle for trust/distrust/intention certifications.
 * Encapsulates modal state, local trust/distrust syncing, and submit/close handlers.
 */

import { useState, useCallback, useEffect } from "react"
import { useTrustPage } from "./useTrustPage"
import { useIntentionCertify } from "./useIntentionCertify"
import { normalizeUrl } from "~/lib/utils"
import { INTENTION_PREDICATES } from "~/types/discovery"
import type { IntentionPurpose } from "~/types/discovery"
import type { IntentionType } from "~/types/intentionCategories"
import { createHookLogger } from "~/lib/utils/logger"

const logger = createHookLogger("useCertificationModal")

const DELAYS = {
  REFRESH_AFTER_TX: 1000
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

const initialTrustState: TrustDistrustState = {
  loading: false,
  success: false,
  error: null,
  operationType: null,
  transactionHash: null
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
      refetchDiscovery: () => Promise<void>
      fetchDataForCurrentPage: () => void
      calculateAndTriggerReward: (prevTotal: number) => void
    }
  ) => Promise<void>
  handleModalClose: () => void
  // State exposed for WeightModal props
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
    trustPage,
    loading: trustLoading,
    success: trustSuccess,
    error: trustError,
    operationType,
    transactionHash: trustTxHash
  } = useTrustPage()

  const {
    certifyWithIntention,
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

  // Local trust button state (synced from useTrustPage hook)
  const [localTrust, setLocalTrust] = useState<TrustDistrustState>(initialTrustState)
  const [localDistrust, setLocalDistrust] = useState<TrustDistrustState>(initialTrustState)

  // Sync hook states to local trust state
  useEffect(() => {
    if (!trustLoading) {
      if (trustSuccess && trustTxHash) {
        setLocalTrust({
          loading: false,
          success: true,
          error: null,
          operationType: operationType || null,
          transactionHash: trustTxHash
        })
      } else if (trustSuccess && !trustTxHash) {
        setLocalTrust({
          loading: false,
          success: true,
          error: null,
          operationType: operationType || null,
          transactionHash: null
        })
      } else if (trustError) {
        setLocalTrust({
          loading: false,
          success: false,
          error: trustError,
          operationType: null,
          transactionHash: null
        })
      }
    }
  }, [trustLoading, trustSuccess, trustError, trustTxHash, operationType])

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
        refetchDiscovery: () => Promise<void>
        fetchDataForCurrentPage: () => void
        calculateAndTriggerReward: (prevTotal: number) => void
      }
    ) => {
      if (!ctx.currentUrl || !customWeights || customWeights.length === 0)
        return

      ctx.pauseRefresh()

      const intentionFromTriplet = modalTriplets[0]?.intention as
        | IntentionPurpose
        | undefined
      const prevTotal = ctx.totalCertifications
      const weight = customWeights[0] || undefined

      if (intentionFromTriplet) {
        // Intention certification path
        try {
          logger.info("Starting intention certification", {
            intention: intentionFromTriplet
          })
          await certifyWithIntention(
            ctx.currentUrl,
            intentionFromTriplet,
            ctx.pageTitle || undefined,
            weight as bigint | undefined
          )
          logger.info("Intention certification completed")

          ctx.resumeRefresh()
          await ctx.refetchDiscovery()
          ctx.calculateAndTriggerReward(prevTotal)
          setTimeout(
            () => ctx.fetchDataForCurrentPage(),
            DELAYS.REFRESH_AFTER_TX
          )
        } catch (error) {
          logger.error("Intention certification error", error)
          ctx.resumeRefresh()
        }
        return
      }

      // Trust/distrust path
      const isTrust = modalType === "trust"
      const setLocalState = isTrust ? setLocalTrust : setLocalDistrust

      setLocalState({
        loading: true,
        success: false,
        error: null,
        operationType: null,
        transactionHash: null
      })

      try {
        logger.info("Starting trustPage call")
        await trustPage(
          ctx.currentUrl,
          weight as bigint | undefined,
          modalType === "trust" ? "trusts" : "distrust"
        )

        ctx.resumeRefresh()
        await ctx.refetchDiscovery()
        ctx.calculateAndTriggerReward(prevTotal)
        setTimeout(
          () => ctx.fetchDataForCurrentPage(),
          DELAYS.REFRESH_AFTER_TX
        )
      } catch (error) {
        logger.error("trustPage error", error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to create ${modalType}`
        setLocalState((prev) => ({ ...prev, error: errorMessage }))
        ctx.resumeRefresh()
      } finally {
        setLocalState((prev) => ({ ...prev, loading: false }))
      }
    },
    [modalTriplets, modalType, certifyWithIntention, trustPage]
  )

  const handleModalClose = useCallback(() => {
    setShowWeightModal(false)
    setModalTriplets([])
    setLocalTrust(initialTrustState)
    setLocalDistrust(initialTrustState)
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
    trustState: localTrust,
    distrustState: localDistrust,
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
