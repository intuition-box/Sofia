export interface PageColorConfig {
  color: string
  title: string
  subtitle?: string
  glow: string
}

export const PAGE_COLORS: Record<string, PageColorConfig> = {
  '/feed': {
    color: '#ffc6b0',
    title: 'Home',
    subtitle: 'Your browsing reputation dashboard',
    glow: 'rgba(255,198,176,0.4)',
  },
  '/leaderboard': {
    color: '#FCD34D',
    title: 'Leaderboard ',
    subtitle: 'The top spots are being claimed right now.',
    glow: 'rgba(252,211,77,0.4)',
  },
  '/streaks': {
    color: '#FF9B9B',
    title: 'Streaks',
    subtitle: 'Daily certification streaks',
    glow: 'rgba(255,155,155,0.4)',
  },
  '/vote': {
    color: '#D790C7',
    title: 'Vote',
    subtitle: 'Support or oppose claims on-chain',
    glow: 'rgba(215,144,199,0.4)',
  },
  '/profile': {
    color: '#ffffff',
    title: 'My Profile',
    subtitle: 'Your reputation overview',
    glow: 'rgba(255,255,255,0.2)',
  },
  '/profile/scores': {
    color: '#5CC4D6',
    title: 'My Stats',
    subtitle: 'Your reputation statistics',
    glow: 'rgba(92,196,214,0.4)',
  },
  '/profile/platforms': {
    color: '#B5CEAA',
    title: 'Platforms',
    subtitle: 'Connect and certify your accounts',
    glow: 'rgba(181,206,170,0.4)',
  },
}
