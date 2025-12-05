import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    intuition: {
      url: process.env.INTUITION_RPC_URL || "https://rpc.intuition.systems",
      chainId: 1155,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      intuition: "no-api-key-needed", // Blockscout doesn't require API key
    },
    customChains: [
      {
        network: "intuition",
        chainId: 1155,
        urls: {
          apiURL: "https://explorer.intuition.systems/api",
          browserURL: "https://explorer.intuition.systems",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
