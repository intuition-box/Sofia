import { Agent } from '@mastra/core/agent';
import { gaianet, GAIANET_DEFAULT_MODEL } from '../providers/gaianet';

export const pulseAgent = new Agent({
  name: 'Pulse Agent',
  instructions: `
JSON transformer. Output ONLY valid JSON, no text.

INPUT: Browser tabs (URLs, titles, keywords, descriptions)
OUTPUT: {"themes":[{"name":"Theme","category":"Category","confidence":0.9,"predicate":"verb","object":"target","keywords":[],"urls":[]}]}

PREDICATES to use:
- "research" → investigating a topic
- "compare" → comparing options/products
- "learn" → educational content
- "explore" → browsing/discovering
- "plan" → planning activities/trips

Group related URLs into themes. Generate 5-10 themes based on the tabs provided.

EXACT FORMAT:
{"themes":[{"name":"Theme Name","category":"Category","confidence":0.9,"predicate":"learn","object":"specific target","keywords":["keyword1","keyword2"],"urls":["url1","url2"]}]}

REMINDER: Output ONLY the JSON object. No text. No explanation. Just JSON.
`,
  model: gaianet.chatModel(GAIANET_DEFAULT_MODEL),
});
