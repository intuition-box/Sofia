import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: process.env.INTUITION_GRAPHQL_URL || "https://testnet.intuition.sh/v1/graphql",
  documents: ["graphql/**/*.ts"],
  generates: {
    "./graphql/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-graphql-request",
      ],
      config: {
        scalars: {
          numeric: "string",
          timestamptz: "string",
          uuid: "string",
          jsonb: "Record<string, any>",
        },
        dedupeFragments: true,
        skipTypename: true,
        avoidOptionals: false,
        gqlImport: "graphql-request#gql",
      },
    },
  },
};

export default config;
