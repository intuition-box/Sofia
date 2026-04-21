import { PREDICATE_IDS } from '../config'

/** Hex color for each intention label */
export const INTENTION_COLORS: Record<string, string> = {
  Trusted: '#6DD4A0',
  Distrusted: '#E87C7C',
  Work: '#7BADE0',
  Learning: '#5CC4D6',
  Fun: '#E4B95A',
  Inspiration: '#A78BDB',
  Buying: '#D98CB3',
  Music: '#E0896A',
  Attending: '#6DC4A8',
  Valued: '#E0A06A',
  'is following': '#6DC4A8',
}

/** Map on-chain predicate ID → display intention label */
export const PREDICATE_TO_INTENTION: Record<string, string> = {
  [PREDICATE_IDS.TRUSTS]: 'Trusted',
  [PREDICATE_IDS.DISTRUST]: 'Distrusted',
  [PREDICATE_IDS.VISITS_FOR_WORK]: 'Work',
  [PREDICATE_IDS.VISITS_FOR_LEARNING]: 'Learning',
  [PREDICATE_IDS.VISITS_FOR_FUN]: 'Fun',
  [PREDICATE_IDS.VISITS_FOR_INSPIRATION]: 'Inspiration',
}

/** Map human-readable predicate label → display intention label */
export const LABEL_TO_INTENTION: Record<string, string> = {
  trusts: 'Trusted',
  distrust: 'Distrusted',
  'visits for work': 'Work',
  'visits for learning': 'Learning',
  'visits for fun': 'Fun',
  'visits for inspiration': 'Inspiration',
  'visits for buying': 'Buying',
  'visits for music': 'Music',
  attending: 'Attending',
  'has value': 'Valued',
  follow: 'is following',
}

/** Quest badge config: tag label → { display name, category } */
export const QUEST_BADGES: Record<string, { name: string; category: string }> = {
  'daily certification': { name: 'Daily Certification', category: 'daily' },
  'daily voter': { name: 'Daily Voter', category: 'daily' },
  'first signal': { name: 'First Signal', category: 'milestone' },
  'first step': { name: 'First Step', category: 'discovery' },
  'first coins': { name: 'First Coins', category: 'gold' },
  'first vote': { name: 'First Vote', category: 'vote' },
  'first follow': { name: 'First Follow', category: 'social' },
  'first trust': { name: 'First Trust', category: 'social' },
  'trailblazer': { name: 'Trailblazer', category: 'discovery' },
  'saver': { name: 'Saver', category: 'gold' },
  'committed': { name: 'Committed', category: 'streak' },
  'dedicated': { name: 'Dedicated', category: 'streak' },
  'relentless': { name: 'Relentless', category: 'streak' },
  'critic': { name: 'Critic', category: 'vote' },
  'judge': { name: 'Judge', category: 'vote' },
  'engaged voter': { name: 'Engaged Voter', category: 'vote' },
  'civic duty': { name: 'Civic Duty', category: 'vote' },
  'signal rookie': { name: 'Signal Rookie', category: 'milestone' },
  'signal maker': { name: 'Signal Maker', category: 'milestone' },
  'centurion': { name: 'Centurion', category: 'milestone' },
  'signal pro': { name: 'Signal Pro', category: 'milestone' },
  'social butterfly': { name: 'Social Butterfly', category: 'social' },
  'networker': { name: 'Networker', category: 'social' },
  'explorer': { name: 'Explorer', category: 'discovery' },
  'pathfinder': { name: 'Pathfinder', category: 'discovery' },
  'collector': { name: 'Collector', category: 'milestone' },
  'gold digger': { name: 'Gold Digger', category: 'gold' },
  'treasurer': { name: 'Treasurer', category: 'gold' },
  'midas touch': { name: 'Midas Touch', category: 'gold' },
  'discord linked': { name: 'Discord Linked', category: 'social' },
  'youtube linked': { name: 'YouTube Linked', category: 'social' },
  'spotify linked': { name: 'Spotify Linked', category: 'social' },
  'twitch linked': { name: 'Twitch Linked', category: 'social' },
  'twitter linked': { name: 'Twitter Linked', category: 'social' },
  'social linked': { name: 'Social Linked', category: 'social' },
}

/** Accent color for support/oppose side */
export function getSideColor(side: 'support' | 'oppose'): string {
  return side === 'support' ? '#22C55E' : '#EF4444'
}

/** Inline style object for intention badge pills */
export function intentionBadgeStyle(color: string) {
  return { backgroundColor: `${color}20`, border: `1px solid ${color}40` }
}
