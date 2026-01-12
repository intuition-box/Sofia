import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Input schema
const inputSchema = z.object({
  walletAddress: z.string().describe('User wallet address to receive the attestation'),
  tokens: z.object({
    youtube: z.string().optional().describe('YouTube OAuth access token'),
    spotify: z.string().optional().describe('Spotify OAuth access token'),
    discord: z.string().optional().describe('Discord OAuth access token'),
    twitch: z.string().optional().describe('Twitch OAuth access token'),
    twitter: z.string().optional().describe('Twitter OAuth access token'),
  }),
});

// Output schema
const outputSchema = z.object({
  success: z.boolean(),
  verified: z.object({
    youtube: z.boolean(),
    spotify: z.boolean(),
    discord: z.boolean(),
    twitch: z.boolean(),
    twitter: z.boolean(),
  }),
  verifiedCount: z.number(),
  txHash: z.string().optional(),
  blockNumber: z.number().optional(),
  error: z.string().optional(),
});

// Constants - MAINNET
const SOFIA_PROXY_ADDRESS = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c';
const MULTIVAULT_ADDRESS = '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e';
const RPC_ENDPOINT = 'https://rpc.intuition.systems';

// Pre-existing Term IDs for the triple [User] [is_human] [verified]
const TERM_ID_IS_HUMAN = '0x004614d581d091be4b93f4a56321f00b7e187190011b6683b955dcd43a611248';
const TERM_ID_VERIFIED = '0xcdffac0eb431ba084e18d5af7c55b4414c153f5c0df693c2d1454079186f975c';

// Curve ID for deposits (1 = linear)
const CURVE_ID = 1n;

// Minimum deposit per triple (0.00033 ETH)
const MIN_DEPOSIT = 330000000000000n;

