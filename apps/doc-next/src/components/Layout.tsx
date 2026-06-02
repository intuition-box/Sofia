import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  ThemeContext,
  THEME_STORAGE_KEY,
  readInitialTheme,
} from '~/hooks/useTheme'
import { activeIdFromPath } from '~/lib/paths'
import { NavBar } from './NavBar'
import { Footer } from './Footer'
import { Drawer } from './Drawer'
import { SearchOverlay } from './SearchOverlay'

/**
 * Layout — the single shell rendered around every route (mirrors
 * apps/blog's Layout pattern). Owns:
 *   - theme state (light / dark, persisted, both intentional)
 *   - the ⌘K command palette
 *   - the mobile nav drawer
 *   - scroll-to-top on route change (RR has no Docusaurus-style
 *     reset by default)
 *
 * Pages render only their inner `.shell` grid; navbar + footer +
 * overlays live here.
 */
export function Layout() {
  const { pathname } = useLocation()
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    readInitialTheme,
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Active doc id for the tree / drawer highlight — `/docs/<id>`,
  // or the special pages mapped back to their tree id (see paths.ts).
  const activeId = activeIdFromPath(pathname)

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, t)
    } catch {
      /* storage may be unavailable (private mode) — non-fatal */
    }
  }, [])

  /* Mirror the theme onto <html data-theme> so the pre-paint
     background fallback in global.css matches the app shell. */
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  /* Scroll reset on navigation (window is an external system, so
     this stays in an effect — mirrors apps/blog's Layout). The
     drawer and search palette close from their own handlers
     (Tree links / result clicks / Esc), so no setState here. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  /* Global ⌘K / Ctrl+K → open search. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`docs-app theme-${theme}`}>
        <NavBar
          theme={theme}
          onTheme={setTheme}
          onSearch={() => setSearchOpen(true)}
          onBurger={() => setDrawerOpen(true)}
        />
        <main className="main">
          <Outlet />
        </main>
        <Footer />
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          activeId={activeId}
        />
        {searchOpen && (
          <SearchOverlay onClose={() => setSearchOpen(false)} />
        )}
      </div>
    </ThemeContext.Provider>
  )
}
