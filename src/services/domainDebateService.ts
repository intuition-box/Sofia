import { fetchDebateClaims } from './debateService'
import { TOPIC_TO_CLAIM_CATEGORY } from '../config/debateConfig'
import type { DebateClaim } from './debateService'

/**
 * Fetch debate claims filtered by the topic's claim category.
 * e.g. topicId "tech-dev" → category "tech" → only tech claims
 */
export async function fetchDomainClaims(topicId: string): Promise<DebateClaim[]> {
  const category = TOPIC_TO_CLAIM_CATEGORY[topicId]
  const all = await fetchDebateClaims()
  if (!category) return all
  return all.filter((c) => c.category === category)
}
