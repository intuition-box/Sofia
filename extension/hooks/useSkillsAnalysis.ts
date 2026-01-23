/**
 * useSkillsAnalysis Hook
 * Fetches domain activity from MCP and uses AI to categorize into skills
 * XP and levels are calculated locally based on on-chain certifications
 */

import { useState, useCallback, useEffect } from 'react';
import { callMastraAgent } from '../background/mastraClient';
import {
  Skill,
  SkillFromAgent,
  AccountActivityResponse,
  enrichSkill,
  CertificationBreakdown,
  XP_PER_CERTIFICATION,
  calculateLevel,
  getXpToNextLevel,
} from '../types/skills';
import { createHookLogger } from '../lib/utils/logger';

const logger = createHookLogger('useSkillsAnalysis');

// MCP Server URL - uses the same server as other MCP operations
const MCP_SERVER_URL = process.env.PLASMO_PUBLIC_MCP_URL || 'http://localhost:3001';

// Cache configuration
const CACHE_KEY_PREFIX = 'sofia_proofs_';

interface CachedProofsData {
  skills: Skill[];
  summary: string;
  totalPositions: number;
  analyzedAt: string;
}

/**
 * Get cache key for an account
 */
function getCacheKey(accountId: string): string {
  return `${CACHE_KEY_PREFIX}${accountId.toLowerCase()}`;
}

/**
 * Load cached proofs from localStorage
 */
function loadCachedProofs(accountId: string): CachedProofsData | null {
  try {
    const cached = localStorage.getItem(getCacheKey(accountId));
    if (!cached) return null;
    const data = JSON.parse(cached);
    logger.info('Loaded cached proofs', { accountId, skillCount: data.skills?.length });
    return data;
  } catch (e) {
    logger.warn('Failed to load cached proofs', e);
    return null;
  }
}

/**
 * Save proofs to localStorage cache
 */
function saveCachedProofs(accountId: string, data: CachedProofsData): void {
  try {
    localStorage.setItem(getCacheKey(accountId), JSON.stringify(data));
    logger.info('Saved proofs to cache', { accountId, skillCount: data.skills.length });
  } catch (e) {
    logger.warn('Failed to cache proofs', e);
  }
}

/**
 * Check if two skill names are similar enough to be merged
 * Handles cases like "Blockchain" vs "Blockchain Technology"
 */
function areSkillNamesSimilar(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  // Exact match
  if (n1 === n2) return true;

  // One contains the other (e.g., "Blockchain" in "Blockchain Technology")
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Get the first word of each name
  const firstWord1 = n1.split(/\s+/)[0];
  const firstWord2 = n2.split(/\s+/)[0];

  // If first words match and are substantial (> 4 chars), consider similar
  if (firstWord1 === firstWord2 && firstWord1.length > 4) return true;

  return false;
}

/**
 * Find the best matching skill index for a new skill
 * Uses fuzzy matching to avoid duplicates like "Blockchain" and "Blockchain Technology"
 */
function findSimilarSkillIndex(skills: Skill[], newSkillName: string): number {
  for (let i = 0; i < skills.length; i++) {
    if (areSkillNamesSimilar(skills[i].name, newSkillName)) {
      return i;
    }
  }
  return -1;
}

/**
 * Merge cached skills with new skills
 * - Updates existing skills (by name) with new domains/certifications
 * - Adds completely new skills
 * - Uses fuzzy matching to avoid duplicates
 */
function mergeSkills(cached: Skill[], newSkills: Skill[]): Skill[] {
  const merged = [...cached];

  for (const newSkill of newSkills) {
    const existingIndex = findSimilarSkillIndex(merged, newSkill.name);

    if (existingIndex >= 0) {
      // Update existing skill: merge domains, take max certifications
      const existing = merged[existingIndex];
      const mergedDomains = [...new Set([...existing.domains, ...newSkill.domains])];
      const mergedCerts: CertificationBreakdown = {
        work: Math.max(existing.certifications.work, newSkill.certifications.work),
        learning: Math.max(existing.certifications.learning, newSkill.certifications.learning),
        fun: Math.max(existing.certifications.fun, newSkill.certifications.fun),
        inspiration: Math.max(existing.certifications.inspiration, newSkill.certifications.inspiration),
        buying: Math.max(existing.certifications.buying, newSkill.certifications.buying),
      };

      // Recalculate XP/level with merged certifications
      const totalCerts = Object.values(mergedCerts).reduce((a, b) => a + b, 0);
      const xp = totalCerts * XP_PER_CERTIFICATION;
      const level = calculateLevel(xp);

      // Prefer the shorter name (usually more generic and better)
      const bestName = existing.name.length <= newSkill.name.length ? existing.name : newSkill.name;

      merged[existingIndex] = {
        ...existing,
        name: bestName,
        domains: mergedDomains,
        certifications: mergedCerts,
        totalCertifications: totalCerts,
        xp,
        level,
        xpToNextLevel: getXpToNextLevel(xp, level),
        confidence: Math.max(existing.confidence, newSkill.confidence),
        reasoning: newSkill.reasoning || existing.reasoning,
      };

      logger.info('Merged similar skills', { existing: existing.name, new: newSkill.name, merged: bestName, newXp: xp });
    } else {
      // Add new skill
      merged.push(newSkill);
      logger.info('Added new skill', { name: newSkill.name });
    }
  }

  return merged;
}

