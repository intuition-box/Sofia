import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { client } from "../graphql/client.js";
import { getSdk } from "../graphql/generated/graphql.js";
import { removeEmptyFields, createErrorResponse } from "../lib/response.js";
import {
  processPositionWithOpposition,
  filterZeroSharePositions,
  ProcessedPositionData,
} from "../lib/position-utils.js";
import { searchAccountIdsOperation } from "./search-account-ids.js";

// Define the parameters schema
const parameters = z
  .object({
    address: z.string().optional(),
    identifier: z.string().optional(),
  })
  .refine((data) => data.address || data.identifier, {
    message: "Either address or identifier must be provided",
  });

// Helper function to process and format triples (claims) data
function processClaimsData(triples: any[]) {
  if (!triples || triples.length === 0) return [];

  return triples.map((triple) => ({
    id: triple.term_id,
    relationship: {
      subject: {
        id: triple.subject?.term_id,
        label: triple.subject?.label,
        type: triple.subject?.value?.thing
          ? "thing"
          : triple.subject?.value?.account
            ? "account"
            : triple.subject?.value?.person
              ? "person"
              : triple.subject?.value?.organization
                ? "organization"
                : "unknown",
        details: triple.subject?.value,
      },
      predicate: {
        id: triple.predicate?.term_id,
        label: triple.predicate?.label,
        type: triple.predicate?.value?.thing
          ? "thing"
          : triple.predicate?.value?.account
            ? "account"
            : triple.predicate?.value?.person
              ? "person"
              : triple.predicate?.value?.organization
                ? "organization"
                : "unknown",
        details: triple.predicate?.value,
      },
      object: {
        id: triple.object?.term_id,
        label: triple.object?.label,
        type: triple.object?.value?.thing
          ? "thing"
          : triple.object?.value?.account
            ? "account"
            : triple.object?.value?.person
              ? "person"
              : triple.object?.value?.organization
                ? "organization"
                : "unknown",
        details: triple.object?.value,
      },
    },
    human_readable: `${triple.subject?.label || "Unknown"} ${
      triple.predicate?.label || "relates to"
    } ${triple.object?.label || "Unknown"}`,
  }));
}

// Helper function to process and format positions data (contains the rich financial + relationship data)
function processPositionsData(
  positions: any[],
  accountAddress: string,
): ProcessedPositionData[] {
  if (!positions || positions.length === 0) return [];

  // Filter out zero-share positions first
  const nonZeroPositions = filterZeroSharePositions(positions);

  // Process each position with opposition detection
  const processedPositions = nonZeroPositions
    .map((position) => processPositionWithOpposition(position, accountAddress))
    .filter((position): position is ProcessedPositionData => position !== null);

  // Sort by shares amount (largest first)
  return processedPositions.sort((a, b) => {
    const sharesA = BigInt(a.shares || "0");
    const sharesB = BigInt(b.shares || "0");
    return sharesA > sharesB ? -1 : sharesA < sharesB ? 1 : 0;
  });
}

// Helper function to process atoms data
function processAtomsData(atoms: any[]) {
  if (!atoms || atoms.length === 0) return [];

  return atoms.map((atom) => ({
    id: atom.term_id,
    label: atom.label,
    data: atom.data,
    description: atom.value?.thing?.description,
    vaults:
      atom.term?.vaults?.map((vault: any) => ({
        total_shares: vault.total_shares,
        user_positions: vault.positions_aggregate?.nodes || [],
      })) || [],
  }));
}

// Define the operation interface
interface GetAccountInfoOperation {
  description: string;
  parameters: typeof parameters;
  execute: (args: z.infer<typeof parameters>) => Promise<CallToolResult>;
}

