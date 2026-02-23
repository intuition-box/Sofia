/**
 * Interest analysis types for SOFIA extension
 * Types for interest categorization and XP/level calculation
 */

// Certification breakdown by predicate type
export interface CertificationBreakdown {
  work: number;
  learning: number;
  fun: number;
  inspiration: number;
  buying: number;
  music: number;
}

// Interest as returned by the AI agent
export interface InterestFromAgent {
  name: string;
  domains: string[];
  confidence: number;
  reasoning: string;
  certifications: CertificationBreakdown;
}

// Full interest with computed XP and level
export interface Interest {
  id: string;
  name: string;
  domains: string[];
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalCertifications: number;
  certifications: CertificationBreakdown;
  confidence: number;
  reasoning?: string;
}

// Response from interest analysis agent
export interface InterestAnalysisAgentResponse {
  interests: InterestFromAgent[];
  summary: string;
}

// Full analysis result with computed values
export interface InterestAnalysisResult {
  interests: Interest[];
  summary: string;
  totalPositions: number;
  analyzedAt: string;
}

// Domain activity group from MCP
export interface DomainActivityGroup {
  key: string;
  count: number;
  total_shares: string;
  predicates: Record<string, number>;
}

// MCP get_account_activity response
export interface AccountActivityResponse {
  account_id: string;
  total_positions: number;
  grouped_by: 'domain' | 'predicate' | 'object';
  predicate_filter: string[] | null;
  groups: DomainActivityGroup[];
  groups_count: number;
}

// XP calculation constants
export const XP_PER_CERTIFICATION = 5;

// Level thresholds (XP required for each level)
export const INTEREST_LEVEL_THRESHOLDS = [0, 20, 50, 100, 180, 300, 500, 800, 1200, 2000];

// Calculate level from XP
export function calculateLevel(xp: number): number {
  for (let i = INTEREST_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= INTEREST_LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

// Calculate XP needed to reach next level
export function getXpToNextLevel(xp: number, level: number): number {
  if (level >= INTEREST_LEVEL_THRESHOLDS.length) return 0;
  return INTEREST_LEVEL_THRESHOLDS[level] - xp;
}

// Calculate XP progress percentage within current level
export function getXpProgressPercent(xp: number, level: number): number {
  if (level >= INTEREST_LEVEL_THRESHOLDS.length) return 100;
  const currentLevelXp = INTEREST_LEVEL_THRESHOLDS[level - 1];
  const nextLevelXp = INTEREST_LEVEL_THRESHOLDS[level];
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  return Math.round((xpInLevel / xpNeeded) * 100);
}

// Calculate total certifications from breakdown
export function getTotalCertifications(certifications: CertificationBreakdown): number {
  return (
    certifications.work +
    certifications.learning +
    certifications.fun +
    certifications.inspiration +
    certifications.buying +
    certifications.music
  );
}

// Convert agent interest to full interest with computed values
export function enrichInterest(agentInterest: InterestFromAgent): Interest {
  const totalCertifications = getTotalCertifications(agentInterest.certifications);
  const xp = totalCertifications * XP_PER_CERTIFICATION;
  const level = calculateLevel(xp);

  return {
    id: crypto.randomUUID(),
    name: agentInterest.name,
    domains: agentInterest.domains,
    level,
    xp,
    xpToNextLevel: getXpToNextLevel(xp, level),
    totalCertifications,
    certifications: agentInterest.certifications,
    confidence: agentInterest.confidence,
    reasoning: agentInterest.reasoning,
  };
}

// Tier colors — one color per decade of levels (1-10, 11-20, 21-30, …)
// Each tier has a base hue that gets more vibrant as the level rises within it.
export const TIER_COLORS: { base: string; hsl: [number, number, number] }[] = [
  { base: '#9CA3AF', hsl: [220, 9, 65] },   // Tier 0: Lvl 1-10  — Slate
  { base: '#22C55E', hsl: [142, 71, 45] },   // Tier 1: Lvl 11-20 — Emerald
  { base: '#3B82F6', hsl: [217, 91, 60] },   // Tier 2: Lvl 21-30 — Blue
  { base: '#8B5CF6', hsl: [258, 90, 66] },   // Tier 3: Lvl 31-40 — Purple
  { base: '#EF4444', hsl: [0, 84, 60] },     // Tier 4: Lvl 41-50 — Red
  { base: '#EC4899', hsl: [330, 81, 60] },    // Tier 5: Lvl 51-60 — Pink
  { base: '#06B6D4', hsl: [188, 94, 43] },   // Tier 6: Lvl 61-70 — Cyan
  { base: '#F97316', hsl: [25, 95, 53] },     // Tier 7: Lvl 71-80 — Orange
  { base: '#FBBF24', hsl: [43, 96, 56] },     // Tier 8: Lvl 81-90 — Amber
  { base: '#FFD700', hsl: [51, 100, 50] },    // Tier 9: Lvl 91-100 — Gold
]

/**
 * Get level color with tier-based gradient.
 * Position within the tier (1-10) increases lightness slightly
 * so each level has a subtly different shade.
 */
export function getLevelColor(level: number): string {
  const tierIndex = Math.min(
    Math.floor((level - 1) / 10),
    TIER_COLORS.length - 1
  )
  const posInTier = ((level - 1) % 10) // 0-9
  const [h, s, l] = TIER_COLORS[tierIndex].hsl
  // Shift lightness from +8 (position 0) to -4 (position 9) for subtle gradient
  const adjustedL = Math.max(20, Math.min(80, l + 8 - posInTier * 1.3))
  return `hsl(${h}, ${s}%, ${adjustedL}%)`
}

/**
 * Get level color with alpha transparency.
 * Returns hsla() string for use as backgrounds.
 */
export function getLevelColorAlpha(level: number, alpha = 0.19): string {
  const tierIndex = Math.min(
    Math.floor((level - 1) / 10),
    TIER_COLORS.length - 1
  )
  const posInTier = ((level - 1) % 10)
  const [h, s, l] = TIER_COLORS[tierIndex].hsl
  const adjustedL = Math.max(20, Math.min(80, l + 8 - posInTier * 1.3))
  return `hsla(${h}, ${s}%, ${adjustedL}%, ${alpha})`
}

/**
 * Get the tier base color (solid hex) for a given level.
 * Useful for CSS classes and simple color references.
 */
export function getTierColor(level: number): string {
  const tierIndex = Math.min(
    Math.floor((level - 1) / 10),
    TIER_COLORS.length - 1
  )
  return TIER_COLORS[tierIndex].base
}