// Token verification functions
async function verifyYouTubeToken(token: string): Promise<boolean> {
  try {
    // Use YouTube API instead of userinfo - token has youtube.readonly scope, not userinfo
    const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifySpotifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifyDiscordToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifyTwitchToken(token: string): Promise<boolean> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      console.warn('[HumanAttestorWorkflow] TWITCH_CLIENT_ID not set');
      return false;
    }
    const res = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': clientId,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifyTwitterToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Create attestation on-chain
async function createAttestationOnChain(walletAddress: string): Promise<{
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
}> {
  const { ethers } = await import('ethers');

  const botPrivateKey = process.env.BOT_PRIVATE_KEY;

  if (!botPrivateKey) {
    return {
      success: false,
      error: 'Missing BOT_PRIVATE_KEY environment variable',
    };
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_ENDPOINT);
    const botWallet = new ethers.Wallet(botPrivateKey, provider);

    console.log(`[HumanAttestorWorkflow] Bot wallet: ${botWallet.address}`);

    // Sofia Proxy ABI (v2)
    const sofiaProxyAbi = [
      'function createAtoms(address receiver, bytes[] data, uint256[] assets, uint256 curveId) payable returns (bytes32[] atomIds)',
      'function createTriples(address receiver, bytes32[] subjectIds, bytes32[] predicateIds, bytes32[] objectIds, uint256[] assets, uint256 curveId) payable returns (bytes32[] tripleIds)',
      'function getAtomCost() view returns (uint256)',
      'function getTripleCost() view returns (uint256)',
      'function getTotalCreationCost(uint256 depositCount, uint256 totalDeposit, uint256 multiVaultCost) view returns (uint256)',
    ];

    // MultiVault ABI for calculating atom IDs
    const multiVaultAbi = [
      'function calculateAtomId(bytes data) pure returns (bytes32)',
      'function isTermCreated(bytes32 id) view returns (bool)',
    ];

    const sofiaProxy = new ethers.Contract(SOFIA_PROXY_ADDRESS, sofiaProxyAbi, botWallet);
    const multiVault = new ethers.Contract(MULTIVAULT_ADDRESS, multiVaultAbi, provider);

    // NOTE: The USER (receiver) must have approved the Sofia Proxy on MultiVault BEFORE calling this workflow.
    // This is done in the extension via BlockchainService.requestProxyApproval() before calling the workflow.
    // The bot does NOT need to approve - it's the receiver who must approve the proxy to deposit on their behalf.

    // Step 1: Calculate the user's atom ID from their wallet address
    const userAtomData = ethers.toUtf8Bytes(walletAddress);
    const userAtomId = await multiVault.calculateAtomId(userAtomData);

    console.log(`[HumanAttestorWorkflow] User atom ID: ${userAtomId}`);

    // Step 2: Check if user atom exists, create if not
    const userAtomExists = await multiVault.isTermCreated(userAtomId);
    console.log(`[HumanAttestorWorkflow] User atom exists: ${userAtomExists}`);

    if (!userAtomExists) {
      // Create user atom first
      const atomCost = await sofiaProxy.getAtomCost();
      const atomMultiVaultCost = atomCost + MIN_DEPOSIT;
      const atomTotalCost = await sofiaProxy.getTotalCreationCost(1n, MIN_DEPOSIT, atomMultiVaultCost);

      console.log(`[HumanAttestorWorkflow] Creating user atom, cost: ${ethers.formatEther(atomTotalCost)} ETH`);

      const atomTx = await sofiaProxy.createAtoms(
        walletAddress,
        [ethers.hexlify(userAtomData)],
        [MIN_DEPOSIT],
        CURVE_ID,
        { value: atomTotalCost }
      );

      console.log(`[HumanAttestorWorkflow] Atom TX sent: ${atomTx.hash}`);
      await atomTx.wait();
      console.log(`[HumanAttestorWorkflow] User atom created`);
    }

    // Step 3: Create the triple [user] [is_human] [verified]
    const tripleCost = await sofiaProxy.getTripleCost();
    const tripleMultiVaultCost = tripleCost + MIN_DEPOSIT;
    const tripleTotalCost = await sofiaProxy.getTotalCreationCost(1n, MIN_DEPOSIT, tripleMultiVaultCost);

    console.log(`[HumanAttestorWorkflow] Creating triple, cost: ${ethers.formatEther(tripleTotalCost)} ETH`);

    const tripleTx = await sofiaProxy.createTriples(
      walletAddress,
      [userAtomId],
      [TERM_ID_IS_HUMAN],
      [TERM_ID_VERIFIED],
      [MIN_DEPOSIT],
      CURVE_ID,
      { value: tripleTotalCost }
    );

    console.log(`[HumanAttestorWorkflow] Triple TX sent: ${tripleTx.hash}`);

    const receipt = await tripleTx.wait();

    console.log(`[HumanAttestorWorkflow] Triple confirmed in block ${receipt.blockNumber}`);

    return {
      success: true,
      txHash: tripleTx.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('[HumanAttestorWorkflow] TX error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Human Attestor Workflow
 * Directly executes attestation logic without LLM intermediary
 * This ensures deterministic execution and avoids LLM tool-calling issues
 */

// Step: Execute the human attestor logic directly
const executeHumanAttestor = createStep({
  id: 'execute-human-attestor',
  description: 'Verify OAuth tokens and create human attestation on-chain',
  inputSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.walletAddress) {
      return {
        success: false,
        verified: { youtube: false, spotify: false, discord: false, twitch: false, twitter: false },
        verifiedCount: 0,
        error: 'walletAddress is required',
      };
    }

    if (!inputData?.tokens) {
      return {
        success: false,
        verified: { youtube: false, spotify: false, discord: false, twitch: false, twitter: false },
        verifiedCount: 0,
        error: 'tokens object is required',
      };
    }

    const { walletAddress, tokens } = inputData;

    console.log(`[HumanAttestorWorkflow] Starting verification for ${walletAddress}`);

    // 1. Verify all 5 tokens in parallel
    const [youtube, spotify, discord, twitch, twitter] = await Promise.all([
      tokens.youtube ? verifyYouTubeToken(tokens.youtube) : false,
      tokens.spotify ? verifySpotifyToken(tokens.spotify) : false,
      tokens.discord ? verifyDiscordToken(tokens.discord) : false,
      tokens.twitch ? verifyTwitchToken(tokens.twitch) : false,
      tokens.twitter ? verifyTwitterToken(tokens.twitter) : false,
    ]);

    const verified = { youtube, spotify, discord, twitch, twitter };
    const verifiedCount = Object.values(verified).filter(Boolean).length;

    console.log(`[HumanAttestorWorkflow] Verified ${verifiedCount}/5 platforms:`, verified);

    // 2. If not 5/5, return error
    if (verifiedCount < 5) {
      return {
        success: false,
        verified,
        verifiedCount,
        error: `Only ${verifiedCount}/5 platforms verified. All 5 platforms must be connected.`,
      };
    }

    // 3. Create attestation on-chain
    const txResult = await createAttestationOnChain(walletAddress);

    if (!txResult.success) {
      return {
        success: false,
        verified,
        verifiedCount,
        error: txResult.error,
      };
    }

    console.log(`[HumanAttestorWorkflow] Attestation created successfully: ${txResult.txHash}`);

    return {
      success: true,
      verified,
      verifiedCount,
      txHash: txResult.txHash,
      blockNumber: txResult.blockNumber,
    };
  },
});

// Create the workflow
const humanAttestorWorkflow = createWorkflow({
  id: 'human-attestor-workflow',
  inputSchema,
  outputSchema,
}).then(executeHumanAttestor);

humanAttestorWorkflow.commit();

export { humanAttestorWorkflow };
