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
      "The account id of the account to find the inbound relations for. Example: 0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b",
    ),
  relations_predicate: z
    .string()
    .min(1)
    .describe(
      `Optional predicate to filter inbound relations on.
Example: recommend, follow, like, dislike`,
    )
    .optional(),
  relations_relations_predicate: z
    .string()
    .min(1)
    .describe(
      `Optional predicate to filter nested relations on.
Example: recommend, follow, like, dislike`,
    )
    .optional(),
});

// Define the operation interface
interface GetInboundRelationsOperation {
  description: string;
  parameters: typeof parameters;
  execute: (args: z.infer<typeof parameters>) => Promise<CallToolResult>;
}

interface GetInboundRelationsQueryResponse {
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

const getInboundRelationsQuery = gql`
  query inboundRelations(
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

interface FormattedInboundRelationsQueryResponse {
  inbound_relations: {
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
  }[];
}

function formatResponse(
  result: GetInboundRelationsQueryResponse,
): FormattedInboundRelationsQueryResponse {
  const formattedResult: FormattedInboundRelationsQueryResponse = {
    inbound_relations: [],
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
      const relation = {
        id: position.account.id,
        label: position.account.label,
        image: position.account.image,
        shares: position.shares,
        relationship: processedPosition.relationship!,
        position_type: processedPosition.positionType,
        opposition_metrics: processedPosition.oppositionMetrics,
        vault_info: processedPosition.vault_info,
      };
      formattedResult.inbound_relations.push(relation);
    }
  }

  return formattedResult;
}

export const getInboundRelationsOperation: GetInboundRelationsOperation = {
  description: `Get inbound relations filtered on the type of relation for a given account. Discovers what relationships point to this account.

## Example:

- user: who follows me?
  tool_args: {"account_id":"0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b","relations_predicate":"follow"}

- user: who recommends my account?
  tool_args: {"account_id":"0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b","relations_predicate":"recommend"}

- user: what inbound relations does intuitionbilly.eth have?
  tool_args: {"account_id":"0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b","relations_predicate":"follow"}
`,
  parameters,
  async execute(args) {
    try {
      console.log("\n=== Getting Inbound Relations ===");

      const address = args.account_id;
      const relationsPredicate = args.relations_predicate || "follow";

      // Get positions where the object is this account (inbound relations)
      const result = (await client.request(getInboundRelationsQuery, {
        where: {
          term: {
            triple: {
              predicate: {
                label: {
                  _ilike: `%${relationsPredicate}%`,
                },
              },
              object: {
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
        limit: 100,
      })) as GetInboundRelationsQueryResponse;

      // Filter out zero share positions
      const filteredPositions = filterZeroSharePositions(result.positions);

      const formattedResult = formatResponse({ positions: filteredPositions });

      // Return in MCP format
      const response: CallToolResult = {
        content: [
          {
            type: "resource",
            resource: {
              uri: "get-inbound-relations-result",
              text: JSON.stringify({
                target_account: address,
                predicate_filter: relationsPredicate,
                inbound_relations: formattedResult.inbound_relations.slice(
                  0,
                  10,
                ),
                total_count: formattedResult.inbound_relations.length,
              }),
              mimeType: "application/json",
            },
          },
          {
            type: "text",
            text: `Inbound Relations for ${address}:

**INBOUND ${relationsPredicate.toUpperCase()} RELATIONS** (${formattedResult.inbound_relations.length} total, top 10 shown):
${formattedResult.inbound_relations
  .slice(0, 10)
  .map(
    (relation, i) =>
      `${i + 1}. **${relation.label}** (${formatShares(relation.shares)} shares)
   🔗 ${relation.relationship.subject} ${relation.relationship.predicate} ${relation.relationship.object}
   📊 Position: ${relation.position_type}${relation.opposition_metrics ? ` (${Math.round(relation.opposition_metrics.oppositionRatio * 100)}% contested)` : ""}`,
  )
  .join("\n\n")}

📈 **Summary**: ${formattedResult.inbound_relations.length} accounts have ${relationsPredicate} relationships pointing to this account.`,
          },
        ],
      };

      console.log("\n=== Inbound Relations Response ===");
      console.log(
        `Response size: ${JSON.stringify(response).length} characters`,
      );
      return response;
    } catch (error) {
      return createErrorResponse(error, {
        operation: "get_inbound_relations",
        args,
        phase: "execution",
      });
    }
  },
};
