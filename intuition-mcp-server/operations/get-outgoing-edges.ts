import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { client } from "../graphql/client.js";
import { SearchAtomsQuery } from "../graphql/generated/graphql.js";
import { gql } from "graphql-request";
import { removeEmptyFields, createErrorResponse } from "../lib/response.js";
import {
  processPositionWithOpposition,
  filterZeroSharePositions,
  formatShares,
} from "../lib/position-utils.js";

// Define the parameters schema
const parameters = z.object({
  account_id: z
    .string()
    .min(1)
    .describe(
      "The account id of the account to find the outgoing edges for. Example: 0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b",
    ),
  edges_predicate: z
    .string()
    .min(1)
    .describe(
      "The predicate to filter on for outgoing edges. Example: follow, like, dislike, recommend, trust",
    ),
  edges_edges_predicate: z
    .string()
    .min(1)
    .describe(
      `Optional predicate to filter nested edges on.
Example: recommend, follow, like, dislike, trust`,
    )
    .optional(),
});

// Define the operation interface
interface GetOutgoingEdgesOperation {
  description: string;
  parameters: typeof parameters;
  execute: (args: z.infer<typeof parameters>) => Promise<CallToolResult>;
}

interface GetOutgoingEdgesQueryResponse {
  positions: Array<{
    id: string;
    shares: string;
    account: {
      id: string;
      label: string;
      image?: string;
    };
    term: {
      triple: {
        term_id: string;
        counter_term_id?: string;
        subject: {
          term_id: string;
          label: string;
          value: any;
        };
        predicate: {
          term_id: string;
          label: string;
          value: any;
        };
        object: {
          term_id: string;
          label: string;
          value: any;
        };
        term: {
          vaults: Array<{
            term_id: string;
            position_count: number;
            total_shares: string;
            current_share_price: string;
          }>;
        };
        counter_term: {
          vaults: Array<{
            term_id: string;
            position_count: number;
            total_shares: string;
            current_share_price: string;
          }>;
        };
      };
      vaults: Array<{
        term_id: string;
        position_count: number;
        total_shares: string;
        current_share_price: string;
      }>;
    };
  }>;
}

const getOutgoingEdgesQuery = gql`
  query outgoingEdges(
    $where: positions_bool_exp
    $orderBy: [positions_order_by!]
    $limit: Int
  ) {
    positions(where: $where, order_by: $orderBy, limit: $limit) {
      id
      shares
      account {
        id
        label
        image
      }
      term {
        triple {
          term_id
          counter_term_id
          subject {
            term_id
            label
            value {
              thing {
                url
                description
                name
              }
              account {
                id
                label
              }
              person {
                name
                description
                email
                identifier
              }
              organization {
                name
                email
                description
                url
              }
            }
          }
          predicate {
            term_id
            label
            value {
              thing {
                url
                description
                name
              }
              account {
                id
                label
              }
              person {
                name
                description
                email
                identifier
              }
              organization {
                name
                email
                description
                url
              }
            }
          }
          object {
            term_id
            label
            value {
              thing {
                url
                description
                name
              }
              account {
                id
                label
              }
              person {
                name
                description
                email
                identifier
              }
              organization {
                name
                email
                description
                url
              }
            }
          }
          # Include support vault info
          term {
            vaults(where: { curve_id: { _eq: "1" } }) {
              term_id
              position_count
              total_shares
              current_share_price
            }
          }
          # Include counter vault info for opposition detection
          counter_term {
            vaults(where: { curve_id: { _eq: "1" } }) {
              term_id
              position_count
              total_shares
              current_share_price
            }
          }
        }
        vaults(where: { curve_id: { _eq: "1" } }) {
          term_id
          position_count
          total_shares
          current_share_price
        }
      }
    }
  }
`;