export const getAccountInfoOperation: GetAccountInfoOperation = {
  description: `Get account information by address or identifier. Returns account details, relationships/claims (semantic triples), financial positions, and associated atoms. Works best with wallet addresses (0x...). For comprehensive ENS data, search_atoms provides richer relationship discovery.`,
  parameters,
  async execute(args) {
    console.log("\n=== Starting Get Account Info Operation ===");
    let address = args.address || args.identifier;
    let originalInput = address;

    // Keep original address case - Intuition API stores checksummed addresses
    if (address && address.includes(".eth")) {
      // For ENS names, log but continue - the tool description guides Claude to use search_atoms
      console.log("ENS name detected:", address, "- Claude should prefer search_atoms for ENS");
    }

    console.log("Final address for queries:", address);

    try {
      console.log("\n=== Calling GraphQL Query ===");
      const sdk = getSdk(client);
      const { account } = await sdk.GetAccountInfo({
        address: address!,
      });

      if (!account) {
        return {
          content: [
            {
              type: "text",
              text: `No account found for address ${address}`,
            },
          ],
        };
      }

      // Process the data to make it more accessible to the LLM
      const processedData = {
        account_info: {
          id: account.id,
          label: account.label,
          image: account.image,
          atom_id: account.atom_id,
          type: account.type,
        },
        claims_and_relationships: processClaimsData(account.triples || []),
        financial_positions: processPositionsData(
          account.positions || [],
          address!,
        ),
        associated_atoms: processAtomsData(account.atoms || []),
        raw_data: account, // Keep raw data for debugging
      };

      // Create a summary for the LLM
      const summary = {
        total_relationships: processedData.claims_and_relationships.length,
        total_positions: processedData.financial_positions.length,
        total_atoms: processedData.associated_atoms.length,
        top_relationships: processedData.claims_and_relationships.slice(0, 10),
        top_positions: processedData.financial_positions.slice(0, 10),
      };

      // Return in MCP format with essential data for UI
      const response: CallToolResult = {
        content: [
          {
            type: "resource",
            resource: {
              uri: "account-info-result",
              text: JSON.stringify({
                account: {
                  id: account.id,
                  label: account.label,
                  atom_id: account.atom_id,
                  type: account.type,
                },
                summary: {
                  relationships_count: (account.triples || []).length,
                  positions_count: (account.positions || []).length,
                  atoms_count: (account.atoms || []).length,
                },
                top_relationships: processClaimsData(account.triples || [])
                  .slice(0, 10)
                  .map((claim) => ({
                    id: claim.id,
                    human_readable: claim.human_readable,
                  })),
                top_positions: processPositionsData(
                  account.positions || [],
                  address!,
                )
                  .slice(0, 10)
                  .map((pos) => ({
                    type: pos.type,
                    id: pos.id || pos.atom_id || pos.triple_id,
                    human_readable: pos.human_readable,
                    position_type: pos.positionType,
                    predicate_label: pos.predicate_label,
                    opposition_metrics: pos.oppositionMetrics,
                  })),
              }),
              mimeType: "application/json",
            },
          },
          {
            type: "text",
            text: `Account: **${account.label || originalInput}** (${account.id})

**🏦 FINANCIAL POSITIONS** (${(account.positions || []).length} total, showing top 10):
${processPositionsData(account.positions || [], address!)
  .slice(0, 10)
  .map((pos, i) => {
    let line = `${i + 1}. ${pos.human_readable}`;
    if (pos.positionType === "oppose") {
      line += ` [OPPOSING]`;
    }
    if (pos.oppositionMetrics && pos.oppositionMetrics.oppositionRatio > 0) {
      line += ` [${Math.round(
        pos.oppositionMetrics.oppositionRatio * 100,
      )}% opposition]`;
    }
    return line;
  })
  .join("\n")}

**🔗 RELATIONSHIPS** (${(account.triples || []).length} total, showing top 5):
${processClaimsData(account.triples || [])
  .slice(0, 5)
  .map((claim, i) => `${i + 1}. ${claim.human_readable}`)
  .join("\n")}

**⚛️ ATOMS** (${(account.atoms || []).length} associated)

💡 *Use search_atoms with "${
              account.label || originalInput
            }" for additional relationship discovery.*`,
          },
        ],
      };

      return response;
    } catch (error) {
      return createErrorResponse(error, {
        operation: "get_account_info",
        args,
        phase: "execution",
      });
    }
  },
};