// Predicate labels for web activity
const WEB_ACTIVITY_PREDICATES = [
  'visits for work',
  'visits for learning',
  'visits for learning ', // Legacy with trailing space
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
];

export interface SkillsAnalysisState {
  skills: Skill[];
  summary: string;
  totalPositions: number;
  isLoading: boolean;
  error: string | null;
  analyzedAt: string | null;
}

interface MCPSession {
  sessionId: string;
}

/**
 * Parse SSE response to extract JSON data
 */
function parseSSEResponse(text: string): unknown {
  // SSE format: "event: message\ndata: {...json...}\n\n"
  const lines = text.split('\n');
  let jsonData = null;

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6); // Remove "data: " prefix
      try {
        jsonData = JSON.parse(dataStr);
      } catch {
        // Not valid JSON, continue
      }
    }
  }

  return jsonData;
}

/**
 * Parse response - handles both JSON and SSE formats
 */
async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  // Check if it's SSE format (starts with "event:" or contains "data:")
  if (text.startsWith('event:') || text.includes('\ndata:')) {
    const parsed = parseSSEResponse(text);
    if (parsed) return parsed;
    throw new Error('Failed to parse SSE response');
  }

  // Try parsing as JSON
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid response format: ${text.slice(0, 100)}`);
  }
}

/**
 * Initialize MCP session
 */
async function initMCPSession(): Promise<MCPSession> {
  const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'sofia-extension', version: '1.0.0' },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP init failed: ${response.status}`);
  }

  const sessionId = response.headers.get('mcp-session-id');
  if (!sessionId) {
    throw new Error('No session ID returned from MCP');
  }

  return { sessionId };
}

/**
 * Call MCP tool
 */
