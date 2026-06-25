/**
 * "My bookmarks" curation store — the user owns this PRIVATE knowledge base:
 * they add bookmarks, write their own context, set a manual order, and tag a
 * topic. Private and persisted in IndexedDB (survives reloads). Sharing a
 * bookmark to the group is a separate, explicit action (POST to the backend);
 * `shared` just remembers which URLs the user has shared.
 *
 * Event-based module store (no provider), with an IndexedDB mirror.
 */
import { useSyncExternalStore } from 'react'
import { idbGet, idbSet } from './idb'

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
  /** URLs the user has shared to the group (published to the backend). */
  shared: Record<string, boolean>
}

const EMPTY: MyState = { added: [], context: {}, order: [], topics: {}, shared: {} }
const IDB_KEY = 'mybookmarks'

let state: MyState = EMPTY
const listeners = new Set<() => void>()
const emit = () => {
  void idbSet(IDB_KEY, state) // persist the private collection
  for (const l of listeners) l()
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// Rehydrate from IndexedDB on load, then notify React.
void idbGet<Partial<MyState>>(IDB_KEY).then((saved) => {
  if (saved) {
    state = { ...EMPTY, ...saved }
    for (const l of listeners) l()
  }
})

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
export function setOrder(urls: string[]): void {
  state = { ...state, order: urls }
  emit()
}
export function setTopic(url: string, id: string): void {
  state = { ...state, topics: { ...state.topics, [url]: id } }
  emit()
}
/** Mark a URL as shared to the group (after a successful backend POST). */
export function markShared(url: string): void {
  state = { ...state, shared: { ...state.shared, [url]: true } }
  emit()
}

export function useMyBookmarks(): MyState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}
