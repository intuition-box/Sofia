/**
 * Circle Interest Utilities
 * Pure functions for fetching, aggregating, and comparing circle member interests.
 * No hooks, no side effects — callable from async flows.
 */

import { intuitionGraphqlClient } from '../clients/graphql-client'
import { GetUserIntentionPositionsDocument } from '@0xsofia/graphql'
import { PREDICATE_IDS, PREDICATE_NAMES } from '../config/chainConfig'
import type { Interest, DomainActivityGroup, InterestFromAgent } from '../../types/interests'
import { enrichInterest } from '../../types/interests'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemberInfo {
  address: string
  label: string
  image?: string
}

export interface ForYouRecommendation {
  domain: string
  favicon: string
  interestName: string    // AI-classified interest category name
  interestColor?: string  // optional color for badge
  certifiedBy: MemberInfo[]
  totalCertifications: number
}

interface CachedMemberActivity {
  groups: DomainActivityGroup[]
  cachedAt: number
}

interface CachedCircleRecs {
  recommendations: ForYouRecommendation[]
  circleInterests: Interest[]
  matchedCategories: string[]
  memberDomainMap: Record<string, MemberInfo[]>
  cachedAt: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MEMBER_ACTIVITY_CACHE_PREFIX = 'sofia_member_activity_'
const CIRCLE_RECS_CACHE_PREFIX = 'sofia_circle_recs_'
const MEMBER_ACTIVITY_TTL = 24 * 60 * 60 * 1000 // 24 hours
const CIRCLE_RECS_TTL = 60 * 60 * 1000           // 1 hour

// Only intention predicates (not OAuth)
const INTENTION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING,
  PREDICATE_IDS.VISITS_FOR_MUSIC
].filter(Boolean)

// Map predicate ID → predicate label (for DomainActivityGroup format)
const PREDICATE_ID_TO_LABEL: Record<string, string> = {}
if (PREDICATE_IDS.VISITS_FOR_WORK) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_WORK] = PREDICATE_NAMES.VISITS_FOR_WORK
if (PREDICATE_IDS.VISITS_FOR_LEARNING) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_LEARNING] = PREDICATE_NAMES.VISITS_FOR_LEARNING
if (PREDICATE_IDS.VISITS_FOR_FUN) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_FUN] = PREDICATE_NAMES.VISITS_FOR_FUN
if (PREDICATE_IDS.VISITS_FOR_INSPIRATION) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_INSPIRATION] = PREDICATE_NAMES.VISITS_FOR_INSPIRATION
if (PREDICATE_IDS.VISITS_FOR_BUYING) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_BUYING] = PREDICATE_NAMES.VISITS_FOR_BUYING
if (PREDICATE_IDS.VISITS_FOR_MUSIC) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_MUSIC] = PREDICATE_NAMES.VISITS_FOR_MUSIC

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

export function loadMemberActivityCache(memberWallet: string): DomainActivityGroup[] | null {
  try {
    const raw = localStorage.getItem(`${MEMBER_ACTIVITY_CACHE_PREFIX}${memberWallet.toLowerCase()}`)
    if (!raw) return null
    const cached: CachedMemberActivity = JSON.parse(raw)
    if (Date.now() - cached.cachedAt > MEMBER_ACTIVITY_TTL) return null
    return cached.groups
  } catch {
    return null
  }
}

export function saveMemberActivityCache(memberWallet: string, groups: DomainActivityGroup[]): void {
  try {
    const data: CachedMemberActivity = { groups, cachedAt: Date.now() }
    localStorage.setItem(`${MEMBER_ACTIVITY_CACHE_PREFIX}${memberWallet.toLowerCase()}`, JSON.stringify(data))
  } catch { /* localStorage full, ignore */ }
}

