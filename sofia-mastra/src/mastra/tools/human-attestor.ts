import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Schema d'entrée
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

// Schema de sortie
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

// Fonctions de vérification des tokens OAuth
async function verifyYouTubeToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
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
      console.warn('[HumanAttestor] TWITCH_CLIENT_ID not set');
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

// Pour Twitter, on vérifie juste la présence du token
// (la vérification complète nécessiterait l'API Twitter payante)
function verifyTwitterToken(token: string): boolean {
  return !!token && token.length > 0;
}

// Créer la transaction on-chain via Sofia Proxy
async function createAttestationOnChain(walletAddress: string): Promise<{
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
}> {
  // Import ethers dynamically to avoid bundling issues
  const { ethers } = await import('ethers');

  const botPrivateKey = process.env.BOT_PRIVATE_KEY;
  const sofiaProxyAddress = process.env.SOFIA_PROXY_ADDRESS;
  const rpcEndpoint = process.env.RPC_ENDPOINT;

  if (!botPrivateKey || !sofiaProxyAddress || !rpcEndpoint) {
    return {
      success: false,
      error: 'Missing environment variables: BOT_PRIVATE_KEY, SOFIA_PROXY_ADDRESS, or RPC_ENDPOINT',
    };
  }

  // Atom IDs pour le triple [I] [is_human] [verified]
  const atomIdI = process.env.ATOM_ID_I;
  const atomIdIsHuman = process.env.ATOM_ID_IS_HUMAN;
  const atomIdVerified = process.env.ATOM_ID_VERIFIED;

  if (!atomIdI || !atomIdIsHuman || !atomIdVerified) {
    return {
      success: false,
      error: 'Missing ATOM_ID environment variables',
    };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const botWallet = new ethers.Wallet(botPrivateKey, provider);

    // ABI minimal pour Sofia Proxy Fee contract
    const sofiaProxyAbi = [
      'function createTriples(address receiver, bytes32[] subjectIds, bytes32[] predicateIds, bytes32[] objectIds, uint256[] assets, uint256 curveId) payable returns (bytes32[])',
      'function getTripleCost() view returns (uint256)',
    ];

    const sofiaProxy = new ethers.Contract(sofiaProxyAddress, sofiaProxyAbi, botWallet);

    // Calculer le coût
    const tripleCost = await sofiaProxy.getTripleCost();
    const depositAmount = ethers.parseEther('0.001'); // Petit dépôt initial
    const totalCost = tripleCost + depositAmount;

    console.log(`[HumanAttestor] Creating triple for ${walletAddress}`);
    console.log(`[HumanAttestor] Triple cost: ${ethers.formatEther(tripleCost)} ETH`);
    console.log(`[HumanAttestor] Total cost: ${ethers.formatEther(totalCost)} ETH`);

    // Créer le triple
    const tx = await sofiaProxy.createTriples(
      walletAddress, // receiver = user (reçoit les shares)
      [atomIdI],
      [atomIdIsHuman],
      [atomIdVerified],
      [depositAmount],
      1n, // curveId
      { value: totalCost }
    );

    console.log(`[HumanAttestor] TX sent: ${tx.hash}`);

    const receipt = await tx.wait();

    console.log(`[HumanAttestor] TX confirmed in block ${receipt.blockNumber}`);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('[HumanAttestor] TX error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

export const humanAttestorTool = createTool({
  id: 'human-attestor',
  description:
    'Verify OAuth tokens from 5 platforms (YouTube, Spotify, Discord, Twitch, Twitter) and create a human attestation triple on-chain. The bot pays all gas fees.',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { walletAddress, tokens } = context;

    console.log(`[HumanAttestor] Starting verification for ${walletAddress}`);

    // 1. Vérifier les 5 tokens en parallèle
    const [youtube, spotify, discord, twitch, twitter] = await Promise.all([
      tokens.youtube ? verifyYouTubeToken(tokens.youtube) : false,
      tokens.spotify ? verifySpotifyToken(tokens.spotify) : false,
      tokens.discord ? verifyDiscordToken(tokens.discord) : false,
      tokens.twitch ? verifyTwitchToken(tokens.twitch) : false,
      tokens.twitter ? verifyTwitterToken(tokens.twitter) : false,
    ]);

    const verified = { youtube, spotify, discord, twitch, twitter };
    const verifiedCount = Object.values(verified).filter(Boolean).length;

    console.log(`[HumanAttestor] Verified ${verifiedCount}/5 platforms:`, verified);

    // 2. Si pas 5/5, retourner erreur
    if (verifiedCount < 5) {
      return {
        success: false,
        verified,
        verifiedCount,
        error: `Only ${verifiedCount}/5 platforms verified. All 5 platforms must be connected.`,
      };
    }

    // 3. Créer l'attestation on-chain
    const txResult = await createAttestationOnChain(walletAddress);

    if (!txResult.success) {
      return {
        success: false,
        verified,
        verifiedCount,
        error: txResult.error,
      };
    }

    console.log(`[HumanAttestor] Attestation created successfully: ${txResult.txHash}`);

    return {
      success: true,
      verified,
      verifiedCount,
      txHash: txResult.txHash,
      blockNumber: txResult.blockNumber,
    };
  },
});

// Export schemas for reuse
export { inputSchema, outputSchema };
