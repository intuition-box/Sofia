import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import {
  NavSidebar as DsNavSidebar,
  NavBrand,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import { getTopicEmoji } from '@/config/topicEmoji'
import {
  Home,
  User,
  Trophy,
  Flame,
  Vote,
  BarChart3,
  Globe,
} from 'lucide-react'
import { useTopicSelection } from '../hooks/useDomainSelection'
import { SEASON_END } from '../config'

function getTimeLeft() {
  const diff = SEASON_END.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function NavSidebar() {
  const location = useLocation()
  const { authenticated } = usePrivy()
  const { selectedTopics } = useTopicSelection()
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1_000)
    return () => clearInterval(timer)
  }, [])

  const navItems: { to: string; icon: typeof Home; label: string; public: boolean }[] = [
    { to: '/feed', icon: Home, label: 'Home', public: true },
    { to: '/profile', icon: User, label: 'My Profile', public: false },
  ]

  const quickLinks: { to: string; icon: typeof Home; label: string; public: boolean }[] = [
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', public: true },
    { to: '/streaks', icon: Flame, label: 'Streaks', public: false },
    { to: '/vote', icon: Vote, label: 'Vote', public: false },
    { to: '/scores', icon: BarChart3, label: 'My Stats', public: false },
    { to: '/platforms', icon: Globe, label: 'Platform Market', public: false },
  ]

  const renderItem = (item: { to: string; icon: typeof Home; label: string; public: boolean }) => {
    const locked = !item.public && !authenticated
    const active = location.pathname === item.to
    const Icon = item.icon
    if (locked) {
      return (
        <NavItem
          key={item.to}
          as="button"
          icon={<Icon className="h-4 w-4" />}
          label={item.label}
          locked
        />
      )
    }
    return (
      <Link key={item.to} to={item.to} style={{ display: 'block' }}>
        <NavItem
          as="button"
          icon={<Icon className="h-4 w-4" />}
          label={item.label}
          active={active}
        />
      </Link>
    )
  }

  return (
    <DsNavSidebar>
      <NavBrand name="Sofia Explorer" tag="v0.4" />

      <NavSection title="Navigation">{navItems.map(renderItem)}</NavSection>

      <NavSection title="Quick Access">{quickLinks.map(renderItem)}</NavSection>

      {authenticated && selectedTopics.length > 0 ? (
        <NavSection title="My Interests">
          {selectedTopics.slice(0, 6).map((topicId) => (
            <Link
              key={topicId}
              to={`/feed?space=${topicId}`}
              style={{ display: 'block' }}
            >
              <NavItem
                as="button"
                icon={<span className="text-sm">{getTopicEmoji(topicId) || '📌'}</span>}
                label={topicId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              />
            </Link>
          ))}
        </NavSection>
      ) : null}

      <div
        style={{
          marginTop: 'auto',
          padding: 12,
          border: '1px solid var(--ds-border)',
          borderRadius: 10,
          background: 'var(--ds-bg-subtle)',
        }}
      >
        <p
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            fontWeight: 700,
            margin: 0,
            color: 'var(--ds-ink)',
          }}
        >
          {timeLeft.days}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
        </p>
        <p
          style={{
            fontSize: 10,
            color: 'var(--ds-muted)',
            marginTop: 4,
            marginBottom: 0,
            lineHeight: 1.4,
          }}
        >
          remaining — Alpha Reward Program is live
        </p>
      </div>
    </DsNavSidebar>
  )
}
