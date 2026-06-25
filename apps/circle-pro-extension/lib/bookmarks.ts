// Saved-bookmark storage + the qualification payload. The PoC keeps everything
// in chrome.storage.local; when we wire infra, `saveBookmark` becomes a backend
// POST (the payload shape below is already the real one) sponsored by the team.

/** A taxonomy context the user tagged the page with (topic / category / niche). */
export interface Context {
  id: string
  label: string
  color: string
  /** Where it sits in the taxonomy. */
  level: "topic" | "category" | "niche"
}

export interface SavedBookmark {
  url: string
  /** Normalised URL — the stable join key (see normalizeUrl). */
  normalizedUrl: string
  title: string
  favicon: string
  /** Free-text note — the "why it's useful", flows to Sofia Pro's PostDetail
   *  "Your context". The context only you have. */
  context: string
  /** Taxonomy tags — the qualification. No intentions, per the spec. */
  contexts: Context[]
  addedAt: number
}

const KEY = "bookmarks"

export async function getBookmarks(): Promise<SavedBookmark[]> {
  const { bookmarks = [] } = await chrome.storage.local.get(KEY)
  return bookmarks as SavedBookmark[]
}

export async function saveBookmark(item: SavedBookmark): Promise<void> {
  const bookmarks = await getBookmarks()
  // Dedup on the normalised URL — re-sharing replaces the prior entry.
  const next = [item, ...bookmarks.filter((b) => b.normalizedUrl !== item.normalizedUrl)]
  await chrome.storage.local.set({ [KEY]: next })
}

export async function clearBookmarks(): Promise<void> {
  await chrome.storage.local.set({ [KEY]: [] })
}
