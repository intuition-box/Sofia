import { NavLink } from 'react-router-dom'
import { Globe, Users, Layers, Trophy, User, type LucideIcon } from 'lucide-react'

interface BottomNavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Visually raise this entry as a primary "compose" FAB. */
  primary?: boolean
  /** Hidden when the user isn't authenticated. The shell still renders
   *  the spot so the layout doesn't shift across auth states. */
  authRequired?: boolean
}

const NAV_ITEMS: BottomNavItem[] = [
  { to: '/feed', label: 'Explore', icon: Globe },
  { to: '/circles', label: 'Circles', icon: Users, authRequired: true },
  { to: '/compose', label: 'Compose', icon: Layers, primary: true, authRequired: true },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User, authRequired: true },
]

interface BottomNavProps {
  /** When false (user not logged in), auth-required entries get a
   *  disabled visual treatment instead of being dropped — keeps the
   *  layout stable across login state. */
  authenticated?: boolean
  /** Fires when a disabled (auth-required) item is tapped so the host
   *  can show the login prompt. */
  onAuthRequired?: () => void
}

/**
 * BottomNav — fixed 64px (+ safe-area-inset) bottom bar shown only on
 * viewports <768px. Five routes, even spacing, the centre "Compose"
 * entry is raised as a FAB so it reads as the primary action.
 *
 * Styling chassis comes from `.app-bottom-nav` in app-shell.css; this
 * component owns the per-item content and active-route highlighting.
 */
export function BottomNav({ authenticated = false, onAuthRequired }: BottomNavProps) {
  return (
    <nav className="app-bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const disabled = item.authRequired && !authenticated
        const baseCls =
          'group relative flex flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium leading-none tracking-wider transition-colors'
        const inkCls = disabled
          ? 'text-muted-foreground/40'
          : 'text-muted-foreground hover:text-foreground'

        if (disabled) {
          return (
            <button
              key={item.to}
              type="button"
              onClick={onAuthRequired}
              aria-label={`${item.label} (login required)`}
              className={`${baseCls} ${inkCls}`}>
              <Icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          )
        }

        if (item.primary) {
          /* Compose FAB — pulled up 12px, accent fill, distinct shape so
             it reads as the primary action. The label sits below the
             bubble at the same baseline as the other items. */
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                `${baseCls} ${isActive ? 'text-accent' : inkCls}`
              }>
              <span className="relative -mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg ring-4 ring-background transition-transform group-hover:scale-105">
                <Icon size={22} strokeWidth={2.2} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          )
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.label}
            className={({ isActive }) =>
              `${baseCls} ${isActive ? 'text-accent' : inkCls}`
            }>
            <Icon size={20} strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
