export interface PageColorConfig {
  color: string
  title: string
  subtitle?: string
  glow: string
}

/**
 * Per-route hero banner copy. Subtitles follow one rule: a single sentence
 * that tells the user what the page shows and what they can do on it.
 */
export const PAGE_COLORS: Record<string, PageColorConfig> = {
  '/feed': {
    color: '#ffc6b0',
    title: 'Home',
    subtitle: 'Discover URLs certified by the whole community and add your own signals.',
    glow: 'rgba(255,198,176,0.4)',
  },
  '/leaderboard': {
    color: '#FCD34D',
    title: 'Leaderboard ',
    subtitle: 'See the top Sofia users and where you stand.',
    glow: 'rgba(252,211,77,0.4)',
  },
  '/streaks': {
    color: '#FF9B9B',
    title: 'Streaks',
    subtitle: 'Keep your daily certification streak alive to climb the season rankings.',
    glow: 'rgba(255,155,155,0.4)',
  },
  '/vote': {
    color: '#D790C7',
    title: 'Vote',
    subtitle: 'Back or oppose live claims from the network with on-chain deposits.',
    glow: 'rgba(215,144,199,0.4)',
  },
  '/profile': {
    color: '#ffc6b0',
    title: 'My Profile',
    subtitle: 'Pick your interests, link platforms, and grow your reputation.',
    glow: 'rgba(255,198,176,0.4)',
  },
  '/scores': {
    color: '#5CC4D6',
    title: 'My Stats',
    subtitle: 'Break down your reputation score across topics, intents, URLs and engagement.',
    glow: 'rgba(92,196,214,0.4)',
  },
  '/profile/platforms': {
    color: '#B5CEAA',
    title: 'Platforms',
    subtitle: 'Spot the next trending platforms early and invest before the crowd does.',
    glow: 'rgba(181,206,170,0.4)',
  },
}
