/**
 * useGroupTopics — resolves the on-chain topics tagged onto a group.
 *
 * A circle's visual signature (hero color, default chip color) is
 * derived from the first topic the group was tagged with at creation
 * (`group → has_tag → topic`). This hook fetches those nested triples
 * for a single group, maps the object atom ids back to the local
 * taxonomy via `ATOM_ID_TO_TOPIC`, and surfaces the slimmed result.
 *
 * Stays non-blocking: callers that want a synchronous color can fall
 * back to a default while `topics` is empty. React Query caches the
 * result for 10 minutes — long enough that hopping in and out of a
 * group detail page never re-fetches.
 */
import { useQuery } from '@tanstack/react-query'
import { GRAPHQL_URL } from '@/config'
import {
  ATOM_ID_TO_TOPIC,
  HAS_TAG_PREDICATE_ID,
} from '@/config/atomIds'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import type { GroupTopicSummary } from '@/lib/circleBuilders'

const STALE_TIME_MS = 10 * 60 * 1000
const GC_TIME_MS = 60 * 60 * 1000

const GET_GROUP_TOPICS = `
  query GetGroupTopics($groupTermId: String!, $hasTagPredicateId: String!) {
    triples(
      where: {
        subject_id: { _eq: $groupTermId }
        predicate_id: { _eq: $hasTagPredicateId }
      }
      limit: 50
    ) {
      object_id
    }
  }
`

// Indexable lookup so the GraphQL → taxonomy join stays O(N) with N
// small (≤ 14 topics). Built once at module load.
const TOPIC_BY_ID = new Map(SOFIA_TOPICS.map((t) => [t.id, t]))

async function fetchGroupTopics(
  termId: string,
): Promise<GroupTopicSummary[]> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_GROUP_TOPICS,
      variables: {
        groupTermId: termId,
        hasTagPredicateId: HAS_TAG_PREDICATE_ID,
      },
    }),
  })
  const json = (await res.json()) as {
    data?: { triples?: Array<{ object_id?: string }> }
  }

  const topics: GroupTopicSummary[] = []
  const seen = new Set<string>()
  for (const t of json.data?.triples ?? []) {
    if (!t.object_id) continue
    const slug = ATOM_ID_TO_TOPIC.get(t.object_id)
    if (!slug || seen.has(slug)) continue
    const meta = TOPIC_BY_ID.get(slug)
    if (!meta) continue
    seen.add(slug)
    topics.push({ id: meta.id, label: meta.label, color: meta.color })
  }
  return topics
}

export interface UseGroupTopicsResult {
  topics: GroupTopicSummary[]
  isLoading: boolean
  error: string | null
}

export function useGroupTopics(
  termId: string | undefined,
): UseGroupTopicsResult {
  const enabled = Boolean(termId)
  const { data, isLoading, error } = useQuery<GroupTopicSummary[]>({
    queryKey: ['group-topics', termId],
    queryFn: () => fetchGroupTopics(termId!),
    enabled,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })

  return {
    topics: data ?? [],
    isLoading: enabled && isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
  }
}
