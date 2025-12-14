import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { browsingDataSchema, tripletSchema } from '../tools/sofia-tool';

// Step 1: Parse and validate browsing data input
const parseBrowsingData = createStep({
  id: 'parse-browsing-data',
  description: 'Parses raw browsing data input into structured format',
  inputSchema: z.object({
    rawInput: z.string().describe('Raw text input containing URL, title, description, attention score, and visits'),
  }),
  outputSchema: browsingDataSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.rawInput) {
      throw new Error('Input data not found');
    }

    const text = inputData.rawInput;

    // Parse the input text to extract fields
    const urlMatch = text.match(/URL:\s*(.+)/i);
    const titleMatch = text.match(/Title:\s*(.+)/i);
    const descriptionMatch = text.match(/Description:\s*(.*)/i);
    const attentionMatch = text.match(/Attention\s*Score:\s*([\d.]+)/i);
    const visitsMatch = text.match(/Visits:\s*(\d+)/i);

    if (!urlMatch || !titleMatch || !attentionMatch || !visitsMatch) {
      throw new Error('Could not parse required fields from input. Expected format: URL: ..., Title: ..., Attention Score: ..., Visits: ...');
    }

    return {
      url: urlMatch[1].trim(),
      title: titleMatch[1].trim(),
      description: descriptionMatch?.[1]?.trim() || '',
      attentionScore: parseFloat(attentionMatch[1]),
      visits: parseInt(visitsMatch[1], 10),
    };
  },
});

// Step 2: Transform browsing data into triplet using the agent
const transformToTriplet = createStep({
  id: 'transform-to-triplet',
  description: 'Transforms browsing data into semantic triplet using SofIA agent',
  inputSchema: browsingDataSchema,
  outputSchema: tripletSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Browsing data not found');
    }

    const agent = mastra?.getAgent('sofiaAgent');
    if (!agent) {
      throw new Error('SofIA agent not found');
    }

    const prompt = `URL: ${inputData.url}
Title: ${inputData.title}
Description: ${inputData.description || ''}
Attention Score: ${inputData.attentionScore}
Visits: ${inputData.visits}`;

    const response = await agent.generate([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Extract JSON from response
    const responseText = typeof response.text === 'string' ? response.text : '';

    try {
      const tripletData = JSON.parse(responseText);
      return tripletData;
    } catch {
      throw new Error(`Failed to parse agent response as JSON: ${responseText}`);
    }
  },
});

// Step 3: Validate and format the final output
const validateOutput = createStep({
  id: 'validate-output',
  description: 'Validates the triplet structure and ensures proper formatting',
  inputSchema: tripletSchema,
  outputSchema: tripletSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.triplets?.length) {
      throw new Error('No triplets found in output');
    }

    const triplet = inputData.triplets[0];

    // Validate required fields
    if (!triplet.subject?.name || !triplet.subject?.url) {
      throw new Error('Invalid subject structure');
    }
    if (!triplet.predicate?.name) {
      throw new Error('Invalid predicate structure');
    }
    if (!triplet.object?.name || !triplet.object?.url) {
      throw new Error('Invalid object structure');
    }

    return inputData;
  },
});

// Create the workflow
const sofiaWorkflow = createWorkflow({
  id: 'sofia-workflow',
  inputSchema: z.object({
    rawInput: z.string().describe('Raw text input containing browsing data'),
  }),
  outputSchema: tripletSchema,
})
  .then(parseBrowsingData)
  .then(transformToTriplet)
  .then(validateOutput);

sofiaWorkflow.commit();

export { sofiaWorkflow };
