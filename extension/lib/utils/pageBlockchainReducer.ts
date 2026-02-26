/**
 * Reducer + constants for usePageBlockchainData
 * Pure function: state + action → state
 */

import type {
  PageBlockchainCounts,
  PageBlockchainState,
  PageBlockchainAction
} from "~/types/page"
import type { IntentionPurpose } from "~/types/intentionCategories"

// ─── Constants ──────────────────────────────────────────────────────────────

export const DEFAULT_COUNTS: PageBlockchainCounts = {
  atomsCount: 0,
  triplesCount: 0,
  displayedAtomsCount: 0,
  displayedTriplesCount: 0,
  totalShares: 0,
  totalPositions: 0,
  attestationsCount: 0,
  trustCount: 0,
  distrustCount: 0,
  totalSupport: 0,
  trustRatio: 50,
  domainTrustCount: 0,
  domainDistrustCount: 0,
  domainTotalSupport: 0,
  domainTrustRatio: 50
}

export const EMPTY_INTENTIONS: Record<IntentionPurpose, number> = {
  for_work: 0,
  for_learning: 0,
  for_fun: 0,
  for_inspiration: 0,
  for_buying: 0,
  for_music: 0
}

export const PAGE_BLOCKCHAIN_INITIAL_STATE: PageBlockchainState = {
  currentUrl: null,
  pageTitle: null,
  isRestricted: false,
  restrictionMessage: null,
  triplets: [],
  counts: DEFAULT_COUNTS,
  atomsList: [],
  pageAtomIds: [],
  totalCertifications: 0,
  discoveryStatus: null,
  certificationRank: null,
  userHasCertified: false,
  intentionStats: EMPTY_INTENTIONS,
  pageIntentionStats: EMPTY_INTENTIONS,
  intentionTotal: 0,
  pageIntentionTotal: 0,
  maxIntentionCount: 1,
  pageMaxIntentionCount: 1,
  status: "loading",
  error: null
}

// ─── Reducer ────────────────────────────────────────────────────────────────

export function pageBlockchainReducer(
  state: PageBlockchainState,
  action: PageBlockchainAction
): PageBlockchainState {
  switch (action.type) {
    case "SET_PAGE_META":
      return { ...state, currentUrl: action.url, pageTitle: action.title }
    case "SET_RESTRICTION":
      return {
        ...state,
        isRestricted: action.restricted,
        restrictionMessage: action.message
      }
    case "SET_DATA":
      return {
        ...state,
        triplets: action.triplets,
        counts: action.counts,
        atomsList: action.atomsList,
        pageAtomIds: action.pageAtomIds,
        totalCertifications: action.totalCertifications,
        discoveryStatus: action.discoveryStatus,
        certificationRank: action.certificationRank,
        userHasCertified: action.userHasCertified,
        intentionStats: action.intentionStats,
        pageIntentionStats: action.pageIntentionStats,
        intentionTotal: action.intentionTotal,
        pageIntentionTotal: action.pageIntentionTotal,
        maxIntentionCount: action.maxIntentionCount,
        pageMaxIntentionCount: action.pageMaxIntentionCount,
        status: "ready",
        error: null
      }
    case "SET_STATUS":
      return { ...state, status: action.status }
    case "SET_ERROR":
      return { ...state, error: action.error }
    case "SET_TITLE":
      return { ...state, pageTitle: action.title }
    case "SET_NO_ACCOUNT":
      return { ...state, triplets: [], status: "ready" }
    case "SET_RESTRICTED_READY":
      return { ...state, triplets: [], status: "ready" }
    case "RESET":
      return { ...PAGE_BLOCKCHAIN_INITIAL_STATE }
    default:
      return state
  }
}
