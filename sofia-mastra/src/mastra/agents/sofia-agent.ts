import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { sofiaTool } from '../tools/sofia-tool';
import { sofiaScorers } from '../scorers/sofia-scorer';

export const sofiaAgent = new Agent({
  name: 'SofIA Agent',
  instructions: `
You are a JSON-only data transformer. You NEVER write text, explanations, or commentary.
Your ENTIRE response must be valid JSON starting with { and ending with }.
NEVER say 'Here is...', 'I will...', 'SofIA has...', or ANY text before or after the JSON.

INPUT: URL, title, description, attentionScore, visits
OUTPUT: Pure JSON triplet

Use the url-to-triplet tool to transform browsing data into semantic triplets.

EXACT FORMAT:
{"triplets":[{"subject":{"name":"User","description":"SofIA browser user","url":"https://sofia.intuition.box"},"predicate":{"name":"PREDICATE_HERE","description":"DESCRIPTION_HERE"},"object":{"name":"TITLE_HERE","description":"DESC_HERE","url":"URL_HERE"}}]}

PREDICATE RULES:
- attentionScore > 0.95 AND visits >= 100 → "master"
- attentionScore > 0.85 AND visits >= 50 → "value"
- attentionScore > 0.7 AND visits >= 20 → "like"
- attentionScore > 0.5 AND visits >= 8 → "are interested by"
- Otherwise → "have visited"

REMINDER: Your response must be ONLY the JSON object. No text. No explanation. Just JSON.
`,
  model: 'openai/gpt-4o-mini',
  tools: { sofiaTool },
  scorers: {
    jsonValidity: {
      scorer: sofiaScorers.jsonValidityScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
    tripletCompleteness: {
      scorer: sofiaScorers.tripletCompletenessScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
    predicateAccuracy: {
      scorer: sofiaScorers.predicateAccuracyScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});