export function loadCircleRecsCache(userWallet: string): CachedCircleRecs | null {
  try {
    const raw = localStorage.getItem(`${CIRCLE_RECS_CACHE_PREFIX}${userWallet.toLowerCase()}`)
    if (!raw) return null
    const cached: CachedCircleRecs = JSON.parse(raw)
    if (Date.now() - cached.cachedAt > CIRCLE_RECS_TTL) return null
    return cached
  } catch {
    return null
  }
}

export function saveCircleRecsCache(userWallet: string, data: Omit<CachedCircleRecs, 'cachedAt'>): void {
  try {
    const toSave: CachedCircleRecs = { ...data, cachedAt: Date.now() }
    localStorage.setItem(`${CIRCLE_RECS_CACHE_PREFIX}${userWallet.toLowerCase()}`, JSON.stringify(toSave))
  } catch { /* localStorage full, ignore */ }
}

export function clearCircleRecsCache(userWallet: string): void {
  localStorage.removeItem(`${CIRCLE_RECS_CACHE_PREFIX}${userWallet.toLowerCase()}`)
}

export function clearAllMemberActivityCaches(memberWallets: string[]): void {
  for (const wallet of memberWallets) {
    localStorage.removeItem(`${MEMBER_ACTIVITY_CACHE_PREFIX}${wallet.toLowerCase()}`)
  }
}

// ---------------------------------------------------------------------------
// Domain extraction (same logic as useOnChainIntentionGroups)
// ---------------------------------------------------------------------------

function normalizeDomain(domain: string): string {
  const lower = domain.toLowerCase()
  const prefixes = ['www.', 'open.', 'm.', 'mobile.', 'app.', 'web.']
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) return lower.slice(prefix.length)
  }
  return lower
}

