import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "dotenv/config"

// Well-known Anvil / Foundry / Hardhat account #0 — public on GitHub since
// forever. Used ONLY for local dev (hardhat / localhost). Any tx signed with
// this key is instantly exploitable because everyone knows the private key.
const LOCAL_DEV_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

// Guard: refuse to run against Intuition mainnet / testnet with the default
// local-dev key. The user must provide a real PRIVATE_KEY via env.
const PROD_NETWORKS = ["intuition", "intuitionTestnet"] as const
const targetNetwork = process.argv[process.argv.indexOf("--network") + 1]
const isProdNetwork = (PROD_NETWORKS as readonly string[]).includes(targetNetwork)
if (isProdNetwork && !process.env.PRIVATE_KEY) {
  throw new Error(
    `hardhat.config.ts: PRIVATE_KEY env var is required for network "${targetNetwork}". ` +
      `Refusing to sign with the well-known Anvil default key. Export PRIVATE_KEY=<your_key> ` +
      `(or add it to packages/contracts/.env) before re-running.`,
  )
}

const PRIVATE_KEY = process.env.PRIVATE_KEY || LOCAL_DEV_KEY

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
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
    // Anvil fork of Intuition mainnet — used to test against real mainnet
    // state (Safe at 0xf10D..., real TNS contracts, etc).
    intuitionFork: {
      url: "http://127.0.0.1:8545",
      chainId: 1155,
      accounts: [LOCAL_DEV_KEY],
    },
    intuition: {
      url: process.env.INTUITION_RPC_URL || "https://rpc.intuition.systems",
      chainId: 1155,
      accounts: [PRIVATE_KEY],
    },
    intuitionTestnet: {
      url:
        process.env.INTUITION_TESTNET_RPC_URL ||
        "https://testnet.rpc.intuition.systems",
      chainId: 13579,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      intuition: "no-api-key-needed",
      intuitionTestnet: "no-api-key-needed",
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
      {
        network: "intuitionTestnet",
        chainId: 13579,
        urls: {
          apiURL: "https://testnet.explorer.intuition.systems/api",
          browserURL: "https://testnet.explorer.intuition.systems",
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
}

export default config
