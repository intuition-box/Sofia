/**
 * React Query persister cache version.
 *
 * Bump this string whenever the shape of a persisted query changes
 * (new field, renamed key, changed return type). The PersistQueryClientProvider
 * detects the mismatch on load and wipes the cached entries automatically,
 * which means zero support tickets from the ~20-40 installed users when we
 * ship a breaking change.
 *
 * Bump rules:
 * - Add a new optional field to a return type → no bump needed
 * - Rename a query key, change a return type, restructure a payload → bump
 */
export const CACHE_VERSION = "v1"