const getNestedOutgoingEdgesQuery = gql`
  query nestedOutgoingEdges(
    $where: positions_bool_exp
    $orderBy: [positions_order_by!]
    $limit: Int
    $nestedPredicate: String
  ) {
    positions(where: $where, order_by: $orderBy, limit: $limit) {
      id
      shares
      account {
        id
        label
        image
      }
      term {
        triple {
          term_id
          counter_term_id
          subject {
            term_id
            label
            value {
              account {
                id
                label
              }
            }
          }
          predicate {
            term_id
            label
          }
          object {
            term_id
            label
            value {
              account {
                id
                label
              }
            }
          }
          term {
            vaults(where: { curve_id: { _eq: "1" } }) {
              term_id
              position_count
              total_shares
              current_share_price
            }
          }
          counter_term {
            vaults(where: { curve_id: { _eq: "1" } }) {
              term_id
              position_count
              total_shares
              current_share_price
            }
          }
        }
        vaults(where: { curve_id: { _eq: "1" } }) {
          term_id
          position_count
          total_shares
          current_share_price
        }
      }
    }
  }
`;

interface FormattedOutgoingEdgesQueryResponse {
  source_account: string;
  outgoing_edges: {
    id: string;
    label: string;
    image?: string;
    shares: string;
    relationship: {
      subject: string;
      predicate: string;
      object: string;
    };
    position_type: string;
    opposition_metrics?: any;
    vault_info?: any;
    nested_interests?: {
      relationship: string;
      shares: string;
      position_type: string;
    }[];
  }[];
}

function formatResponse(
  result: GetOutgoingEdgesQueryResponse,
  sourceAccount: string,
  nestedResults?: { [accountId: string]: any[] },
): FormattedOutgoingEdgesQueryResponse {
  const formattedResult: FormattedOutgoingEdgesQueryResponse = {
    source_account: sourceAccount,
    outgoing_edges: [],
  };

  for (const position of result.positions) {
    const processedPosition = processPositionWithOpposition(
      position,
      position.account.id,
    );
    if (
      processedPosition &&
      processedPosition.type === "relationship_position"
    ) {
      const targetAccountId = position.term.triple.object.value?.account?.id;
      const nestedInterests = nestedResults?.[targetAccountId] || [];

      const edge = {
        id: targetAccountId || position.term.triple.object.term_id,
        label: position.term.triple.object.label,
        image: undefined,
        shares: position.shares,
        relationship: processedPosition.relationship!,
        position_type: processedPosition.positionType,
        opposition_metrics: processedPosition.oppositionMetrics,
        vault_info: processedPosition.vault_info,
        nested_interests: nestedInterests.slice(0, 5), // Top 5 nested interests
      };
      formattedResult.outgoing_edges.push(edge);
    }
  }

  return formattedResult;
}