async function callMCPTool(
  sessionId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MCP tool call failed: ${response.status} - ${text}`);
  }

  const result = await parseResponse(response) as { error?: { message: string }; result?: { content?: Array<{ type: string; resource?: { text: string }; text?: string }> } };

  console.log('📦 [MCP] Raw result:', JSON.stringify(result).slice(0, 500));

  if (result.error) {
    throw new Error(result.error.message || 'MCP tool error');
  }

  // Extract JSON from resource content
  const content = result.result?.content;
  if (content && Array.isArray(content)) {
    // Try resource type first
    const resourceContent = content.find((c: { type: string }) => c.type === 'resource');
    if (resourceContent?.resource?.text) {
      console.log('📦 [MCP] Found resource content');
      return JSON.parse(resourceContent.resource.text);
    }
    // Try text type (some MCP servers return this format)
    const textContent = content.find((c: { type: string }) => c.type === 'text');
    if (textContent?.text) {
      console.log('📦 [MCP] Found text content');
      return JSON.parse(textContent.text);
    }
  }

  console.log('📦 [MCP] Returning raw result');
  return result.result;
}

/**
 * Fetch account activity grouped by domain
 */
async function fetchAccountActivity(accountId: string): Promise<AccountActivityResponse> {
  logger.info('Fetching account activity from MCP', { accountId });

  const session = await initMCPSession();

  const result = await callMCPTool(session.sessionId, 'get_account_activity', {
    account_id: accountId,
    predicate_filter: WEB_ACTIVITY_PREDICATES,
    group_by: 'domain',
    limit: 500,
  });

  logger.info('Account activity fetched', { groups: (result as AccountActivityResponse).groups_count });

  return result as AccountActivityResponse;
}

/**
 * Map predicate labels to certification breakdown
 */
function mapPredicatesToCertifications(
  predicates: Record<string, number>
): CertificationBreakdown {
  return {
    work: predicates['visits for work'] || 0,
    learning: (predicates['visits for learning'] || 0) + (predicates['visits for learning '] || 0),
    fun: predicates['visits for fun'] || 0,
    inspiration: predicates['visits for inspiration'] || 0,
    buying: predicates['visits for buying'] || 0,
  };
}

/**
 * Call skills analysis agent
 */
async function analyzeSkillsWithAgent(
  activityData: AccountActivityResponse
): Promise<{ skills: SkillFromAgent[]; summary: string }> {
  logger.info('Calling skills analysis agent', { groupCount: activityData.groups.length });

  // Prepare input for the agent
  const agentInput = {
    groups: activityData.groups.map((g) => ({
      key: g.key,
      count: g.count,
      predicates: g.predicates,
    })),
  };

  const result = await callMastraAgent('skillsAnalysisAgent', JSON.stringify(agentInput));

  logger.info('Skills analysis complete', { skillCount: result.skills?.length });

  // Map certifications from agent response
  const skillsWithCerts = (result.skills || []).map((skill: SkillFromAgent) => {
    // Find domains in activity data and aggregate certifications
    const certifications: CertificationBreakdown = {
      work: 0,
      learning: 0,
      fun: 0,
      inspiration: 0,
      buying: 0,
    };

    for (const domain of skill.domains) {
      const group = activityData.groups.find((g) => g.key === domain);
      if (group) {
        const domainCerts = mapPredicatesToCertifications(group.predicates);
        certifications.work += domainCerts.work;
        certifications.learning += domainCerts.learning;
        certifications.fun += domainCerts.fun;
        certifications.inspiration += domainCerts.inspiration;
        certifications.buying += domainCerts.buying;
      }
    }

    return {
      ...skill,
      certifications,
    };
  });

  return {
    skills: skillsWithCerts,
    summary: result.summary || '',
  };
}

/**
 * Hook for skills analysis with localStorage caching
 */
export function useSkillsAnalysis() {
  const [state, setState] = useState<SkillsAnalysisState>({
    skills: [],
    summary: '',
    totalPositions: 0,
    isLoading: false,
    error: null,
    analyzedAt: null,
  });
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);

  // Load cached data when account changes
  const loadFromCache = useCallback((accountId: string) => {
    const cached = loadCachedProofs(accountId);
    if (cached) {
      setState({
        skills: cached.skills,
        summary: cached.summary,
        totalPositions: cached.totalPositions,
        isLoading: false,
        error: null,
        analyzedAt: cached.analyzedAt,
      });
      return true;
    }
    return false;
  }, []);

  const analyzeSkills = useCallback(async (accountId: string) => {
    if (!accountId) {
      setState((prev) => ({ ...prev, error: 'No account ID provided' }));
      return;
    }

    // Track current account
    setCurrentAccountId(accountId);

    // Load cache first if we don't have data for this account
    const cached = loadCachedProofs(accountId);
    if (cached && state.skills.length === 0) {
      setState((prev) => ({
        ...prev,
        skills: cached.skills,
        summary: cached.summary,
        totalPositions: cached.totalPositions,
        analyzedAt: cached.analyzedAt,
      }));
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Fetch domain activity from MCP
      const activityData = await fetchAccountActivity(accountId);

      console.log('🔍 [Proofs] Activity data received:', JSON.stringify(activityData).slice(0, 500));
      console.log('🔍 [Proofs] Groups:', activityData?.groups?.length || 'undefined');

      if (!activityData.groups || activityData.groups.length === 0) {
        console.log('⚠️ [Proofs] No groups found, keeping cached data if any');
        // Keep cached skills if we have them
        if (cached) {
          setState({
            skills: cached.skills,
            summary: cached.summary,
            totalPositions: cached.totalPositions,
            isLoading: false,
            error: null,
            analyzedAt: cached.analyzedAt,
          });
        } else {
          setState({
            skills: [],
            summary: 'No activity data found for this account.',
            totalPositions: 0,
            isLoading: false,
            error: null,
            analyzedAt: new Date().toISOString(),
          });
        }
        return;
      }

      // Step 2: Send to AI agent for categorization
      console.log('🤖 [Proofs] Calling Mastra agent with', activityData.groups.length, 'groups');
      const { skills: agentSkills, summary } = await analyzeSkillsWithAgent(activityData);
      console.log('✅ [Proofs] Agent returned', agentSkills.length, 'skills');

      // Step 3: Enrich skills with XP/level calculations
      const enrichedSkills = agentSkills.map(enrichSkill);

      // Step 4: Merge with cached skills
      const cachedSkills = cached?.skills || [];
      const mergedSkills = mergeSkills(cachedSkills, enrichedSkills);
      console.log('🔀 [Proofs] Merged skills:', cachedSkills.length, '+', enrichedSkills.length, '→', mergedSkills.length);

      // Sort by XP descending
      mergedSkills.sort((a, b) => b.xp - a.xp);

      const analyzedAt = new Date().toISOString();

      // Step 5: Save to cache
      saveCachedProofs(accountId, {
        skills: mergedSkills,
        summary,
        totalPositions: activityData.total_positions,
        analyzedAt,
      });

      setState({
        skills: mergedSkills,
        summary,
        totalPositions: activityData.total_positions,
        isLoading: false,
        error: null,
        analyzedAt,
      });

      logger.info('Proofs analysis complete', {
        skillCount: mergedSkills.length,
        totalPositions: activityData.total_positions,
        cached: cachedSkills.length,
        new: enrichedSkills.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze proofs';
      logger.error('Proofs analysis failed', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [state.skills.length]);

  const reset = useCallback(() => {
    setState({
      skills: [],
      summary: '',
      totalPositions: 0,
      isLoading: false,
      error: null,
      analyzedAt: null,
    });
  }, []);

  // Initialize from cache when hook mounts with an account
  useEffect(() => {
    if (currentAccountId) {
      loadFromCache(currentAccountId);
    }
  }, [currentAccountId, loadFromCache]);

  return {
    ...state,
    analyzeSkills,
    reset,
    loadFromCache,
  };
}

export default useSkillsAnalysis;
