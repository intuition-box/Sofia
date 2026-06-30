import { useCallback, useSyncExternalStore } from 'react'

/**
 * Theme store — light / dark with localStorage persistence.
 *
 * The actual class is applied on <html> BEFORE React mounts by the inline
 * anti-FOUC script in index.html (reads the same STORAGE_KEY). This hook just
 * mirrors / mutates that state so the toggle and any theme-aware component
 * stay in sync via useSyncExternalStore.
 *
 * Token layers already flip on the `dark` class:
 *   - design-system theme.css  (`:root,[data-theme=light]` vs `.dark`)
 *   - shadcn tokens globals.css (`:root` vs `.dark`)
 */
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'sofia-theme'

const listeners = new Set<() => void>()

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* private mode / storage disabled — theme still applies for the session */
  }
  listeners.forEach((cb) => cb())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => 'dark' as Theme,
  )

  const setTheme = useCallback((next: Theme) => applyTheme(next), [])
  const toggleTheme = useCallback(
    () => applyTheme(readTheme() === 'dark' ? 'light' : 'dark'),
    [],
  )

  return { theme, setTheme, toggleTheme }
}
