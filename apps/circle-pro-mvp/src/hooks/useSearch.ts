/**
 * useSearch — the group's knowledge access. Debounced real-data hints while
 * typing, full grouped results on submit. Reads are public (guests included);
 * a signed-in token is sent when available.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { localTaxonomyHints } from '../data/taxonomyHints'
import {
  searchAll,
  searchHints,
  type SearchHint,
  type SearchResults,
} from '../services/circleProApi'

/** Merge instant local hints with backend hints, dedup, local first. */
function mergeHints(local: SearchHint[], remote: SearchHint[], limit = 8): SearchHint[] {
  const seen = new Set<string>()
  const out: SearchHint[] = []
  for (const h of [...local, ...remote]) {
    const key = `${h.type}:${h.label.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(h)
    if (out.length >= limit) break
  }
  return out
}

export function useSearch() {
  const { authenticated, token } = useAuth()
  const [query, setQuery] = useState('')
  const [remoteHints, setRemoteHints] = useState<SearchHint[]>([])
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  const getToken = useCallback(
    async () => (authenticated ? await token() : null),
    [authenticated, token],
  )

  // INSTANT taxonomy hints (in-memory, no network) — appear on the first letter.
  const localHints = useMemo(() => localTaxonomyHints(query), [query])
  const hints = useMemo(() => mergeHints(localHints, remoteHints), [localHints, remoteHints])

  // Backend hints (real tags/titles/handles) — short debounce, append to local.
  useEffect(() => {
    if (query.trim().length < 1) {
      setRemoteHints([])
      return
    }
    let alive = true
    const t = setTimeout(async () => {
      try {
        const h = await searchHints(await getToken(), query)
        if (alive) setRemoteHints(h)
      } catch {
        if (alive) setRemoteHints([])
      }
    }, 120)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [query, getToken])

  const run = useCallback(
    async (q?: string) => {
      const term = (q ?? query).trim()
      if (term.length < 2) return
      if (q !== undefined) setQuery(q)
      setRemoteHints([])
      setLoading(true)
      try {
        setResults(await searchAll(await getToken(), term))
      } catch {
        setResults({ query: term, bookmarks: [], comments: [], people: [] })
      } finally {
        setLoading(false)
      }
    },
    [query, getToken],
  )

  const clear = useCallback(() => {
    setResults(null)
    setQuery('')
    setRemoteHints([])
  }, [])

  return { query, setQuery, hints, results, loading, run, clear }
}
