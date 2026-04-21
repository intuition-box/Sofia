import { useState, useCallback } from 'react'
import { getSuggestedPlatforms } from '../config/taxonomy'
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'sofia_topic_selection'
const SYNC_EVENT = 'sofia_topic_selection_sync'

interface TopicSelectionState {
  selectedTopics: string[]
  selectedCategories: string[]
}

const DEFAULT_STATE: TopicSelectionState = { selectedTopics: [], selectedCategories: [] }

function getSnapshot(): TopicSelectionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_STATE
}

function save(state: TopicSelectionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(SYNC_EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener(SYNC_EVENT, callback)
  return () => window.removeEventListener(SYNC_EVENT, callback)
}

// Cache the serialized string to avoid new objects on every getSnapshot call
let cachedJson = ''
let cachedState = DEFAULT_STATE

function getSnapshotStable(): TopicSelectionState {
  const raw = localStorage.getItem(STORAGE_KEY) || ''
  if (raw !== cachedJson) {
    cachedJson = raw
    try {
      cachedState = raw ? JSON.parse(raw) : DEFAULT_STATE
    } catch {
      cachedState = DEFAULT_STATE
    }
  }
  return cachedState
}

export function getCurrentSelection(): TopicSelectionState {
  return getSnapshot()
}

/**
 * Union-merge of remote (on-chain) selection into local state. Never removes
 * locally-selected items that aren't on-chain — pending topics in the cart
 * must survive. Idempotent: early-returns when the merge equals current,
 * so it can be called on every hydration tick without looping.
 */
export function mergeRemoteSelection(remote: {
  topics: string[]
  categories: string[]
}) {
  const current = getSnapshot()
  const mergedTopics = Array.from(new Set([...current.selectedTopics, ...remote.topics]))
  const mergedCategories = Array.from(new Set([...current.selectedCategories, ...remote.categories]))

  const changed =
    mergedTopics.length !== current.selectedTopics.length ||
    mergedCategories.length !== current.selectedCategories.length
  if (!changed) return

  save({ selectedTopics: mergedTopics, selectedCategories: mergedCategories })
}

export function useTopicSelection() {
  const state = useSyncExternalStore(subscribe, getSnapshotStable)

  const MAX_TOPICS = 3

  const toggleTopic = useCallback((topicId: string) => {
    const current = getSnapshot()
    const isSelected = current.selectedTopics.includes(topicId)
    if (!isSelected && current.selectedTopics.length >= MAX_TOPICS) return
    save({
      selectedTopics: isSelected
        ? current.selectedTopics.filter((d) => d !== topicId)
        : [...current.selectedTopics, topicId],
      selectedCategories: current.selectedCategories,
    })
  }, [])

  const toggleCategory = useCallback((categoryId: string) => {
    const current = getSnapshot()
    const isSelected = current.selectedCategories.includes(categoryId)
    save({
      selectedTopics: current.selectedTopics,
      selectedCategories: isSelected
        ? current.selectedCategories.filter((n) => n !== categoryId)
        : [...current.selectedCategories, categoryId],
    })
  }, [])

  const suggestedPlatforms = getSuggestedPlatforms(state.selectedCategories)

  return {
    selectedTopics: state.selectedTopics,
    selectedCategories: state.selectedCategories,
    suggestedPlatforms,
    toggleTopic,
    toggleCategory,
  }
}
