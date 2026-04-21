import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from "./ui/button";
import { Home, User, Trophy, Flame, Vote, BarChart3, Globe, Lock } from "lucide-react";
import { useTopicSelection } from '../hooks/useDomainSelection'
import { SEASON_END } from '../config'
import './styles/sidebar.css'

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

const TOPIC_ICONS: Record<string, string> = {
  'tech-dev': '💻', 'design-creative': '🎨', 'music-audio': '🎵', gaming: '🎮',
  'web3-crypto': '⛓️', science: '🔬', 'sport-health': '🏋️', 'video-cinema': '📹',
  entrepreneurship: '🚀', 'performing-arts': '🎭', 'nature-environment': '🌿',
  'food-lifestyle': '🍽️', literature: '📚', 'personal-dev': '🧠',
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isOverlay?: boolean
}

export function Sidebar({ isOpen = true, onClose, isOverlay = false }: SidebarProps) {
  const location = useLocation()
  const { authenticated } = usePrivy()
  const { selectedTopics } = useTopicSelection()
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft())
    }, 1_000)
    return () => clearInterval(timer)
  }, [])

  // Close overlay sidebar on route change
  useEffect(() => {
    if (isOverlay) onClose?.()
  }, [location.pathname])

  const navItems = [
    { to: '/feed', icon: Home, label: 'Home', public: true },
    { to: '/profile', icon: User, label: 'My Profile', public: false },
  ]

  const quickLinks = [
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', public: true },
    { to: '/streaks', icon: Flame, label: 'Streaks', public: false },
    { to: '/vote', icon: Vote, label: 'Vote', public: false },
    { to: '/scores', icon: BarChart3, label: 'My Stats', public: false },
    { to: '/platforms', icon: Globe, label: 'Platform Market', public: false },
  ]

  return (
    <>
    {isOverlay && isOpen && (
      <div className="sb-backdrop" onClick={onClose} />
    )}
    <aside className={`fixed left-0 top-0 h-screen overflow-y-auto z-40 sb-aside${isOverlay ? ' sb-overlay' : ''}${!isOpen ? ' sb-closed' : ''}`}>
      <div className="p-4 space-y-6 sb-inner" style={{ zoom: isOverlay ? 1 : 1.25 }}>
        {/* Navigation */}
        <div>
          <h3 className="mb-3 px-2 text-sm font-medium text-foreground">
            Navigation
          </h3>
          <div className="space-y-1">
            {navItems.map((item) => {
              const locked = !item.public && !authenticated
              if (locked) {
                return (
                  <Button
                    key={item.to}
                    variant="ghost"
                    className="w-full justify-start h-9 px-2 sb-locked"
                    disabled
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                    <Lock className="h-3 w-3 ml-auto" />
                  </Button>
                )
              }
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={location.pathname === item.to ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-9 px-2 text-foreground hover:bg-muted hover:text-foreground"
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick Access */}
        <div>
          <h3 className="mb-3 px-2 text-sm font-medium text-foreground">
            Quick Access
          </h3>
          <div className="space-y-1">
            {quickLinks.map((item) => {
              const locked = !item.public && !authenticated
              if (locked) {
                return (
                  <Button
                    key={item.to}
                    variant="ghost"
                    className="w-full justify-start h-9 px-2 sb-locked"
                    disabled
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                    <Lock className="h-3 w-3 ml-auto" />
                  </Button>
                )
              }
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={location.pathname === item.to ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-9 px-2 text-foreground hover:bg-muted hover:text-foreground"
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick Spaces */}
        {authenticated && selectedTopics.length > 0 && (
          <div>
            <h3 className="mb-3 px-2 text-sm font-medium text-foreground">
              My Interests
            </h3>
            <div className="space-y-1">
              {selectedTopics.slice(0, 6).map((topicId) => (
                <Link key={topicId} to={`/feed?space=${topicId}`}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-2 text-foreground hover:bg-muted hover:text-foreground"
                  >
                    <span className="mr-3 text-sm">{TOPIC_ICONS[topicId] || '📌'}</span>
                    <span className="truncate text-sm">{topicId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Season Countdown */}
        <div className="rounded-lg border sb-countdown">
          <p className="sb-countdown-time">
            {timeLeft.days}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
          </p>
          <p className="sb-countdown-label">remaining — Alpha Reward Program is live</p>
          <p className="sb-countdown-hint">
            The top spots are being claimed right now.
          </p>
          <Button size="sm" className="sb-countdown-btn">
            Install Sofia
          </Button>
        </div>
      </div>
    </aside>
    </>
  );
}
