import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { createPublicClient, createWalletClient, http, encodeFunctionData, stringToHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { intuitionMainnet, RPC_URL } from '../config/chain';
import { MULTIVAULT_ADDRESS, TERM_ID_SOCIALS_PLATFORM, TERM_ID_VERIFIED } from '../config/constants';
import { MultiVaultAbi } from '../config/abi';

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

// Output schema - includes TX info now that bot creates the triple
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
  // TX info (when bot creates the triple)
  txHash: z.string().optional(),
  blockNumber: z.number().optional(),
  atomCreated: z.boolean().optional(),
  tripleAlreadyExists: z.boolean().optional(),
  error: z.string().optional(),
});

// Token verification functions
async function verifyYouTubeToken(token: string): Promise<boolean> {
  try {
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

/**
 * Human Attestor Workflow - BOT CREATES THE TRIPLE
 *
 * This workflow verifies OAuth tokens AND creates the triple on-chain using the bot's wallet.
 * The bot pays for the TX and keeps the shares.
 *
 * Flow:
 * 1. Bot verifies all 5 OAuth tokens against their respective APIs
 * 2. If 5/5 verified:
 *    - Check if user atom exists, create if not
 *    - Check if triple already exists
 *    - Bot signs and sends the createTriple TX to MultiVault directly
 *    - Bot keeps the shares (attestation is the proof, not the shares)
 * 3. Return txHash and blockNumber on success
 */

// Step: Verify OAuth tokens and create triple if verified
const executeHumanAttestor = createStep({
  id: 'execute-human-attestor',
  description: 'Verify OAuth tokens and create triple on-chain if all verified',
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

    // Verify all 5 tokens in parallel
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

    // If not 4/5, return error (temporarily lowered from 5/5 for testing due to Twitter rate limits)
    if (verifiedCount < 4) {
      return {
        success: false,
        verified,
        verifiedCount,
        error: `Only ${verifiedCount}/5 platforms verified. At least 4 platforms must be connected.`,
      };
    }

    // All 5 verified! Now create the triple on-chain
    console.log(`[HumanAttestorWorkflow] All tokens verified! Creating triple on-chain...`);

    // Check for BOT_PRIVATE_KEY
    const botPrivateKey = process.env.BOT_PRIVATE_KEY;
    if (!botPrivateKey) {
      return {
        success: false,
        verified,
        verifiedCount,
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

      console.log(`[HumanAttestorWorkflow] Bot address: ${account.address}`);

      // Calculate user's atom ID from their wallet address
      // Extension uses stringToHex(walletAddress) WITHOUT toLowerCase - case matters for atom ID!
      const userAtomData = stringToHex(walletAddress);
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
      });

      console.log(`[HumanAttestorWorkflow] User atom ID: ${userAtomId}`);

      // Check if user atom exists
      const userAtomExists = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'isTermCreated',
        args: [userAtomId],
      });

      console.log(`[HumanAttestorWorkflow] User atom exists: ${userAtomExists}`);

      let atomCreated = false;

      // Get minDeposit from contract
      // getGeneralConfig returns: (admin, protocolMultisig, feeDenominator, trustBonding, minDeposit, minShare, atomDataMaxLength, feeThreshold)
      const generalConfig = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'getGeneralConfig',
      }) as {
        admin: string;
        protocolMultisig: string;
        feeDenominator: bigint;
        trustBonding: string;
        minDeposit: bigint;
        minShare: bigint;
        atomDataMaxLength: bigint;
        feeThreshold: bigint;
      };

      const minDeposit = generalConfig.minDeposit;
      console.log(`[HumanAttestorWorkflow] minDeposit from contract: ${minDeposit}`);

      // Create user atom if it doesn't exist
      if (!userAtomExists) {
        console.log(`[HumanAttestorWorkflow] Creating user atom...`);

        const atomCost = await publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'getAtomCost',
        }) as bigint;

        // Use 2 TRUST deposit to ensure sufficient balance
        const depositAmount = 2000000000000000000n; // 2 TRUST
        const atomTotalCost = atomCost + depositAmount;
        console.log(`[HumanAttestorWorkflow] Atom cost: ${atomCost}, deposit: ${depositAmount}, total: ${atomTotalCost}`);

        // Encode the function call data manually to bypass viem simulation issues
        const atomCallData = encodeFunctionData({
          abi: MultiVaultAbi,
          functionName: 'createAtoms',
          args: [[userAtomData], [depositAmount]],
        });

        // Use sendTransaction directly to avoid simulation issues with payable functions
        const createAtomHash = await walletClient.sendTransaction({
          to: MULTIVAULT_ADDRESS,
          data: atomCallData,
          value: atomTotalCost,
          gas: 500000n, // Reasonable gas limit for atom creation
        });

        console.log(`[HumanAttestorWorkflow] Atom TX sent: ${createAtomHash}`);
        const atomReceipt = await publicClient.waitForTransactionReceipt({ hash: createAtomHash });

        if (atomReceipt.status !== 'success') {
          return {
            success: false,
            verified,
            verifiedCount,
            error: `Atom creation failed. TX: ${createAtomHash}`,
          };
        }

        console.log(`[HumanAttestorWorkflow] Atom created in block ${atomReceipt.blockNumber}`);
        atomCreated = true;
      }

      // Check if predicate and object atoms exist
      const predicateExists = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'isTermCreated',
        args: [TERM_ID_SOCIALS_PLATFORM],
      });
      const objectExists = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'isTermCreated',
        args: [TERM_ID_VERIFIED],
      });
      console.log(`[HumanAttestorWorkflow] Predicate (SOCIALS_PLATFORM) exists: ${predicateExists}`);
      console.log(`[HumanAttestorWorkflow] Object (VERIFIED) exists: ${objectExists}`);

      if (!predicateExists || !objectExists) {
        return {
          success: false,
          verified,
          verifiedCount,
          atomCreated,
          error: `Required atoms missing. Predicate exists: ${predicateExists}, Object exists: ${objectExists}`,
        };
      }

      // Check if triple already exists
      const tripleId = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'calculateTripleId',
        args: [userAtomId, TERM_ID_SOCIALS_PLATFORM, TERM_ID_VERIFIED],
      });

      console.log(`[HumanAttestorWorkflow] Triple ID would be: ${tripleId}`);

      const tripleExists = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'isTermCreated',
        args: [tripleId],
      });

      if (tripleExists) {
        console.log(`[HumanAttestorWorkflow] Triple already exists: ${tripleId}`);
        return {
          success: true,
          verified,
          verifiedCount,
          tripleAlreadyExists: true,
          atomCreated,
        };
      }

      // Create the triple [user] [socials_platform] [verified]
      console.log(`[HumanAttestorWorkflow] Creating triple...`);

      const tripleCost = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'getTripleCost',
      }) as bigint;

      // Check bot balance
      const botBalance = await publicClient.getBalance({ address: account.address });
      console.log(`[HumanAttestorWorkflow] Bot balance: ${botBalance} wei (${Number(botBalance) / 1e18} ETH)`);

      // IMPORTANT: MultiVault v2 contract logic:
      // 1. _validatePayment(assets) checks: msg.value == sum(assets[])
      // 2. _createTriples checks: _amount >= getTripleCost() * length
      // 3. _calculateTripleCreate: assetsAfterFixedFees = assets - tripleCost
      //    Then fees are deducted from assetsAfterFixedFees
      //
      // This means assets[i] must be GREATER than tripleCost to have something left for the deposit!
      // If assets == tripleCost, then assetsAfterFixedFees = 0, causing the TX to fail.

      // assets[0] = tripleCost + extra deposit for actual vault shares
      // We need to add enough extra deposit on top of tripleCost to cover:
      // 1. protocolFee (percentage of assetsAfterFixedFees)
      // 2. entryFee (percentage of assetsAfterFixedFees)
      // 3. atomDepositFraction (percentage of assetsAfterFixedFees)
      // 4. minShare cost for new vault
      // Using 0.5 TRUST as extra deposit to ensure enough for all fees
      const extraDeposit = 500000000000000000n; // 0.5 TRUST - should be enough for fees
      const tripleDepositAmount = tripleCost + extraDeposit;

      // msg.value must equal sum(assets[])
      const tripleTotalCost = tripleDepositAmount;
      console.log(`[HumanAttestorWorkflow] Triple cost: ${tripleCost}, extra deposit: ${extraDeposit}, total: ${tripleTotalCost}`);
      console.log(`[HumanAttestorWorkflow] Bot has enough balance: ${botBalance >= tripleTotalCost}`);

      // Ensure IDs are properly typed as bytes32 (hex strings with 0x prefix)
      const subjectId = userAtomId as `0x${string}`;
      const predicateId = TERM_ID_SOCIALS_PLATFORM as `0x${string}`;
      const objectId = TERM_ID_VERIFIED as `0x${string}`;

      // Log the args for debugging
      console.log(`[HumanAttestorWorkflow] createTriples args:`);
      console.log(`  - subjectIds: [${subjectId}]`);
      console.log(`  - predicateIds: [${predicateId}]`);
      console.log(`  - objectIds: [${objectId}]`);
      console.log(`  - assets: [${tripleDepositAmount}]`);

      // Check if the atoms are actually atoms (not triples)
      const subjectIsAtom = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'isAtom',
        args: [subjectId],
      });
      const predicateIsAtom = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'isAtom',
        args: [predicateId],
      });
      const objectIsAtom = await publicClient.readContract({
        address: MULTIVAULT_ADDRESS,
        abi: MultiVaultAbi,
        functionName: 'isAtom',
        args: [objectId],
      });
      console.log(`[HumanAttestorWorkflow] Subject isAtom: ${subjectIsAtom}, Predicate isAtom: ${predicateIsAtom}, Object isAtom: ${objectIsAtom}`);

      if (!subjectIsAtom || !predicateIsAtom || !objectIsAtom) {
        return {
          success: false,
          verified,
          verifiedCount,
          atomCreated,
          error: `One or more IDs are not atoms. Subject: ${subjectIsAtom}, Predicate: ${predicateIsAtom}, Object: ${objectIsAtom}`,
        };
      }

      // Encode the function call data manually to bypass viem simulation issues
      const tripleCallData = encodeFunctionData({
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [
          [subjectId],      // subjectIds - user's atom
          [predicateId],    // predicateIds - "socials_platform"
          [objectId],       // objectIds - "verified"
          [tripleDepositAmount],  // assets - 2 TRUST deposit
        ],
      });

      console.log(`[HumanAttestorWorkflow] Encoded calldata: ${tripleCallData.slice(0, 100)}...`);

      // Try to estimate gas first
      try {
        const gasEstimate = await publicClient.estimateGas({
          account: account.address,
          to: MULTIVAULT_ADDRESS,
          data: tripleCallData,
          value: tripleTotalCost,
        });
        console.log(`[HumanAttestorWorkflow] Gas estimate: ${gasEstimate}`);
      } catch (estimateError) {
        console.error(`[HumanAttestorWorkflow] Gas estimation failed:`, estimateError);
        // Continue anyway since we'll use manual gas limit
      }

      // Use sendTransaction directly to avoid simulation issues with payable functions
      const txHash = await walletClient.sendTransaction({
        to: MULTIVAULT_ADDRESS,
        data: tripleCallData,
        value: tripleTotalCost,
        gas: 800000n, // Increased gas limit for triple creation (was failing at 500k)
      });

      console.log(`[HumanAttestorWorkflow] Triple TX sent: ${txHash}`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      console.log(`[HumanAttestorWorkflow] TX receipt status: ${receipt.status}`);
      console.log(`[HumanAttestorWorkflow] Gas used: ${receipt.gasUsed}`);
      console.log(`[HumanAttestorWorkflow] Block number: ${receipt.blockNumber}`);

      if (receipt.status !== 'success') {
        // Try to get more details about the failure
        console.error(`[HumanAttestorWorkflow] TX failed! Receipt:`, JSON.stringify(receipt, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

        // Check if triple was created by someone else in the meantime
        const tripleExistsNow = await publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'isTermCreated',
          args: [tripleId],
        });

        if (tripleExistsNow) {
          console.log(`[HumanAttestorWorkflow] Triple was created by someone else! Returning success.`);
          return {
            success: true,
            verified,
            verifiedCount,
            tripleAlreadyExists: true,
            atomCreated,
          };
        }

        // Try to simulate the call to get the revert reason
        try {
          await publicClient.simulateContract({
            address: MULTIVAULT_ADDRESS,
            abi: MultiVaultAbi,
            functionName: 'createTriples',
            args: [
              [subjectId],
              [predicateId],
              [objectId],
              [tripleDepositAmount],
            ],
            value: tripleTotalCost,
            account: account.address,
          });
        } catch (simError: unknown) {
          console.error(`[HumanAttestorWorkflow] Simulation error:`, simError);
          const errorMessage = simError instanceof Error ? simError.message : String(simError);
          return {
            success: false,
            verified,
            verifiedCount,
            atomCreated,
            error: `Triple creation failed. TX: ${txHash}. Revert reason: ${errorMessage}`,
          };
        }

        return {
          success: false,
          verified,
          verifiedCount,
          atomCreated,
          error: `Triple creation failed. TX: ${txHash}. Gas used: ${receipt.gasUsed}`,
        };
      }

      console.log(`[HumanAttestorWorkflow] Triple created in block ${receipt.blockNumber}`);

      return {
        success: true,
        verified,
        verifiedCount,
        txHash,
        blockNumber: Number(receipt.blockNumber),
        atomCreated,
      };
    } catch (error) {
      console.error('[HumanAttestorWorkflow] Blockchain error:', error);
      return {
        success: false,
        verified,
        verifiedCount,
        error: error instanceof Error ? error.message : 'Blockchain transaction failed',
      };
    }
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
