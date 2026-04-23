import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sofia-nav'

function readInitial(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

/**
 * Persists the left nav collapsed state to `localStorage['sofia-nav']`.
 * Mirrors proto-explorer's `useNavCollapse` hook.
 */
export function useNavCollapse() {
  const [collapsed, setCollapsed] = useState<boolean>(readInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded')
    } catch {
      // ignore — private mode / storage full
    }
  }, [collapsed])

  const toggle = useCallback(() => setCollapsed((c) => !c), [])

  return { collapsed, toggle }
}