export const getOutgoingEdgesOperation: GetOutgoingEdgesOperation = {
  description: `Get outgoing edges filtered on the type of relation for a given account.
Also optionally retrieves nested relationships for discovered connections.

## Example:

- user: what do the accounts I follow follow?
  tool_args: {"account_id":"0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b","edges_predicate":"follow","edges_edges_predicate":"follow"}

- user: what do the accounts I follow recommend?
  tool_args: {"account_id":"0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b","edges_predicate":"follow","edges_edges_predicate":"recommend"}

- user: what are the things I prefer?
  tool_args: {"account_id":"0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b","edges_predicate":"prefers"}

- user: what are my relationships with a predicate 'follow'?
  tool_args: {"account_id":"0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b","edges_predicate":"follow"}
`,
  parameters,
  async execute(args) {
    try {
      console.log("\n=== Getting Outgoing Edges ===");

      const address = args.account_id;
      const edgesPredicate = args.edges_predicate;
      const edgesEdgesPredicate = args.edges_edges_predicate;

      // Get outgoing edges (relationships where this account is the subject)
      const result = (await client.request(getOutgoingEdgesQuery, {
        where: {
          account_id: {
            _eq: address,
          },
          term: {
            triple: {
              predicate: {
                label: {
                  _ilike: `%${edgesPredicate}%`,
                },
              },
              subject: {
                value: {
                  account: {
                    id: {
                      _eq: address,
                    },
                  },
                },
              },
            },
          },
          shares: {
            _gt: "0",
          },
        },
        orderBy: [
          {
            shares: "desc",
          },
        ],
        limit: 50,
      })) as GetOutgoingEdgesQueryResponse;

      // Filter out zero share positions
      const filteredPositions = filterZeroSharePositions(result.positions);

      let nestedResults: { [accountId: string]: any[] } = {};

      // If nested predicate is specified, get nested relationships
      if (edgesEdgesPredicate && edgesEdgesPredicate !== "") {
        const accountIds = filteredPositions
          .map((pos) => pos.term.triple.object.value?.account?.id)
          .filter((id) => id)
          .slice(0, 10); // Limit to first 10 to avoid too many requests

        await Promise.all(
          accountIds.map(async (accountId) => {
            if (!accountId) return;

            try {
              const nestedResult = (await client.request(
                getNestedOutgoingEdgesQuery,
                {
                  where: {
                    account_id: {
                      _eq: accountId,
                    },
                    term: {
                      triple: {
                        predicate: {
                          label: {
                            _ilike: `%${edgesEdgesPredicate}%`,
                          },
                        },
                      },
                    },
                    shares: {
                      _gt: "0",
                    },
                  },
                  orderBy: [
                    {
                      shares: "desc",
                    },
                  ],
                  limit: 10,
                },
              )) as GetOutgoingEdgesQueryResponse;

              nestedResults[accountId] = filterZeroSharePositions(
                nestedResult.positions,
              )
                .map((pos) => {
                  const processed = processPositionWithOpposition(
                    pos,
                    accountId,
                  );
                  if (processed && processed.type === "relationship_position") {
                    return {
                      relationship: processed.human_readable,
                      shares: processed.shares,
                      position_type: processed.positionType,
                    };
                  }
                  return null;
                })
                .filter((item) => item !== null);
            } catch (error) {
              console.warn(
                `Failed to get nested edges for ${accountId}:`,
                error,
              );
              nestedResults[accountId] = [];
            }
          }),
        );
      }

      const formattedResult = formatResponse(
        { positions: filteredPositions },
        address,
        nestedResults,
      );

      // Return in MCP format
      const response: CallToolResult = {
        content: [
          {
            type: "resource",
            resource: {
              uri: "get-outgoing-edges-result",
              text: JSON.stringify({
                source_account: address,
                predicate_filter: edgesPredicate,
                nested_predicate_filter: edgesEdgesPredicate,
                outgoing_edges: formattedResult.outgoing_edges.slice(0, 10),
                total_count: formattedResult.outgoing_edges.length,
              }),
              mimeType: "application/json",
            },
          },
          {
            type: "text",
            text: `Outgoing Edges for ${address}:

**OUTGOING ${edgesPredicate.toUpperCase()} RELATIONSHIPS** (${formattedResult.outgoing_edges.length} total, top 10 shown):
${formattedResult.outgoing_edges
  .slice(0, 10)
  .map(
    (edge, i) =>
      `${i + 1}. **${edge.label}** (${formatShares(edge.shares)} shares)
   🔗 ${edge.relationship.subject} ${edge.relationship.predicate} ${edge.relationship.object}
   📊 Position: ${edge.position_type}${edge.opposition_metrics ? ` (${Math.round(edge.opposition_metrics.oppositionRatio * 100)}% contested)` : ""}${
     edge.nested_interests && edge.nested_interests.length > 0
       ? `\n   🔍 Their interests: ${edge.nested_interests
           .slice(0, 3)
           .map((ni) => ni.relationship)
           .join("; ")}`
       : ""
   }`,
  )
  .join("\n\n")}

📈 **Summary**: ${formattedResult.outgoing_edges.length} ${edgesPredicate} relationships${edgesEdgesPredicate ? ` with nested ${edgesEdgesPredicate} analysis` : ""}.`,
          },
        ],
      };

      console.log("\n=== Outgoing Edges Response ===");
      console.log(
        `Response size: ${JSON.stringify(response).length} characters`,
      );
      return response;
    } catch (error) {
      return createErrorResponse(error, {
        operation: "get_outgoing_edges",
        args,
        phase: "execution",
      });
    }
  },
};
