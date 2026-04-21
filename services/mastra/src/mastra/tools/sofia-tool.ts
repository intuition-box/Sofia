import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Schema for browsing data input
const browsingDataSchema = z.object({
  url: z.string().url().describe('The URL visited'),
  title: z.string().describe('Page title'),
  description: z.string().optional().describe('Page description'),
  attentionScore: z.number().min(0).max(1).describe('Attention score between 0 and 1'),
  visits: z.number().int().min(1).describe('Number of visits'),
});

// Schema for triplet output
const tripletSchema = z.object({
  triplets: z.array(
    z.object({
      subject: z.object({
        name: z.string(),
        description: z.string(),
        url: z.string(),
      }),
      predicate: z.object({
        name: z.string(),
        description: z.string(),
      }),
      object: z.object({
        name: z.string(),
        description: z.string(),
        url: z.string(),
      }),
    })
  ),
});

export type BrowsingData = z.infer<typeof browsingDataSchema>;
export type TripletOutput = z.infer<typeof tripletSchema>;

/**
 * Determines the predicate based on attention score and visit count
 */
function determinePredicate(attentionScore: number, visits: number): { name: string; description: string } {
  if (attentionScore > 0.95 && visits >= 100) {
    return {
      name: 'master',
      description: 'Indicates deep expertise and mastery of the content.',
    };
  }
  if (attentionScore > 0.85 && visits >= 50) {
    return {
      name: 'value',
      description: 'Indicates high value placed on the content.',
    };
  }
  if (attentionScore > 0.7 && visits >= 20) {
    return {
      name: 'like',
      description: 'Indicates a marked interest in the visited content.',
    };
  }
  if (attentionScore > 0.5 && visits >= 8) {
    return {
      name: 'are interested by',
      description: 'Indicates interest in the content.',
    };
  }
  return {
    name: 'have visited',
    description: 'Indicates a basic visit to the content.',
  };
}

/**
 * Transforms browsing data into a semantic triplet
 */
function transformToTriplet(data: BrowsingData): TripletOutput {
  const predicate = determinePredicate(data.attentionScore, data.visits);

  return {
    triplets: [
      {
        subject: {
          name: 'User',
          description: 'SofIA browser user',
          url: 'https://sofia.intuition.box',
        },
        predicate,
        object: {
          name: data.title,
          description: data.description || 'Content visited by the user.',
          url: data.url,
        },
      },
    ],
  };
}

export const sofiaTool = createTool({
  id: 'url-to-triplet',
  description: 'Transforms browsing data (URL, title, description, attention score, visits) into semantic triplets',
  inputSchema: browsingDataSchema,
  outputSchema: tripletSchema,
  execute: async ({ context }) => {
    return transformToTriplet(context);
  },
});

// Export schemas for reuse
export { browsingDataSchema, tripletSchema };
