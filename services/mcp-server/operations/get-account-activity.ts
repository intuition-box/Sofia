import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { client } from "../graphql/client.js";
import { gql } from "graphql-request";
import { createErrorResponse } from "../lib/response.js";

// Define the parameters schema
const parameters = z.object({
  account_id: z
    .string()
    .min(1)
    .describe(
      "The account address to analyze activity for. Example: 0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b"
    ),
  predicate_filter: z
    .array(z.string())
    .optional()
    .describe(
      "Optional array of predicate labels to filter by. Example: ['visits for work', 'visits for learning', 'like', 'recommend']"
    ),
  group_by: z
    .enum(["domain", "predicate", "object"])
    .optional()
    .describe(
      "How to group results: 'domain' extracts and groups by URL hostname, 'predicate' groups by predicate label, 'object' groups by object label"
    ),
  limit: z
    .number()
    .optional()
    .describe("Max number of positions to analyze. Default: 1000")
});

// Define the operation interface
interface GetAccountActivityOperation {
  description: string;
  parameters: typeof parameters;
  execute: (args: z.infer<typeof parameters>) => Promise<CallToolResult>;
}

interface PositionResult {
  id: string;
  shares: string;
  term: {
    triple?: {
      predicate?: {
        label?: string;
      };
      object?: {
        label?: string;
        value?: {
          thing?: {
            url?: string;
          };
        };
      };
    };
  };
}

interface QueryResponse {
  positions: PositionResult[];
}

const getActivityQuery = gql`
  query GetAccountActivity(
    $where: positions_bool_exp
    $limit: Int
    $offset: Int
  ) {
    positions(where: $where, limit: $limit, offset: $offset, order_by: { shares: desc }) {
      id
      shares
      term {
        triple {
          predicate {
            label
          }
          object {
            label
            value {
              thing {
                url
              }
            }
          }
        }
      }
    }
  }
`;

interface ActivityGroup {
  key: string;
  count: number;
  total_shares: string;
  predicates: Record<string, number>;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
    return match ? match[1] : url;
  }
}

function groupActivity(
  positions: PositionResult[],
  groupBy: "domain" | "predicate" | "object"
): ActivityGroup[] {
  const groups: Record<string, { count: number; shares: bigint; predicates: Record<string, number> }> = {};

  for (const position of positions) {
    const triple = position.term?.triple;
    if (!triple) continue;

    let key: string | null = null;

    switch (groupBy) {
      case "domain":
        const url = triple.object?.value?.thing?.url || triple.object?.label || "";
        if (url) {
          key = extractDomain(url);
        }
        break;
      case "predicate":
        key = triple.predicate?.label || null;
        break;
      case "object":
        key = triple.object?.label || null;
        break;
    }

    if (!key) continue;

    if (!groups[key]) {
      groups[key] = { count: 0, shares: BigInt(0), predicates: {} };
    }

    groups[key].count++;
    groups[key].shares += BigInt(position.shares || "0");

    const predicateLabel = triple.predicate?.label || "unknown";
    groups[key].predicates[predicateLabel] = (groups[key].predicates[predicateLabel] || 0) + 1;
  }

  return Object.entries(groups)
    .map(([key, data]) => ({
      key,
      count: data.count,
      total_shares: data.shares.toString(),
      predicates: data.predicates,
    }))
    .sort((a, b) => b.count - a.count);
}

async function fetchPositions(
  accountId: string,
  predicateFilter?: string[],
  maxLimit: number = 1000
): Promise<PositionResult[]> {
  const allPositions: PositionResult[] = [];
  const pageSize = 100;
  let offset = 0;

  while (allPositions.length < maxLimit) {
    const where: any = {
      account_id: { _eq: accountId },
      shares: { _gt: "0" },
    };

    if (predicateFilter && predicateFilter.length > 0) {
      where.term = {
        triple: {
          predicate: {
            label: { _in: predicateFilter },
          },
        },
      };
    }

    const result = (await client.request(getActivityQuery, {
      where,
      limit: pageSize,
      offset,
    })) as QueryResponse;

    const positions = result.positions || [];
    allPositions.push(...positions);

    if (positions.length < pageSize) break;
    offset += pageSize;
  }

  return allPositions.slice(0, maxLimit);
}