function extractDomain(label: string): string | null {
  if (!label) return null
  try {
    const cleaned = label.replace(/^https?:\/\//, '')
    const domain = cleaned.split('/')[0]
    if (domain && domain.includes('.')) return normalizeDomain(domain)
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Fetch member domain activity via GraphQL
// ---------------------------------------------------------------------------

/**
 * Fetch a single member's certified URLs grouped by domain.
 * Returns DomainActivityGroup[] in the same format the skillsAnalysisAgent expects.
 */
export async function fetchMemberDomainActivity(walletAddress: string): Promise<DomainActivityGroup[]> {
  if (INTENTION_PREDICATE_IDS.length === 0) return []

  const response = await intuitionGraphqlClient.request(GetUserIntentionPositionsDocument, {
    predicateIds: INTENTION_PREDICATE_IDS,
    userAddress: `%${walletAddress.toLowerCase()}%`
  })

  const triples = response?.triples || []
  const domainMap = new Map<string, Record<string, number>>()

  for (const triple of triples) {
    const url = triple.object?.value?.thing?.url || triple.object?.label || ''
    const domain = extractDomain(url)
    if (!domain) continue

    const predicateId = triple.predicate?.term_id || ''
    const predicateLabel = PREDICATE_ID_TO_LABEL[predicateId]
    if (!predicateLabel) continue

    if (!domainMap.has(domain)) {
      domainMap.set(domain, {})
    }
    const predicates = domainMap.get(domain)!
    predicates[predicateLabel] = (predicates[predicateLabel] || 0) + 1
  }

  // Convert to DomainActivityGroup format
  return Array.from(domainMap.entries()).map(([domain, predicates]) => {
    const count = Object.values(predicates).reduce((sum, n) => sum + n, 0)
    return {
      key: domain,
      count,
      total_shares: '0',
      predicates
    }
  })
}

// ---------------------------------------------------------------------------
// Aggregate activities across multiple members
// ---------------------------------------------------------------------------

/**
 * Merge domain groups from multiple members into one combined dataset.
 * Same domain from different members → sum predicate counts.
 */
export function aggregateActivities(perMember: DomainActivityGroup[][]): DomainActivityGroup[] {
  const merged = new Map<string, Record<string, number>>()

  for (const memberGroups of perMember) {
    for (const group of memberGroups) {
      if (!merged.has(group.key)) {
        merged.set(group.key, {})
      }
      const existing = merged.get(group.key)!
      for (const [pred, count] of Object.entries(group.predicates)) {
        existing[pred] = (existing[pred] || 0) + count
      }
    }
  }

  return Array.from(merged.entries())
    .map(([domain, predicates]) => ({
      key: domain,
      count: Object.values(predicates).reduce((sum, n) => sum + n, 0),
      total_shares: '0',
      predicates
    }))
    .sort((a, b) => b.count - a.count)
}

// ---------------------------------------------------------------------------
// Build member→domain attribution map
// ---------------------------------------------------------------------------

/**
 * Track which members certified which domains.
 */
export function buildMemberDomainMap(
  memberActivities: { member: MemberInfo; groups: DomainActivityGroup[] }[]
): Map<string, MemberInfo[]> {
  const map = new Map<string, MemberInfo[]>()

  for (const { member, groups } of memberActivities) {
    for (const group of groups) {
      if (!map.has(group.key)) {
        map.set(group.key, [])
      }
      const existing = map.get(group.key)!
      if (!existing.some(m => m.address.toLowerCase() === member.address.toLowerCase())) {
        existing.push(member)
      }
    }
  }

  return map
}

// ---------------------------------------------------------------------------
// Fuzzy interest name matching (from useInterestAnalysis.ts)
// ---------------------------------------------------------------------------

export function areInterestNamesSimilar(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()
  if (n1 === n2) return true
  if (n1.includes(n2) || n2.includes(n1)) return true
  const firstWord1 = n1.split(/\s+/)[0]
  const firstWord2 = n2.split(/\s+/)[0]
  if (firstWord1 === firstWord2 && firstWord1.length > 4) return true
  return false
}

// ---------------------------------------------------------------------------
// Find recommendations by comparing user & circle interests
// ---------------------------------------------------------------------------

/**
 * Compare user's AI-classified interests with the circle's AI-classified interests.
 * For each matching interest category, find circle domains the user doesn't have.
 */
export function findRecommendations(
  userInterests: Interest[],
  circleInterests: Interest[],
  memberDomainMap: Map<string, MemberInfo[]>
): { recommendations: ForYouRecommendation[]; matchedCategories: string[] } {
  // Build a set of all user domains across all interests
  const userDomainSet = new Set<string>()
  for (const interest of userInterests) {
    for (const domain of interest.domains) {
      userDomainSet.add(domain.toLowerCase())
    }
  }

  const recommendations: ForYouRecommendation[] = []
  const matchedCategories = new Set<string>()

  for (const circleInterest of circleInterests) {
    // Find a matching user interest by fuzzy name
    const matchingUserInterest = userInterests.find(ui =>
      areInterestNamesSimilar(ui.name, circleInterest.name)
    )
    if (!matchingUserInterest) continue

    matchedCategories.add(circleInterest.name)

    // Find circle domains NOT in user's domain set
    for (const domain of circleInterest.domains) {
      if (userDomainSet.has(domain.toLowerCase())) continue

      const certifiers = memberDomainMap.get(domain) || []
      if (certifiers.length === 0) continue

      // Count total certifications for this domain from the aggregated data
      const totalCerts = certifiers.length

      recommendations.push({
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        interestName: circleInterest.name,
        certifiedBy: certifiers,
        totalCertifications: totalCerts
      })
    }
  }

  // Sort: most certifiers first, then alphabetically
  recommendations.sort((a, b) => {
    if (b.certifiedBy.length !== a.certifiedBy.length) {
      return b.certifiedBy.length - a.certifiedBy.length
    }
    return a.domain.localeCompare(b.domain)
  })

  return {
    recommendations,
    matchedCategories: Array.from(matchedCategories)
  }
}

// ---------------------------------------------------------------------------
// Enrich agent response (re-export for convenience)
// ---------------------------------------------------------------------------

export { enrichInterest }
export type { Interest, InterestFromAgent, DomainActivityGroup }
