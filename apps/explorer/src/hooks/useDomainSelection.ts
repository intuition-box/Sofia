import { useCallback } from 'react'
import { getSuggestedPlatforms, SOFIA_TOPICS } from '../config/taxonomy'

const STORAGE_KEY = 'sofia_topic_selection'

interface TopicSelectionState {
  selectedTopics: string[]
  selectedCategories: string[]
}

/**
 * Interest selection has been removed (#521): every user now gets EVERY topic
 * and category, so everyone has a score in every interest. These constants are
 * the source of truth that the hook hands out — the picking UI and the
 * per-user localStorage subset are no longer used.
 */
const ALL_TOPIC_IDS: string[] = SOFIA_TOPICS.map((t) => t.id)
const ALL_CATEGORY_IDS: string[] = SOFIA_TOPICS.flatMap((t) =>
  t.categories.map((c) => c.id),
)
const SUGGESTED_PLATFORMS = getSuggestedPlatforms(ALL_CATEGORY_IDS)

function getSnapshot(): TopicSelectionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { selectedTopics: [], selectedCategories: [] }
}

function save(state: TopicSelectionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getCurrentSelection(): TopicSelectionState {
  return getSnapshot()
}

/**
 * Kept for the on-chain hydration path: it still records which topics the
 * wallet owns into localStorage. The selection UI ignores this now (everyone
 * gets every topic), but other readers of `getCurrentSelection` keep working.
 */
export function mergeRemoteSelection(remote: {
  topics: string[]
  categories: string[]
}) {
  const current = getSnapshot()
  const mergedTopics = Array.from(
    new Set([...current.selectedTopics, ...remote.topics]),
  )
  const mergedCategories = Array.from(
    new Set([...current.selectedCategories, ...remote.categories]),
  )
  const changed =
    mergedTopics.length !== current.selectedTopics.length ||
    mergedCategories.length !== current.selectedCategories.length
  if (!changed) return
  save({ selectedTopics: mergedTopics, selectedCategories: mergedCategories })
}

/**
 * Every user is treated as interested in every topic/category. Returns the
 * full set; the toggles are kept as no-ops so existing call sites compile,
 * but picking is no longer a user action.
 */
export function useTopicSelection() {
  const noop = useCallback(() => {}, [])
  return {
    selectedTopics: ALL_TOPIC_IDS,
    selectedCategories: ALL_CATEGORY_IDS,
    suggestedPlatforms: SUGGESTED_PLATFORMS,
    toggleTopic: noop,
    toggleCategory: noop,
  }
}
