import { z } from 'zod';
import { createScorer } from '@mastra/core/scores';
import { createToolCallAccuracyScorerCode } from '@mastra/evals/scorers/code';
import { gaianet, GAIANET_DEFAULT_MODEL } from '../providers/gaianet';

// GaiaNet model for scorers judge
const gaianetJudgeModel = gaianet.chatModel(GAIANET_DEFAULT_MODEL);

// Scorer: Checks if the sofia tool was called appropriately
export const sofiaToolCallScorer = createToolCallAccuracyScorerCode({
  expectedTool: 'sofiaTool',
  strictMode: false,
});

// Scorer: Validates that the response is valid JSON
export const jsonValidityScorer = createScorer({
  name: 'JSON Validity',
  description: 'Checks that the response is valid JSON starting with { and ending with }',
  type: 'agent',
  judge: {
    model: gaianetJudgeModel,
    instructions:
      'You are an expert JSON validator. ' +
      'Check if the response is valid JSON that starts with { and ends with }. ' +
      'The response should not contain any text before or after the JSON. ' +
      'Return only the structured JSON matching the provided schema.',
  },
})
  .preprocess(({ run }) => {
    const assistantText = (run.output?.[0]?.content as string) || '';
    return { assistantText };
  })
  .analyze({
    description: 'Validate JSON structure',
    outputSchema: z.object({
      isValidJson: z.boolean(),
      startsWithBrace: z.boolean(),
      endsWithBrace: z.boolean(),
      hasTextBefore: z.boolean(),
      hasTextAfter: z.boolean(),
      explanation: z.string().default(''),
    }),
    createPrompt: ({ results }) => `
      Analyze this response for JSON validity:
      """
      ${results.preprocessStepResult.assistantText}
      """

      Check:
      1. Is it valid JSON?
      2. Does it start with { (no text before)?
      3. Does it end with } (no text after)?
      4. Is there any text/explanation before the JSON?
      5. Is there any text/explanation after the JSON?

      Return JSON with fields:
      {
        "isValidJson": boolean,
        "startsWithBrace": boolean,
        "endsWithBrace": boolean,
        "hasTextBefore": boolean,
        "hasTextAfter": boolean,
        "explanation": string
      }
    `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    if (r.isValidJson && r.startsWithBrace && r.endsWithBrace && !r.hasTextBefore && !r.hasTextAfter) {
      return 1;
    }
    if (r.isValidJson) return 0.5;
    return 0;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `JSON validity: valid=${r.isValidJson}, startsWithBrace=${r.startsWithBrace}, endsWithBrace=${r.endsWithBrace}. Score=${score}. ${r.explanation || ''}`;
  });

// Scorer: Validates triplet structure completeness
export const tripletCompletenessScorer = createScorer({
  name: 'Triplet Completeness',
  description: 'Checks that the triplet has all required fields: subject, predicate, object with their nested properties',
  type: 'agent',
  judge: {
    model: gaianetJudgeModel,
    instructions:
      'You are an expert validator for semantic triplet structures. ' +
      'Check if the JSON contains a properly structured triplet with subject, predicate, and object. ' +
      'Return only the structured JSON matching the provided schema.',
  },
})
  .preprocess(({ run }) => {
    const assistantText = (run.output?.[0]?.content as string) || '';
    return { assistantText };
  })
  .analyze({
    description: 'Validate triplet structure',
    outputSchema: z.object({
      hasTriplets: z.boolean(),
      hasSubject: z.boolean(),
      hasPredicate: z.boolean(),
      hasObject: z.boolean(),
      subjectComplete: z.boolean(),
      predicateComplete: z.boolean(),
      objectComplete: z.boolean(),
      explanation: z.string().default(''),
    }),
    createPrompt: ({ results }) => `
      Analyze this JSON for triplet completeness:
      """
      ${results.preprocessStepResult.assistantText}
      """

      Check if the structure contains:
      1. A "triplets" array
      2. Each triplet has "subject" with name, description, url
      3. Each triplet has "predicate" with name, description
      4. Each triplet has "object" with name, description, url

      Return JSON:
      {
        "hasTriplets": boolean,
        "hasSubject": boolean,
        "hasPredicate": boolean,
        "hasObject": boolean,
        "subjectComplete": boolean (has name, description, url),
        "predicateComplete": boolean (has name, description),
        "objectComplete": boolean (has name, description, url),
        "explanation": string
      }
    `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    let score = 0;
    if (r.hasTriplets) score += 0.2;
    if (r.subjectComplete) score += 0.25;
    if (r.predicateComplete) score += 0.3;
    if (r.objectComplete) score += 0.25;
    return Math.min(1, score);
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Triplet completeness: triplets=${r.hasTriplets}, subject=${r.subjectComplete}, predicate=${r.predicateComplete}, object=${r.objectComplete}. Score=${score}. ${r.explanation || ''}`;
  });

// Scorer: Validates predicate accuracy based on rules
export const predicateAccuracyScorer = createScorer({
  name: 'Predicate Accuracy',
  description: 'Checks that the predicate matches the expected value based on attention score and visits',
  type: 'agent',
  judge: {
    model: gaianetJudgeModel,
    instructions:
      'You are an expert validator for predicate selection rules. ' +
      'Based on attention score and visit count, verify the correct predicate was chosen. ' +
      'Return only the structured JSON matching the provided schema.',
  },
})
  .preprocess(({ run }) => {
    const userText = (run.input?.inputMessages?.[0]?.content as string) || '';
    const assistantText = (run.output?.[0]?.content as string) || '';
    return { userText, assistantText };
  })
  .analyze({
    description: 'Validate predicate selection',
    outputSchema: z.object({
      attentionScore: z.number().optional(),
      visits: z.number().optional(),
      expectedPredicate: z.string(),
      actualPredicate: z.string(),
      isCorrect: z.boolean(),
      explanation: z.string().default(''),
    }),
    createPrompt: ({ results }) => `
      Analyze this interaction for predicate accuracy:

      User input:
      """
      ${results.preprocessStepResult.userText}
      """

      Assistant response:
      """
      ${results.preprocessStepResult.assistantText}
      """

      PREDICATE RULES:
      - attentionScore > 0.95 AND visits >= 100 → "master"
      - attentionScore > 0.85 AND visits >= 50 → "value"
      - attentionScore > 0.7 AND visits >= 20 → "like"
      - attentionScore > 0.5 AND visits >= 8 → "are interested by"
      - Otherwise → "have visited"

      Extract the attention score and visits from the user input.
      Determine the expected predicate based on the rules.
      Extract the actual predicate from the assistant response.

      Return JSON:
      {
        "attentionScore": number or null if not found,
        "visits": number or null if not found,
        "expectedPredicate": string,
        "actualPredicate": string,
        "isCorrect": boolean,
        "explanation": string
      }
    `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return r.isCorrect ? 1 : 0;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Predicate accuracy: expected="${r.expectedPredicate}", actual="${r.actualPredicate}", correct=${r.isCorrect}. Score=${score}. ${r.explanation || ''}`;
  });

export const sofiaScorers = {
  sofiaToolCallScorer,
  jsonValidityScorer,
  tripletCompletenessScorer,
  predicateAccuracyScorer,
};
