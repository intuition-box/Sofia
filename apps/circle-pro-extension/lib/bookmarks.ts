// Saved-bookmark storage. The PoC keeps everything in chrome.storage.local;
// when we wire infra, `saveBookmark` becomes a backend POST (reusing the same
// bookmarkKey normalisation as circle-pro-mvp) sponsored by the team.

export interface SavedBookmark {
  url: string
  title: string
  teamId: string
  teamLabel: string
  addedAt: number
}

const KEY = "bookmarks"

export async function getBookmarks(): Promise<SavedBookmark[]> {
  const { bookmarks = [] } = await chrome.storage.local.get(KEY)
  return bookmarks as SavedBookmark[]
}

export async function saveBookmark(item: SavedBookmark): Promise<void> {
  const bookmarks = await getBookmarks()
  bookmarks.unshift(item)
  await chrome.storage.local.set({ [KEY]: bookmarks })
}

export async function clearBookmarks(): Promise<void> {
  await chrome.storage.local.set({ [KEY]: [] })
}
