import { createContext, useContext } from 'react'
import type { Theme } from '~/lib/types'

/**
 * Theme context — light / dark, both intentional (per the docs
 * brief). Default dark. The provider lives in Layout; it persists
 * the choice to localStorage and mirrors it onto
 * `document.documentElement[data-theme]` (so the pre-paint
 * fallback in global.css matches) plus the `.docs-app` root class
 * (`theme-light` / `theme-dark`) the design tokens key off.
 */
export const ThemeContext = createContext<Theme>({
  theme: 'dark',
  setTheme: () => {},
})

export function useTheme(): Theme {
  return useContext(ThemeContext)
}

export const THEME_STORAGE_KEY = 'sofia-docs-theme'

export function readInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}
