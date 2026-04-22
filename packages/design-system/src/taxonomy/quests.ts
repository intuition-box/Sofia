/**
 * Quest badge catalog.
 *
 * Ported from apps/explorer/src/config/intentions.ts. These are the badge
 * display names and categories used across UI: daily quests, milestones,
 * social / gold / discovery / streak tiers.
 */

export interface QuestBadge {
  name: string
  category:
    | 'daily'
    | 'milestone'
    | 'discovery'
    | 'gold'
    | 'vote'
    | 'social'
    | 'streak'
}

export const QUEST_BADGES: Record<string, QuestBadge> = {
  'daily certification': { name: 'Daily Certification', category: 'daily' },
  'daily voter': { name: 'Daily Voter', category: 'daily' },
  'first signal': { name: 'First Signal', category: 'milestone' },
  'first step': { name: 'First Step', category: 'discovery' },
  'first coins': { name: 'First Coins', category: 'gold' },
  'first vote': { name: 'First Vote', category: 'vote' },
  'first follow': { name: 'First Follow', category: 'social' },
  'first trust': { name: 'First Trust', category: 'social' },
  trailblazer: { name: 'Trailblazer', category: 'discovery' },
  saver: { name: 'Saver', category: 'gold' },
  committed: { name: 'Committed', category: 'streak' },
  dedicated: { name: 'Dedicated', category: 'streak' },
  relentless: { name: 'Relentless', category: 'streak' },
  critic: { name: 'Critic', category: 'vote' },
  judge: { name: 'Judge', category: 'vote' },
  'engaged voter': { name: 'Engaged Voter', category: 'vote' },
  'civic duty': { name: 'Civic Duty', category: 'vote' },
  'signal rookie': { name: 'Signal Rookie', category: 'milestone' },
  'signal maker': { name: 'Signal Maker', category: 'milestone' },
  centurion: { name: 'Centurion', category: 'milestone' },
  'signal pro': { name: 'Signal Pro', category: 'milestone' },
  'social butterfly': { name: 'Social Butterfly', category: 'social' },
  networker: { name: 'Networker', category: 'social' },
  explorer: { name: 'Explorer', category: 'discovery' },
  pathfinder: { name: 'Pathfinder', category: 'discovery' },
  collector: { name: 'Collector', category: 'milestone' },
  'gold digger': { name: 'Gold Digger', category: 'gold' },
  treasurer: { name: 'Treasurer', category: 'gold' },
  'midas touch': { name: 'Midas Touch', category: 'gold' },
  'discord linked': { name: 'Discord Linked', category: 'social' },
  'youtube linked': { name: 'YouTube Linked', category: 'social' },
  'spotify linked': { name: 'Spotify Linked', category: 'social' },
  'twitch linked': { name: 'Twitch Linked', category: 'social' },
  'twitter linked': { name: 'Twitter Linked', category: 'social' },
  'social linked': { name: 'Social Linked', category: 'social' },
}
