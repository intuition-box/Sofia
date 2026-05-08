/**
 * useSearchAccounts — explorer-side React wrapper around the shared
 * `searchAccounts` async helper from `@0xsofia/graphql` (the same data
 * layer the extension's Circle search uses). Debounces the input query
 * and cancels stale in-flight requests via a request token.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { type AccountAtom, searchAccounts } from '@0xsofia/graphql'

interface UseSearchAccountsOptions {
  /** Debounce delay in ms before issuing the network request. Default 300. */
  debounceMs?: number
  /** Minimum query length before searching. Default 1. */
  minLength?: number
}

interface UseSearchAccountsResult {
  query: string
  setQuery: (q: string) => void
  results: AccountAtom[]
  loading: boolean
  /** Convenience flag — query non-empty (>= minLength). */
  isActive: boolean
  reset: () => void
}

export function useSearchAccounts(
  options: UseSearchAccountsOptions = {},
): UseSearchAccountsResult {
  const { debounceMs = 300, minLength = 1 } = options
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AccountAtom[]>([])
  const [loading, setLoading] = useState(false)
  const reqRef = useRef(0)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < minLength) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const token = ++reqRef.current
    const timer = setTimeout(async () => {
      const next = await searchAccounts(trimmed)
      if (reqRef.current === token) {
        setResults(next)
        setLoading(false)
      }
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs, minLength])

  const reset = useCallback(() => {
    reqRef.current++
    setQuery('')
    setResults([])
    setLoading(false)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    isActive: query.trim().length >= minLength,
    reset,
  }
}

export type { AccountAtom }
