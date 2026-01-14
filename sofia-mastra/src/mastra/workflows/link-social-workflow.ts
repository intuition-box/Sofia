import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { createPublicClient, createWalletClient, http, stringToHex, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { intuitionMainnet, RPC_URL } from '../config/chain';
import { MULTIVAULT_ADDRESS, TERM_ID_VERIFIED } from '../config/constants';
import { MultiVaultAbi } from '../config/abi';

// Platform type
type Platform = 'discord' | 'youtube' | 'spotify' | 'twitch' | 'twitter';

// Input schema
const inputSchema = z.object({
  walletAddress: z.string().describe('User wallet address'),
  platform: z.enum(['discord', 'youtube', 'spotify', 'twitch', 'twitter']).describe('Social platform'),
  oauthToken: z.string().describe('OAuth access token'),
});

// Output schema
const outputSchema = z.object({
  success: z.boolean(),
  platform: z.string().optional(),
  userId: z.string().optional(),
  username: z.string().optional(),
  txHash: z.string().optional(),
  blockNumber: z.number().optional(),
  walletAtomCreated: z.boolean().optional(),
  socialAtomCreated: z.boolean().optional(),
  error: z.string().optional(),
});

// OAuth verification result
interface OAuthVerificationResult {
  valid: boolean;
  userId?: string;
  username?: string;
  error?: string;
}

// OAuth endpoints configuration
const OAUTH_ENDPOINTS = {
  youtube: {
    url: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    authHeader: (token: string) => `Bearer ${token}`,
  },
  spotify: {
    url: 'https://api.spotify.com/v1/me',
    authHeader: (token: string) => `Bearer ${token}`,
  },
  discord: {
    url: 'https://discord.com/api/users/@me',
    authHeader: (token: string) => `Bearer ${token}`,
  },
  twitch: {
    url: 'https://api.twitch.tv/helix/users',
    authHeader: (token: string) => `Bearer ${token}`,
    requiresClientId: true,
  },
  twitter: {
    url: 'https://api.twitter.com/2/users/me',
    authHeader: (token: string) => `Bearer ${token}`,
  },
} as const;

/**
 * Verify OAuth token and retrieve user ID
 */
async function verifyAndGetUserId(
  platform: Platform,
  token: string,
  clientId?: string
): Promise<OAuthVerificationResult> {
  const endpoint = OAUTH_ENDPOINTS[platform];

  try {
    const headers: Record<string, string> = {
      Authorization: endpoint.authHeader(token),
    };

    if (platform === 'twitch') {
      const twitchClientId = clientId || process.env.TWITCH_CLIENT_ID;
      if (!twitchClientId) {
        return { valid: false, error: 'Twitch Client ID required' };
      }
      headers['Client-Id'] = twitchClientId;
    }

    const response = await fetch(endpoint.url, { headers });

    if (!response.ok) {
      return { valid: false, error: `API returned ${response.status}` };
    }

    const data = await response.json();

    // Extract userId based on platform
    let userId: string | undefined;
    let username: string | undefined;

    switch (platform) {
      case 'discord':
        // Discord: { id: "123456789", username: "user" }
        userId = data.id;
        username = data.username;
        break;
      case 'youtube':
        // YouTube: { items: [{ id: "UCxxxxx", snippet: { title: "Channel Name" } }] }
        userId = data.items?.[0]?.id;
        username = data.items?.[0]?.snippet?.title;
        break;
      case 'spotify':
        // Spotify: { id: "user123", display_name: "User Name" }
        userId = data.id;
        username = data.display_name;
        break;
      case 'twitch':
        // Twitch: { data: [{ id: "123456", login: "username" }] }
        userId = data.data?.[0]?.id;
        username = data.data?.[0]?.login;
        break;
      case 'twitter':
        // Twitter: { data: { id: "123456789", username: "user" } }
        userId = data.data?.id;
        username = data.data?.username;
        break;
    }

    if (!userId) {
      return { valid: false, error: 'Could not extract user ID from response' };
    }

    return { valid: true, userId, username };
  } catch (error) {
    console.error(`[LinkSocialWorkflow] ${platform}: Verification failed:`, error);
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Link Social Workflow
 *
 * Links a social account to a wallet by creating a triple on-chain:
 * [wallet] [TERM_ID_VERIFIED] [platform:userId]
 *
 * Flow:
 * 1. Verify OAuth token and extract userId
 * 2. Create wallet atom if needed
 * 3. Create social atom (platform:userId) - reverts if already exists
 * 4. Create triple [wallet] [TERM_ID_VERIFIED] [social]
 */
const executeLinkSocial = createStep({
  id: 'execute-link-social',
  description: 'Verify OAuth token and link social account to wallet on-chain',
  inputSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.walletAddress) {
      return { success: false, error: 'walletAddress is required' };
    }
    if (!inputData?.platform) {
      return { success: false, error: 'platform is required' };
    }
    if (!inputData?.oauthToken) {
      return { success: false, error: 'oauthToken is required' };
    }

    const { walletAddress, platform, oauthToken } = inputData;

    console.log(`[LinkSocialWorkflow] Starting for ${walletAddress} on ${platform}`);

    // Step 1: Verify OAuth token and get userId
    const verification = await verifyAndGetUserId(platform, oauthToken);

    if (!verification.valid || !verification.userId) {
      return {
        success: false,
        platform,
        error: verification.error || 'OAuth verification failed',
      };
    }

    console.log(`[LinkSocialWorkflow] Verified ${platform} user: ${verification.userId} (${verification.username})`);

    // Check for BOT_PRIVATE_KEY
    const botPrivateKey = process.env.BOT_PRIVATE_KEY;
    if (!botPrivateKey) {
      return {
        success: false,
        platform,
        userId: verification.userId,
        username: verification.username,
        error: 'BOT_PRIVATE_KEY not configured on server',
      };
    }

    try {
      // Create viem clients
      const account = privateKeyToAccount(botPrivateKey as `0x${string}`);
      const publicClient = createPublicClient({
        chain: intuitionMainnet,
        transport: http(RPC_URL),
      });
      const walletClient = createWalletClient({
        account,
        chain: intuitionMainnet,
        transport: http(RPC_URL),
      });

      console.log(`[LinkSocialWorkflow] Bot address: ${account.address}`);

      // Build social atom data: "platform:userId"
      const socialAtomData = `${platform}:${verification.userId}`;
      const socialAtomDataHex = stringToHex(socialAtomData);

      console.log(`[LinkSocialWorkflow] Social atom data: ${socialAtomData}`);

      // Calculate atom IDs
      const walletAtomData = stringToHex(walletAddress);
      const walletAtomId = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [walletAtomData],
      });

      const socialAtomId = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [socialAtomDataHex],
      });

      console.log(`[LinkSocialWorkflow] Wallet atom ID: ${walletAtomId}`);
      console.log(`[LinkSocialWorkflow] Social atom ID: ${socialAtomId}`);

      // Check if atoms exist
      const [walletAtomExists, socialAtomExists] = await Promise.all([
        publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'isTermCreated',
          args: [walletAtomId],
        }),
        publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'isTermCreated',
          args: [socialAtomId],
        }),
      ]);

      console.log(`[LinkSocialWorkflow] Wallet atom exists: ${walletAtomExists}`);
      console.log(`[LinkSocialWorkflow] Social atom exists: ${socialAtomExists}`);

      // If social atom already exists, this account is already linked
      if (socialAtomExists) {
        return {
          success: false,
          platform,
          userId: verification.userId,
          username: verification.username,
          error: `This ${platform} account is already linked to a wallet`,
        };
      }

      // Get costs and config from contract
      const [atomCost, tripleCost, generalConfig] = await Promise.all([
        publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'getAtomCost',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'getTripleCost',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'getGeneralConfig',
        }) as Promise<{ minDeposit: bigint }>,
      ]);

      const minDeposit = generalConfig.minDeposit;
      console.log(`[LinkSocialWorkflow] atomCost: ${atomCost}, tripleCost: ${tripleCost}, minDeposit: ${minDeposit}`);

      // Deposit amounts
      const atomDeposit = 500000000000000000n; // 0.5 TRUST for atom creation
      const tripleExtraDeposit = 500000000000000000n; // 0.5 TRUST extra for triple

      let walletAtomCreated = false;
      let socialAtomCreated = false;

      // Step 2: Create wallet atom if needed
      if (!walletAtomExists) {
        console.log(`[LinkSocialWorkflow] Creating wallet atom...`);

        // msg.value must equal sum(assets[]) exactly
        // atomCost is deducted from assets internally
        const atomTotalValue = atomCost + atomDeposit;

        const atomCallData = encodeFunctionData({
          abi: MultiVaultAbi,
          functionName: 'createAtoms',
          args: [[walletAtomData], [atomTotalValue]],
        });

        const createAtomHash = await walletClient.sendTransaction({
          to: MULTIVAULT_ADDRESS,
          data: atomCallData,
          value: atomTotalValue,
          gas: 500000n,
        });

        console.log(`[LinkSocialWorkflow] Wallet atom TX: ${createAtomHash}`);
        const atomReceipt = await publicClient.waitForTransactionReceipt({ hash: createAtomHash });

        if (atomReceipt.status !== 'success') {
          return {
            success: false,
            platform,
            userId: verification.userId,
            username: verification.username,
            error: `Wallet atom creation failed. TX: ${createAtomHash}`,
          };
        }

        console.log(`[LinkSocialWorkflow] Wallet atom created in block ${atomReceipt.blockNumber}`);
        walletAtomCreated = true;
      }

      // Step 3: Create social atom
      console.log(`[LinkSocialWorkflow] Creating social atom: ${socialAtomData}`);

      // msg.value must equal sum(assets[]) exactly
      const socialAtomTotalValue = atomCost + atomDeposit;

      const socialAtomCallData = encodeFunctionData({
        abi: MultiVaultAbi,
        functionName: 'createAtoms',
        args: [[socialAtomDataHex], [socialAtomTotalValue]],
      });

      const createSocialAtomHash = await walletClient.sendTransaction({
        to: MULTIVAULT_ADDRESS,
        data: socialAtomCallData,
        value: socialAtomTotalValue,
        gas: 500000n,
      });

      console.log(`[LinkSocialWorkflow] Social atom TX: ${createSocialAtomHash}`);
      const socialAtomReceipt = await publicClient.waitForTransactionReceipt({ hash: createSocialAtomHash });

      if (socialAtomReceipt.status !== 'success') {
        return {
          success: false,
          platform,
          userId: verification.userId,
          username: verification.username,
          walletAtomCreated,
          error: `Social atom creation failed (may already exist). TX: ${createSocialAtomHash}`,
        };
      }

      console.log(`[LinkSocialWorkflow] Social atom created in block ${socialAtomReceipt.blockNumber}`);
      socialAtomCreated = true;

      // Step 4: Create triple [wallet] [TERM_ID_VERIFIED] [social]
      console.log(`[LinkSocialWorkflow] Creating triple...`);

      // Verify TERM_ID_VERIFIED exists
      const predicateExists = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'isTermCreated',
        args: [TERM_ID_VERIFIED],
      });

      if (!predicateExists) {
        return {
          success: false,
          platform,
          userId: verification.userId,
          username: verification.username,
          walletAtomCreated,
          socialAtomCreated,
          error: 'TERM_ID_VERIFIED atom does not exist on-chain',
        };
      }

      const tripleDepositAmount = tripleCost + tripleExtraDeposit;

      const tripleCallData = encodeFunctionData({
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [
          [walletAtomId as `0x${string}`],      // subjectIds - wallet
          [TERM_ID_VERIFIED as `0x${string}`],  // predicateIds - verified
          [socialAtomId as `0x${string}`],      // objectIds - social account
          [tripleDepositAmount],                // assets
        ],
      });

      const tripleTxHash = await walletClient.sendTransaction({
        to: MULTIVAULT_ADDRESS,
        data: tripleCallData,
        value: tripleDepositAmount,
        gas: 800000n,
      });

      console.log(`[LinkSocialWorkflow] Triple TX: ${tripleTxHash}`);
      const tripleReceipt = await publicClient.waitForTransactionReceipt({ hash: tripleTxHash });

      if (tripleReceipt.status !== 'success') {
        return {
          success: false,
          platform,
          userId: verification.userId,
          username: verification.username,
          walletAtomCreated,
          socialAtomCreated,
          error: `Triple creation failed. TX: ${tripleTxHash}`,
        };
      }

      console.log(`[LinkSocialWorkflow] Triple created in block ${tripleReceipt.blockNumber}`);

      return {
        success: true,
        platform,
        userId: verification.userId,
        username: verification.username,
        txHash: tripleTxHash,
        blockNumber: Number(tripleReceipt.blockNumber),
        walletAtomCreated,
        socialAtomCreated,
      };
    } catch (error) {
      console.error('[LinkSocialWorkflow] Blockchain error:', error);
      return {
        success: false,
        platform,
        userId: verification.userId,
        username: verification.username,
        error: error instanceof Error ? error.message : 'Blockchain transaction failed',
      };
    }
  },
});

// Create the workflow
const linkSocialWorkflow = createWorkflow({
  id: 'link-social-workflow',
  inputSchema,
  outputSchema,
}).then(executeLinkSocial);

linkSocialWorkflow.commit();

export { linkSocialWorkflow };
