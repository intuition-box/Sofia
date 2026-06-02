import { Link, useLocation } from 'react-router-dom'
import {
  BurgerIcon,
  ExtIcon,
  InstallIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from './icons'
import { BrandMark } from './BrandMark'

interface NavBarProps {
  theme: 'light' | 'dark'
  onTheme: (t: 'light' | 'dark') => void
  onSearch: () => void
  onBurger: () => void
}

/**
 * Top navigation — ported from the design `NavBar`, wired to React
 * Router. The burger is hidden on desktop (CSS) and opens the
 * mobile Tree drawer; the search pill / ⌘K opens the command
 * palette. Active link is derived from the current route.
 */
export function NavBar({ theme, onTheme, onSearch, onBurger }: NavBarProps) {
  const { pathname } = useLocation()
  const docsActive =
    pathname === '/' ||
    pathname.startsWith('/docs') ||
    pathname === '/manifesto' ||
    pathname === '/architecture'

  return (
    <nav className="dnv">
      <div className="dnv-left">
        <button
          className="dnv-iconbtn dnv-burger"
          onClick={onBurger}
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>
        <Link className="dnv-brand" to="/">
          <BrandMark size={32} />
          <div className="dnv-name">
            Sofia <em>Docs</em>
          </div>
        </Link>
      </div>

      <div className="dnv-links">
        <Link
          className={`dnv-link ${docsActive ? 'active' : ''}`}
          to="/docs/intro"
        >
          Docs
        </Link>
        <a
          className="dnv-link"
          href="https://blog.sofia.intuition.box"
          target="_blank"
          rel="noreferrer"
        >
          Chronicles
          <ExtIcon />
        </a>
      </div>

      <div className="dnv-right">
        <button
          className="dnv-search"
          onClick={onSearch}
          aria-label="Search the docs"
        >
          <SearchIcon />
          <span>Search the docs…</span>
          <span className="sc">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </span>
        </button>
        <div className="dnv-theme" role="tablist" aria-label="Theme">
          <button
            className={theme === 'light' ? 'active' : ''}
            title="Light"
            aria-label="Light theme"
            aria-selected={theme === 'light'}
            role="tab"
            onClick={() => onTheme('light')}
          >
            <SunIcon />
          </button>
          <button
            className={theme === 'dark' ? 'active' : ''}
            title="Dark"
            aria-label="Dark theme"
            aria-selected={theme === 'dark'}
            role="tab"
            onClick={() => onTheme('dark')}
          >
            <MoonIcon />
          </button>
        </div>
        <a
          className="dnv-cta"
          href="https://explorer.sofia.intuition.box"
          target="_blank"
          rel="noreferrer"
        >
          <InstallIcon />
          Open Explorer
        </a>
      </div>
    </nav>
  )
}
