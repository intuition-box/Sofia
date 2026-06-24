/**
 * Store for the bookmarks the user imported during onboarding, so the Activity
 * ▸ Bookmarks lens can show them right after import. Event-based (like the gate
 * store) — no provider needed.
 */
import { useSyncExternalStore } from 'react'

export interface ImportedBookmark {
  title: string
  url: string
  host: string
  topicId: string
  likes: number
  curators: number
  certified: boolean
}

let items: ImportedBookmark[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function snapshot(): ImportedBookmark[] {
  return items
}

/** Replace the imported set (most-recent import wins). */
export function setImported(next: ImportedBookmark[]): void {
  items = next
  emit()
}

export function useImported(): ImportedBookmark[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
