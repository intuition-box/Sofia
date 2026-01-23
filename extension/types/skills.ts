/**
 * Skills analysis types for SOFIA extension
 * Types for skill categorization and XP/level calculation
 */

// Certification breakdown by predicate type
export interface CertificationBreakdown {
  work: number;
  learning: number;
  fun: number;
  inspiration: number;
  buying: number;
}

// Skill as returned by the AI agent
export interface SkillFromAgent {
  name: string;
  domains: string[];
  confidence: number;
  reasoning: string;
  certifications: CertificationBreakdown;
}

// Full skill with computed XP and level
export interface Skill {
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

// Response from skills analysis agent
export interface SkillsAnalysisAgentResponse {
  skills: SkillFromAgent[];
  summary: string;
}

// Full analysis result with computed values
export interface SkillsAnalysisResult {
  skills: Skill[];
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
export const SKILL_LEVEL_THRESHOLDS = [0, 20, 50, 100, 180, 300, 500, 800, 1200, 2000];

// Calculate level from XP
export function calculateLevel(xp: number): number {
  for (let i = SKILL_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= SKILL_LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

// Calculate XP needed to reach next level
export function getXpToNextLevel(xp: number, level: number): number {
  if (level >= SKILL_LEVEL_THRESHOLDS.length) return 0;
  return SKILL_LEVEL_THRESHOLDS[level] - xp;
}

// Calculate XP progress percentage within current level
export function getXpProgressPercent(xp: number, level: number): number {
  if (level >= SKILL_LEVEL_THRESHOLDS.length) return 100;
  const currentLevelXp = SKILL_LEVEL_THRESHOLDS[level - 1];
  const nextLevelXp = SKILL_LEVEL_THRESHOLDS[level];
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
    certifications.buying
  );
}

// Convert agent skill to full skill with computed values
export function enrichSkill(agentSkill: SkillFromAgent): Skill {
  const totalCertifications = getTotalCertifications(agentSkill.certifications);
  const xp = totalCertifications * XP_PER_CERTIFICATION;
  const level = calculateLevel(xp);

  return {
    id: crypto.randomUUID(),
    name: agentSkill.name,
    domains: agentSkill.domains,
    level,
    xp,
    xpToNextLevel: getXpToNextLevel(xp, level),
    totalCertifications,
    certifications: agentSkill.certifications,
    confidence: agentSkill.confidence,
    reasoning: agentSkill.reasoning,
  };
}

// Level badge colors (matching existing level design)
export const LEVEL_COLORS: Record<number, string> = {
  1: '#9CA3AF',  // Gray
  2: '#22C55E',  // Green
  3: '#3B82F6',  // Blue
  4: '#8B5CF6',  // Purple
  5: '#F59E0B',  // Amber
  6: '#EF4444',  // Red
  7: '#EC4899',  // Pink
  8: '#06B6D4',  // Cyan
  9: '#F97316',  // Orange
  10: '#FFD700', // Gold
};

// Get level color
export function getLevelColor(level: number): string {
  return LEVEL_COLORS[Math.min(level, 10)] || LEVEL_COLORS[10];
}
