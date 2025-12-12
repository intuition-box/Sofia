import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { client } from '../graphql/client.js';
import { gql } from 'graphql-request';
import { removeEmptyFields, createErrorResponse } from '../lib/response.js';
import {
  processPositionWithOpposition,
  filterZeroSharePositions,
} from '../lib/position-utils.js';

// Define the parameters schema
const parameters = z.object({
  account_id: z
    .string()
    .min(1)
    .describe(
      'The account id of the account to find the following for. Example: 0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b'
    ),
  predicate: z
    .string()
    .min(1)
    .describe(
      `Optional predicate to filter following positions on.
Example: recommend, follow, like, dislike`
    )
    .optional(),
});

// Define the operation interface
interface GetFollowingOperation {
  description: string;
  parameters: typeof parameters;
  execute: (args: z.infer<typeof parameters>) => Promise<CallToolResult>;
}

const getFollowingQuery = gql`
  query following(
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

interface GetFollowingQueryResponse {
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

interface FormattedFollowingQueryResponse {
  following: {
    id: string;
    label: string;
    image?: string;
    shares: string;
    triple: {
      term_id: string;
      subject: any;
      predicate: any;
      object: any;
    };
    vault_info: any;
  }[];
}

function formatResponse(
  result: GetFollowingQueryResponse
): FormattedFollowingQueryResponse {
  const formattedResult: FormattedFollowingQueryResponse = { following: [] };

  for (const position of result.positions) {
    const following = {
      id: position.account.id,
      label: position.account.label,
      image: position.account.image,
      shares: position.shares,
      triple: {
        term_id: position.term.triple.term_id,
        subject: position.term.triple.subject,
        predicate: position.term.triple.predicate,
        object: position.term.triple.object,
      },
      vault_info: position.term.vaults[0] || null,
    };
    formattedResult.following.push(following);
  }

  return formattedResult;
}

export const getFollowingOperation: GetFollowingOperation = {
  description: `Get accounts that a given address is following and their relationships. Returns followed accounts with their activities and connections for social graph analysis.`,
  parameters,
  async execute(args) {
    try {
      console.log(
        '\n=== Getting Following Accounts and Their Relationships ==='
      );

      const address = args.account_id;
      const predicateFilter = args.predicate || 'follow';

      console.log('\n=== Query Variables ===');
      console.log('Address:', address);
      console.log('Predicate Filter:', predicateFilter);

      // First get accounts this address is following
      const queryVariables = {
        where: {
          account_id: {
            _eq: address,
          },
          term: {
            triple: {
              predicate: {
                label: {
                  _ilike: '%follow%',
                },
              },
              object: {
                value: {
                  account: {
                    type: {
                      _eq: 'Default',
                    },
                  },
                },
              },
            },
          },
          shares: {
            _gt: '0',
          },
        },
        orderBy: [
          {
            shares: 'desc',
          },
        ],
        limit: 50,
      };

      console.log('\n=== GraphQL Query Variables ===');
      console.log(JSON.stringify(queryVariables, null, 2));

      const followingResult = (await client.request(
        getFollowingQuery,
        queryVariables
      )) as GetFollowingQueryResponse;

      console.log('\n=== Raw Following Result ===');
      console.log('Result type:', typeof followingResult);
      console.log('Has positions:', !!followingResult.positions);
      console.log('Positions count:', followingResult.positions?.length || 0);
      console.log('Raw result:', JSON.stringify(followingResult, null, 2));

      // If no results, try a simpler query to debug
      if (
        !followingResult.positions ||
        followingResult.positions.length === 0
      ) {
        console.log('\n=== Trying Simplified Query for Debug ===');
        try {
          const simplifiedQuery = `
            query simple_following($account_id: String!) {
              positions(where: { account_id: { _eq: $account_id } }, limit: 10) {
                id
                shares
                account {
                  id
                  label
                }
                term {
                  triple {
                    term_id
                    predicate {
                      label
                    }
                    object {
                      label
                      value {
                        account {
                          id
                          label
                        }
                      }
                    }
                  }
                }
              }
            }
          `;

          const simplifiedResult = await client.request(simplifiedQuery, {
            account_id: address,
          });
          console.log(
            'Simplified query result:',
            JSON.stringify(simplifiedResult, null, 2)
          );
        } catch (error) {
          console.log('Simplified query error:', error);
        }
      }

      // Now for each followed account, get their activities/relationships
      const enrichedFollowing = await Promise.all(
        followingResult.positions.map(async (followingPosition) => {
          const followedAccountId =
            followingPosition.term.triple?.object?.value?.account?.id;
          if (!followedAccountId) return null;

          // Get what this followed account is doing (their positions)
          const followedAccountActivitiesResult = (await client.request(
            getFollowingQuery,
            {
              where: {
                account_id: {
                  _eq: followedAccountId,
                },
                term: {
                  triple: {
                    predicate: {
                      label: {
                        _ilike: `%${predicateFilter}%`,
                      },
                    },
                  },
                },
                shares: {
                  _gt: '0',
                },
              },
              orderBy: [
                {
                  shares: 'desc',
                },
              ],
              limit: 20,
            }
          )) as GetFollowingQueryResponse;

          // Filter out zero-share positions and process with opposition detection
          const nonZeroPositions = filterZeroSharePositions(
            followedAccountActivitiesResult.positions
          );

          const activities = nonZeroPositions
            .map((pos) => {
              const processedPosition = processPositionWithOpposition(
                pos,
                followedAccountId
              );
              if (
                !processedPosition ||
                processedPosition.type !== 'relationship_position'
              ) {
                return null;
              }

              return {
                relationship: processedPosition.relationship,
                shares: processedPosition.shares,
                position_type: processedPosition.positionType,
                predicate_label: processedPosition.predicate_label,
                opposition_metrics: processedPosition.oppositionMetrics,
                vault_info: processedPosition.vault_info,
                human_readable: processedPosition.human_readable,
              };
            })
            .filter((activity) => activity !== null);

          // Determine engagement level based on share amount (used internally only)
          const shareAmount = BigInt(followingPosition.shares || '0');
          const isActivelyFollowing = shareAmount > BigInt('100000000000000000'); // > 0.1 ETH equivalent

          return {
            followed_account: {
              id: followedAccountId,
              label: followingPosition.term.triple?.object?.label,
              image: followingPosition.account.image,
              is_actively_following: isActivelyFollowing,
              followed_with_shares: followingPosition.shares,
              vault_info: followingPosition.term.vaults?.[0],
            },
            activities: activities.slice(0, 10), // Top 10 activities
            activities_count: activities.length,
            opposition_count: activities.filter(
              (a) => a.position_type === 'oppose'
            ).length,
            activity_summary: activities
              .slice(0, 5)
              .map((a) => {
                let summary = a.human_readable;
                if (a.position_type === 'oppose') summary += ' [OPPOSING]';
                if (
                  a.opposition_metrics &&
                  a.opposition_metrics.oppositionRatio > 0.25
                ) {
                  summary += ` [${Math.round(
                    a.opposition_metrics.oppositionRatio * 100
                  )}% opposition]`;
                }
                return summary;
              })
              .join('; '),
          };
        })
      );

      const validFollowing = enrichedFollowing.filter(Boolean);

      const formattedResult = {
        source_account: address,
        following_count: validFollowing.length,
        following: validFollowing.sort((a, b) => {
          if (!a || !b) return 0;
          const sharesA = BigInt(
            a.followed_account.followed_with_shares || '0'
          );
          const sharesB = BigInt(
            b.followed_account.followed_with_shares || '0'
          );
          return sharesA > sharesB ? -1 : sharesA < sharesB ? 1 : 0;
        }),
        summary: {
          total_following: validFollowing.length,
          total_activities_discovered: validFollowing.reduce(
            (sum, f) => (f ? sum + f.activities_count : sum),
            0
          ),
          predicate_filter: predicateFilter,
        },
      };

      // Return in MCP format with essential data for UI
      const response: CallToolResult = {
        content: [
          {
            type: 'resource',
            resource: {
              uri: 'get-following-result',
              text: JSON.stringify({
                source_account: address,
                following: validFollowing
                  .slice(0, 5)
                  .map((f) =>
                    f
                      ? {
                          account_id: f.followed_account.id,
                          label: f.followed_account.label,
                          is_actively_following: f.followed_account.is_actively_following,
                          activities_count: f.activities_count,
                          opposition_count: f.opposition_count,
                        }
                      : null
                  )
                  .filter(Boolean),
                total_following: validFollowing.length,
                total_activities: validFollowing.reduce(
                  (sum, f) => (f ? sum + f.activities_count : sum),
                  0
                ),
              }),
              mimeType: 'application/json',
            },
          },
          {
            type: 'text',
            text: `Following Analysis for ${address}:
            
**FOLLOWING** (${validFollowing.length} accounts, top 5 shown):
${validFollowing
  .slice(0, 5)
  .map((following, i) =>
    following
      ? `${i + 1}. **${following.followed_account.label}** - ${
          following.followed_account.is_actively_following ? 'Actively' : 'Casually'
        } following
   📊 ${following.activities_count} ${predicateFilter} activities${
          following.opposition_count > 0
            ? ` (${following.opposition_count} opposing)`
            : ''
        }
   🔗 ${following.activity_summary.slice(0, 100)}${
          following.activity_summary.length > 100 ? '...' : ''
        }`
      : ''
  )
  .filter(Boolean)
  .join('\n\n')}

📈 **Summary**: Following ${
              validFollowing.length
            } accounts with ${validFollowing.reduce(
              (sum, f) => (f ? sum + f.activities_count : sum),
              0
            )} total relationship patterns discovered.`,
          },
        ],
      };

      console.log('\n=== Following Response ===');
      console.log(
        `Response size: ${JSON.stringify(response).length} characters`
      );
      return response;
    } catch (error) {
      return createErrorResponse(error, {
        operation: 'get_following',
        args,
        phase: 'execution',
      });
    }
  },
};
