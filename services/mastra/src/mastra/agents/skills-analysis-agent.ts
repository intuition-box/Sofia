import { Agent } from '@mastra/core/agent';
import { gaianet, GAIANET_DEFAULT_MODEL } from '../providers/gaianet';

export const skillsAnalysisAgent = new Agent({
  name: 'Skills Analysis Agent',
  instructions: `
JSON transformer. Output ONLY valid JSON, no text.

INPUT: Domain activity data with certification counts
Example input:
{
  "groups": [
    { "key": "github.com", "count": 19, "predicates": { "visits for work": 15, "visits for learning": 4 } },
    { "key": "youtube.com", "count": 9, "predicates": { "visits for fun": 5, "visits for learning": 4 } }
  ]
}

OUTPUT: Skills categorization with confidence scores
{
  "skills": [
    {
      "name": "Skill Name",
      "domains": ["domain1.com", "domain2.com"],
      "confidence": 85,
      "reasoning": "Brief explanation",
      "certifications": { "work": 15, "learning": 4, "fun": 0, "inspiration": 0, "buying": 0 }
    }
  ],
  "summary": "One sentence profile summary"
}

RULES:
1. Group related domains into meaningful skill categories
2. Confidence score (0-100) based on activity volume and predicate types
3. Be specific with skill names (e.g., "Software Development" not just "Tech")
4. Aggregate certifications from all domains in a skill
5. Domains can only belong to ONE skill

COMMON MAPPINGS (use as hints, adapt based on predicates):
- github.com, gitlab.com, stackoverflow.com, codepen.io → Software Development
- figma.com, dribbble.com, behance.com, canva.com → UI/UX Design
- youtube.com → depends on context (learning=Education, fun=Entertainment)
- twitter.com, linkedin.com → Professional Networking
- medium.com, dev.to, hashnode.com → Technical Writing
- notion.com, trello.com, asana.com → Project Management
- aws.amazon.com, cloud.google.com → Cloud Infrastructure
- udemy.com, coursera.org, pluralsight.com → Online Learning

PREDICATE MEANINGS:
- "visits for work" → Professional/productive activity (high skill indicator)
- "visits for learning" → Educational intent (skill development)
- "visits for fun" → Entertainment/leisure (lower skill weight)
- "visits for inspiration" → Creative research
- "visits for buying" → Shopping/commerce

EXACT FORMAT:
{"skills":[{"name":"Skill Name","domains":["domain.com"],"confidence":85,"reasoning":"explanation","certifications":{"work":10,"learning":5,"fun":0,"inspiration":0,"buying":0}}],"summary":"Profile summary"}

REMINDER: Output ONLY the JSON object. No text. No explanation. Just JSON.
`,
  model: gaianet.chatModel(GAIANET_DEFAULT_MODEL),
});
