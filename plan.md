# Skills Tab Implementation Plan

## Status

| Step | Task | Status |
|------|------|--------|
| 1 | MCP Operation `get_account_activity` | ✅ Done |
| 2 | PR to 0xIntuition/intuition-mcp-server | ✅ Done |
| 3 | Mastra Agent `skills-analysis` | ✅ Done |
| 4 | Extension types | ✅ Done |
| 5 | Extension hook | ✅ Done |
| 6 | Extension UI | ✅ Done |

---

## Step 3: Mastra Agent

**File:** `mastra/src/agents/skills-analysis-agent.ts`

### Purpose
Categorize domains into skills using AI. The agent receives grouped domain data from MCP and returns skill categories.

### Input (from MCP get_account_activity)
```json
{
  "groups": [
    { "key": "github.com", "count": 19, "predicates": { "visits for work": 15, "visits for learning": 4 } },
    { "key": "youtube.com", "count": 9, "predicates": { "visits for fun": 5, "visits for learning": 4 } },
    { "key": "figma.com", "count": 4, "predicates": { "visits for work": 4 } }
  ]
}
```

### Output (AI categorization)
```json
{
  "skills": [
    {
      "name": "Software Development",
      "domains": ["github.com"],
      "confidence": 95,
      "reasoning": "GitHub is primarily used for code repositories and development work"
    },
    {
      "name": "UI/UX Design",
      "domains": ["figma.com"],
      "confidence": 90,
      "reasoning": "Figma is a design tool for UI/UX work"
    },
    {
      "name": "Video Content",
      "domains": ["youtube.com"],
      "confidence": 70,
      "reasoning": "Mix of entertainment and learning content"
    }
  ],
  "summary": "Developer profile with design skills, learns through video content"
}
```

### Implementation
```typescript
// mastra/src/agents/skills-analysis-agent.ts
import { Agent } from '@mastra/core';

export const skillsAnalysisAgent = new Agent({
  name: 'skills-analysis',
  instructions: `You analyze user activity data grouped by domain and categorize them into skills.

Rules:
1. Group related domains into meaningful skill categories
2. Provide confidence score (0-100) based on activity volume and consistency
3. Give brief reasoning for each categorization
4. Be specific with skill names (e.g., "Software Development" not just "Tech")

Common domain-to-skill mappings (use as hints, not strict rules):
- github.com, gitlab.com, stackoverflow.com → Software Development
- figma.com, dribbble.com, behance.com → UI/UX Design
- youtube.com → depends on predicate context (learning vs fun)
- twitter.com, linkedin.com → Professional Networking
- medium.com, dev.to → Technical Writing/Learning

Return JSON with: skills array and summary string.`,
  model: {
    provider: 'ANTHROPIC',
    name: 'claude-3-haiku-20240307',
  },
});
```

---

## Step 4: Extension Types

**File:** `extension/types/skills.ts`

```typescript
export interface Skill {
  id: string;
  name: string;
  domains: string[];
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalCertifications: number;
  certifications: {
    work: number;
    learning: number;
    fun: number;
    inspiration: number;
    buying: number;
  };
  confidence: number;
  reasoning?: string;
}

export interface SkillsAnalysisResult {
  skills: Skill[];
  summary: string;
  totalPositions: number;
  analyzedAt: string;
}

// XP calculation constants
export const XP_PER_CERTIFICATION = 5;
export const SKILL_LEVEL_THRESHOLDS = [0, 20, 50, 100, 180, 300, 500, 800, 1200, 2000];

export function calculateLevel(xp: number): number {
  for (let i = SKILL_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= SKILL_LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXpToNextLevel(xp: number, level: number): number {
  if (level >= SKILL_LEVEL_THRESHOLDS.length) return 0;
  return SKILL_LEVEL_THRESHOLDS[level] - xp;
}
```

---

## Step 5: Extension Hook

**File:** `extension/hooks/useSkillsAnalysis.ts`

### Flow
1. Call Mastra agent API with account address
2. Agent calls MCP `get_account_activity` internally
3. Agent returns categorized skills
4. Hook calculates XP/level locally
5. Return skills with computed values

```typescript
import { useState } from 'react';
import { Skill, SkillsAnalysisResult, XP_PER_CERTIFICATION, calculateLevel, getXpToNextLevel } from '../types/skills';

export function useSkillsAnalysis() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSkills = async (accountId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call Mastra agent endpoint
      const response = await fetch('/api/mastra/skills-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      // Calculate XP and levels locally
      const enrichedSkills = data.skills.map((skill: any) => {
        const totalCerts = Object.values(skill.certifications).reduce((a, b) => a + b, 0);
        const xp = totalCerts * XP_PER_CERTIFICATION;
        const level = calculateLevel(xp);

        return {
          ...skill,
          id: crypto.randomUUID(),
          xp,
          level,
          xpToNextLevel: getXpToNextLevel(xp, level),
          totalCertifications: totalCerts,
        };
      });

      setSkills(enrichedSkills);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze skills');
    } finally {
      setIsLoading(false);
    }
  };

  return { skills, summary, isLoading, error, analyzeSkills };
}
```

---

## Step 6: Extension UI

### SkillCard.tsx
**File:** `extension/components/ui/SkillCard.tsx`

- Skill name + level badge
- Progress bar (XP to next level)
- Domain tags
- Certification breakdown (work/learning/fun icons)
- Confidence indicator

### SkillsTab.tsx
**File:** `extension/components/pages/core-tabs/SkillsTab.tsx`

- "Analyze My Profile" button
- Loading state
- Skills grid (SkillCard components)
- Summary section
- Empty state

### CorePage.tsx modification
Add "Skills" tab alongside existing tabs.

---

## File Creation Order

1. `mastra/src/agents/skills-analysis-agent.ts`
2. `mastra/src/index.ts` (export agent)
3. `extension/types/skills.ts`
4. `extension/hooks/useSkillsAnalysis.ts`
5. `extension/components/ui/SkillCard.tsx`
6. `extension/components/pages/core-tabs/SkillsTab.tsx`
7. Modify `extension/components/pages/CorePage.tsx`

---

## Testing Checklist

- [ ] Agent returns valid skill categorization
- [ ] XP calculation is correct (5 XP per certification)
- [ ] Level thresholds work properly
- [ ] UI displays all skills
- [ ] Progress bars show correct percentages
- [ ] Loading/error states work
- [ ] Empty state when no data
