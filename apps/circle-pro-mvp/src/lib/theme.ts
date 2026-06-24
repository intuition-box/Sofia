/**
 * Theme toggle — flips the `.dark` class on <html> (the design-system tokens
 * key off it) and persists the choice. Dark is the default; the pre-paint
 * script in index.html reads the same key to avoid a flash.
 */
export type Theme = 'dark' | 'light'

const KEY = 'sofia-theme'

export function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function applyTheme(t: Theme): void {
  document.documentElement.classList.toggle('dark', t === 'dark')
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* storage unavailable — keep the in-memory toggle */
  }
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
