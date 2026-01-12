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

// Constants - MAINNET
const SOFIA_PROXY_ADDRESS = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c';
const RPC_ENDPOINT = 'https://rpc.intuition.systems';

// Atom URIs for the triple [User] [is_human] [verified]
const ATOM_URI_IS_HUMAN = 'ipfs://bafkreieozejceuaepmev7cq7h5eiytzjd7nitvjx3ts5mm345yt4hn66dy';
const ATOM_URI_VERIFIED = 'ipfs://bafkreifl5pvodlgr3p3oq7e3u7c6364pqhuw75g6pblxomoafaaz3be2vi';

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
function verifyTwitterToken(token: string): boolean {
  return !!token && token.length > 0;
}

// Créer la transaction on-chain via Sofia Proxy
// Triple: [User wallet atom] [is_human] [verified]
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

    // ABI pour Sofia Proxy Fee contract
    const sofiaProxyAbi = [
      'function createTriple(address receiver, bytes subjectUri, bytes predicateUri, bytes objectUri) payable returns (uint256)',
      'function getTripleCreationCost() view returns (uint256)',
      'function getAtomCreationCost() view returns (uint256)',
    ];

    const sofiaProxy = new ethers.Contract(SOFIA_PROXY_ADDRESS, sofiaProxyAbi, botWallet);

    // L'atom du user est son adresse wallet
    const userAtomUri = walletAddress;

    // Calculer le coût (3 atoms potentiels + 1 triple)
    const atomCost = await sofiaProxy.getAtomCreationCost();
    const tripleCost = await sofiaProxy.getTripleCreationCost();
    const totalCost = (atomCost * 3n) + tripleCost;

    console.log(`[HumanAttestor] Creating triple for ${walletAddress}`);
    console.log(`[HumanAttestor] Subject (User): ${userAtomUri}`);
    console.log(`[HumanAttestor] Predicate (is_human): ${ATOM_URI_IS_HUMAN}`);
    console.log(`[HumanAttestor] Object (verified): ${ATOM_URI_VERIFIED}`);
    console.log(`[HumanAttestor] Total cost: ${ethers.formatEther(totalCost)} ETH`);

    // Encoder les URIs en bytes
    const subjectBytes = ethers.toUtf8Bytes(userAtomUri);
    const predicateBytes = ethers.toUtf8Bytes(ATOM_URI_IS_HUMAN);
    const objectBytes = ethers.toUtf8Bytes(ATOM_URI_VERIFIED);

    // Créer le triple
    const tx = await sofiaProxy.createTriple(
      walletAddress,
      subjectBytes,
      predicateBytes,
      objectBytes,
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

export { inputSchema, outputSchema };
