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

// Output schema - simplified: just verification result, no TX
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
  // If all 5 verified, user can proceed to sign the TX themselves
  canCreateAttestation: z.boolean(),
  error: z.string().optional(),
});

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

/**
 * Human Attestor Workflow - SIMPLIFIED
 *
 * This workflow ONLY verifies the OAuth tokens.
 * If all 5 tokens are valid, the user can proceed to sign the attestation TX themselves.
 *
 * Flow:
 * 1. Bot verifies all 5 OAuth tokens against their respective APIs
 * 2. If 5/5 verified, return canCreateAttestation: true
 * 3. Extension then prompts user to sign the createTriples TX
 *
 * This eliminates all approval complexity since user signs their own TX.
 */

// Step: Verify OAuth tokens only
const executeHumanAttestor = createStep({
  id: 'execute-human-attestor',
  description: 'Verify OAuth tokens - user will sign TX if all verified',
  inputSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.walletAddress) {
      return {
        success: false,
        verified: { youtube: false, spotify: false, discord: false, twitch: false, twitter: false },
        verifiedCount: 0,
        canCreateAttestation: false,
        error: 'walletAddress is required',
      };
    }

    if (!inputData?.tokens) {
      return {
        success: false,
        verified: { youtube: false, spotify: false, discord: false, twitch: false, twitter: false },
        verifiedCount: 0,
        canCreateAttestation: false,
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

    // If not 5/5, return error
    if (verifiedCount < 5) {
      return {
        success: false,
        verified,
        verifiedCount,
        canCreateAttestation: false,
        error: `Only ${verifiedCount}/5 platforms verified. All 5 platforms must be connected.`,
      };
    }

    // All 5 verified! User can proceed to sign the TX
    console.log(`[HumanAttestorWorkflow] All tokens verified! User can create attestation.`);

    return {
      success: true,
      verified,
      verifiedCount,
      canCreateAttestation: true,
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
