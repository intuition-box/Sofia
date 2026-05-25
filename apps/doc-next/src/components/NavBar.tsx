import { Link, useLocation } from 'react-router-dom'
import {
  BurgerIcon,
  CaretIcon,
  ExtIcon,
  GithubIcon,
  InstallIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from './icons'

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
  const active = pathname.startsWith('/litepaper')
    ? 'litepaper'
    : 'docs'

  return (
    <nav className="dnv">
      <div className="dnv-left">
        <button
          className="dnv-iconbtn dnv-burger"
          onClick={onBurger}
          aria-label="Open menu">
          <BurgerIcon />
        </button>
        <Link className="dnv-brand" to="/">
          <span className="dnv-mark">S</span>
          <span>
            <div className="dnv-name">
              Sofia <em>Docs</em>
            </div>
            <div className="dnv-tag">docs.sofia.intuition.box</div>
          </span>
        </Link>
      </div>

      <div className="dnv-links">
        <Link
          className={`dnv-link ${active === 'docs' ? 'active' : ''}`}
          to="/docs/intro">
          Docs
          <CaretIcon />
        </Link>
        <Link className="dnv-link" to="/docs/features/getting-started">
          Guides
        </Link>
        <Link
          className={`dnv-link ${active === 'litepaper' ? 'active' : ''}`}
          to="/litepaper">
          Litepaper
        </Link>
        <a
          className="dnv-link"
          href="https://discord.gg/sofia3"
          target="_blank"
          rel="noreferrer">
          Community
          <CaretIcon />
        </a>
        <a
          className="dnv-link"
          href="https://blog.sofia.intuition.box"
          target="_blank"
          rel="noreferrer">
          Chronicles
          <ExtIcon />
        </a>
      </div>

      <div className="dnv-right">
        <button
          className="dnv-search"
          onClick={onSearch}
          aria-label="Search the docs">
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
            onClick={() => onTheme('light')}>
            <SunIcon />
          </button>
          <button
            className={theme === 'dark' ? 'active' : ''}
            title="Dark"
            aria-label="Dark theme"
            aria-selected={theme === 'dark'}
            role="tab"
            onClick={() => onTheme('dark')}>
            <MoonIcon />
          </button>
        </div>
        <a
          className="dnv-iconbtn"
          aria-label="GitHub"
          href="https://github.com/intuition-box"
          target="_blank"
          rel="noreferrer">
          <GithubIcon />
        </a>
        <a
          className="dnv-cta"
          href="https://sofia.intuition.box"
          target="_blank"
          rel="noreferrer">
          <InstallIcon />
          Install
        </a>
      </div>
    </nav>
  )
}