export const getAccountActivityOperation: GetAccountActivityOperation = {
  description: `Analyze account activity with grouping and filtering. Returns aggregated statistics about an account's positions.

**Different from get-outgoing-edges:** This operation focuses on analytics and grouping (by domain, predicate, or object), not relationship traversal.

## Use Cases:
- **Skills/Interest analysis**: Group by domain to see which websites/platforms the user interacts with
- **Activity breakdown**: Group by predicate to see types of interactions (work, learning, fun, etc.)
- **Content analysis**: Group by object to see specific items interacted with

## Examples:

1. Analyze web activity by domain:
   \`{"account_id": "0x...", "predicate_filter": ["visits for work", "visits for learning", "visits for fun"], "group_by": "domain"}\`

2. Get activity breakdown by type:
   \`{"account_id": "0x...", "group_by": "predicate"}\`

3. See all likes grouped by what was liked:
   \`{"account_id": "0x...", "predicate_filter": ["like"], "group_by": "object"}\`

4. Raw activity count (no grouping):
   \`{"account_id": "0x..."}\`
`,
  parameters,
  async execute(args) {
    try {
      console.log("\n=== Getting Account Activity ===");
      console.log("Args:", JSON.stringify(args, null, 2));

      const { account_id, predicate_filter, group_by, limit = 1000 } = args;

      const positions = await fetchPositions(account_id, predicate_filter, limit);
      console.log(`Fetched ${positions.length} positions`);

      let responseData: any;
      let textSummary: string;

      if (group_by) {
        const grouped = groupActivity(positions, group_by);
        responseData = {
          account_id,
          total_positions: positions.length,
          grouped_by: group_by,
          predicate_filter: predicate_filter || null,
          groups: grouped.slice(0, 50),
          groups_count: grouped.length,
        };

        textSummary = `**Account Activity Analysis for ${account_id.slice(0, 10)}...${account_id.slice(-6)}**

📊 **Total Positions**: ${positions.length}
📁 **Grouped by**: ${group_by}
${predicate_filter ? `🔍 **Filtered by**: ${predicate_filter.join(", ")}` : ""}

**Top ${Math.min(grouped.length, 10)} Groups** (of ${grouped.length}):
${grouped
  .slice(0, 10)
  .map(
    (g, i) =>
      `${i + 1}. **${g.key}** — ${g.count} positions
   └─ ${Object.entries(g.predicates).map(([p, c]) => `${p}: ${c}`).join(", ")}`
  )
  .join("\n")}`;
      } else {
        const predicateCounts: Record<string, number> = {};
        for (const pos of positions) {
          const label = pos.term?.triple?.predicate?.label || "unknown";
          predicateCounts[label] = (predicateCounts[label] || 0) + 1;
        }

        responseData = {
          account_id,
          total_positions: positions.length,
          predicate_filter: predicate_filter || null,
          predicate_breakdown: predicateCounts,
        };

        textSummary = `**Account Activity for ${account_id.slice(0, 10)}...${account_id.slice(-6)}**

📊 **Total Positions**: ${positions.length}
${predicate_filter ? `🔍 **Filtered by**: ${predicate_filter.join(", ")}` : ""}

**Activity Breakdown**:
${Object.entries(predicateCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([pred, count]) => `• ${pred}: ${count}`)
  .join("\n")}`;
      }

      const response: CallToolResult = {
        content: [
          {
            type: "resource",
            resource: {
              uri: "get-account-activity-result",
              text: JSON.stringify(responseData),
              mimeType: "application/json",
            },
          },
          {
            type: "text",
            text: textSummary,
          },
        ],
      };

      console.log("\n=== Account Activity Response ===");
      return response;
    } catch (error) {
      return createErrorResponse(error, {
        operation: "get_account_activity",
        args,
        phase: "execution",
      });
    }
  },
};
