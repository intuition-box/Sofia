/**
 * "My bookmarks" curation store — the user owns this knowledge base: they add
 * bookmarks, write their own context ("why it's useful") on any URL, and set a
 * manual order. Event-based module store (no provider), like the gate store.
 */
import { useSyncExternalStore } from 'react'

export interface AddedBookmark {
  title: string
  url: string
  host: string
  topicId: string
  categoryId: string
  nicheId: string
  teamId: string
}

interface MyState {
  /** Bookmarks the user added themselves (newest first). */
  added: AddedBookmark[]
  /** Per-URL custom context the user wrote (overrides the default note). */
  context: Record<string, string>
  /** URLs the user manually positioned, in order (floated to the top). */
  order: string[]
  /** Per-URL "in context of" topic (taxonomy category id) the user assigned. */
  topics: Record<string, string>
}

let state: MyState = { added: [], context: {}, order: [], topics: {} }
const listeners = new Set<() => void>()
const emit = () => {
  for (const l of listeners) l()
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function addBookmark(b: AddedBookmark): void {
  state = { ...state, added: [b, ...state.added.filter((x) => x.url !== b.url)] }
  emit()
}
export function setContext(url: string, text: string): void {
  const context = { ...state.context }
  if (text.trim()) context[url] = text.trim()
  else delete context[url]
  state = { ...state, context }
  emit()
}
// NOTE(audit 2026-06-25): export mort — `setOrder` n'est importé nulle part. À supprimer (ou implémenter le pin d'ordre prévu). Laissé en place (consigne : ne rien supprimer).
export function setOrder(urls: string[]): void {
  state = { ...state, order: urls }
  emit()
}
export function setTopic(url: string, id: string): void {
  state = { ...state, topics: { ...state.topics, [url]: id } }
  emit()
}

export function useMyBookmarks(): MyState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}
