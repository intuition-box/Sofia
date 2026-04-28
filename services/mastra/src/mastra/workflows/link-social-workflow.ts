import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import {
  createPublicClient,
  createWalletClient,
  http,
  stringToHex,
  encodeFunctionData,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { storeToken } from '../db/tokens'
import { verifyAndGetUserId, type Platform } from '../oauth/verify'
import { intuitionMainnet, RPC_URL } from '../config/chain'
import {
  MULTIVAULT_ADDRESS,
  TERM_ID_HAS_VERIFIED_YOUTUBE,
  TERM_ID_HAS_VERIFIED_DISCORD,
  TERM_ID_HAS_VERIFIED_SPOTIFY,
  TERM_ID_HAS_VERIFIED_TWITCH,
  TERM_ID_HAS_VERIFIED_TWITTER,
} from '../config/constants'
import { MultiVaultAbi } from '../config/abi'

const INTUITION_GRAPHQL_ENDPOINT = 'https://mainnet.intuition.sh/v1/graphql'

/**
 * Pin data to IPFS via Intuition's pinThing mutation.
 * Returns the IPFS URI used as the atom data.
 */
async function pinToIPFS(name: string, description: string): Promise<string> {
  const mutation = `
    mutation PinThing($thing: PinThingInput!) {
      pinThing(thing: $thing) {
        uri
      }
    }
  `

  const response = await fetch(INTUITION_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: mutation,
      variables: {
        thing: { name, description, image: '', url: '' },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`IPFS pinning failed: ${response.status}`)
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(`IPFS pinning error: ${result.errors[0].message}`)
  }

  const uri = result.data?.pinThing?.uri
  if (!uri) {
    throw new Error('No IPFS URI returned from pinThing')
  }

  return uri
}

const PREDICATE_NAMES: Record<string, string> = {
  discord: 'has verified discord id',
  youtube: 'has verified youtube id',
  spotify: 'has verified spotify id',
  twitch: 'has verified twitch id',
  twitter: 'has verified twitter id',
}

/**
 * Pre-existing predicate term IDs already on-chain. Platforms NOT listed here
 * will get their token stored and verified, but the on-chain triple creation
 * is skipped (it would fail without a predicate atom).
 *
 * To enable on-chain linking for a new platform: create the
 * "has verified <platform> id" atom on the Intuition contract, then add the
 * resulting term_id to ../config/constants.ts and reference it here.
 */
const PREDICATE_TERM_IDS: Partial<Record<Platform, `0x${string}`>> = {
  youtube: TERM_ID_HAS_VERIFIED_YOUTUBE,
  discord: TERM_ID_HAS_VERIFIED_DISCORD,
  spotify: TERM_ID_HAS_VERIFIED_SPOTIFY,
  twitch: TERM_ID_HAS_VERIFIED_TWITCH,
  twitter: TERM_ID_HAS_VERIFIED_TWITTER,
}

const inputSchema = z.object({
  walletAddress: z.string().describe('User wallet address'),
  platform: z
    .enum([
      'discord',
      'youtube',
      'spotify',
      'twitch',
      'twitter',
      'github',
      'reddit',
      'strava',
      'soundcloud',
      'mixcloud',
      'producthunt',
      'orcid',
      'coinbase',
    ])
    .describe('Social platform'),
  oauthToken: z.string().describe('OAuth access token'),
})

const outputSchema = z.object({
  success: z.boolean(),
  platform: z.string().optional(),
  userId: z.string().optional(),
  username: z.string().optional(),
  txHash: z.string().optional(),
  blockNumber: z.number().optional(),
  walletAtomCreated: z.boolean().optional(),
  predicateAtomCreated: z.boolean().optional(),
  socialAtomCreated: z.boolean().optional(),
  onchainSkipped: z.boolean().optional(),
  error: z.string().optional(),
})

/**
 * Link Social Workflow
 *
 * Verifies the OAuth token, stores it encrypted, and (when a predicate atom
 * exists on-chain) creates the triple `[wallet] [has verified {platform} id] [userId]`.
 *
 * For platforms without an on-chain predicate atom yet, the workflow still
 * verifies and stores the token — signal fetching works, on-chain proof is
 * skipped until the predicate atom is created.
 */
const executeLinkSocial = createStep({
  id: 'execute-link-social',
  description:
    'Verify OAuth token, store it, and link the platform on-chain when possible',
  inputSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.walletAddress) {
      return { success: false, error: 'walletAddress is required' }
    }
    if (!inputData?.platform) {
      return { success: false, error: 'platform is required' }
    }
    if (!inputData?.oauthToken) {
      return { success: false, error: 'oauthToken is required' }
    }

    const { walletAddress, platform, oauthToken } = inputData

    console.log(
      `[LinkSocialWorkflow] Starting for ${walletAddress} on ${platform}`,
    )

    // Step 1: Verify OAuth token and get userId
    const verification = await verifyAndGetUserId(platform, oauthToken)

    if (!verification.valid || !verification.userId) {
      return {
        success: false,
        platform,
        error: verification.error || 'OAuth verification failed',
      }
    }

    console.log(
      `[LinkSocialWorkflow] Verified ${platform} user: ${verification.userId} (${verification.username})`,
    )

    // Step 2: Store the OAuth token (encrypted) — non-blocking
    try {
      await storeToken(
        walletAddress,
        platform,
        oauthToken,
        undefined,
        verification.userId,
        verification.username,
      )
    } catch (err) {
      console.warn(
        '[LinkSocialWorkflow] Token storage failed (non-blocking):',
        err,
      )
    }

    // Step 3: Check if we have a predicate atom for on-chain link
    const predicateAtomId = PREDICATE_TERM_IDS[platform]
    if (!predicateAtomId) {
      console.log(
        `[LinkSocialWorkflow] No predicate atom for ${platform} — skipping on-chain link.`,
      )
      return {
        success: true,
        platform,
        userId: verification.userId,
        username: verification.username,
        onchainSkipped: true,
      }
    }

    const botPrivateKey = process.env.BOT_PRIVATE_KEY
    if (!botPrivateKey) {
      return {
        success: false,
        platform,
        userId: verification.userId,
        username: verification.username,
        error: 'BOT_PRIVATE_KEY not configured on server',
      }
    }

    try {
      const account = privateKeyToAccount(botPrivateKey as `0x${string}`)
      const publicClient = createPublicClient({
        chain: intuitionMainnet,
        transport: http(RPC_URL),
      })
      const walletClient = createWalletClient({
        account,
        chain: intuitionMainnet,
        transport: http(RPC_URL),
      })

      console.log(`[LinkSocialWorkflow] Bot address: ${account.address}`)

      const userId = verification.userId
      const socialDescription = `Verified ${platform} account ID`

      console.log(
        `[LinkSocialWorkflow] Pinning social atom to IPFS: name=${userId}, description=${socialDescription}`,
      )
      const socialIpfsUri = await pinToIPFS(userId, socialDescription)
      console.log(`[LinkSocialWorkflow] Social atom IPFS URI: ${socialIpfsUri}`)

      const socialAtomDataHex = stringToHex(socialIpfsUri)
      const predicateName = PREDICATE_NAMES[platform]

      console.log(
        `[LinkSocialWorkflow] Predicate: ${predicateName} (term_id: ${predicateAtomId})`,
      )

      const walletAtomData = stringToHex(walletAddress)
      const [walletAtomId, socialAtomId] = await Promise.all([
        publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'calculateAtomId',
          args: [walletAtomData],
        }),
        publicClient.readContract({
          address: MULTIVAULT_ADDRESS,
          abi: MultiVaultAbi,
          functionName: 'calculateAtomId',
          args: [socialAtomDataHex],
        }),
      ])

      console.log(`[LinkSocialWorkflow] Wallet atom ID: ${walletAtomId}`)
      console.log(`[LinkSocialWorkflow] Social atom ID: ${socialAtomId}`)

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
      ])

      console.log(
        `[LinkSocialWorkflow] Wallet atom exists: ${walletAtomExists}`,
      )
      console.log(
        `[LinkSocialWorkflow] Social atom exists: ${socialAtomExists}`,
      )

      const [atomCost, tripleCost] = await Promise.all([
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
      ])

      console.log(
        `[LinkSocialWorkflow] atomCost: ${atomCost}, tripleCost: ${tripleCost}`,
      )

      const atomDeposit = 500000000000000000n // 0.5 TRUST
      const tripleExtraDeposit = 500000000000000000n // 0.5 TRUST extra for fees

      let walletAtomCreated = false
      let socialAtomCreated = false

      if (!walletAtomExists) {
        console.log(`[LinkSocialWorkflow] Creating wallet atom...`)
        const atomTotalValue = atomCost + atomDeposit
        const atomCallData = encodeFunctionData({
          abi: MultiVaultAbi,
          functionName: 'createAtoms',
          args: [[walletAtomData], [atomTotalValue]],
        })

        const createAtomHash = await walletClient.sendTransaction({
          to: MULTIVAULT_ADDRESS,
          data: atomCallData,
          value: atomTotalValue,
          gas: 500000n,
        })

        console.log(`[LinkSocialWorkflow] Wallet atom TX: ${createAtomHash}`)
        const atomReceipt = await publicClient.waitForTransactionReceipt({
          hash: createAtomHash,
        })

        if (atomReceipt.status !== 'success') {
          return {
            success: false,
            platform,
            userId: verification.userId,
            username: verification.username,
            error: `Wallet atom creation failed. TX: ${createAtomHash}`,
          }
        }

        console.log(
          `[LinkSocialWorkflow] Wallet atom created in block ${atomReceipt.blockNumber}`,
        )
        walletAtomCreated = true
      }

      if (!socialAtomExists) {
        console.log(
          `[LinkSocialWorkflow] Creating social atom: ${userId} (IPFS: ${socialIpfsUri})`,
        )
        const socialAtomTotalValue = atomCost + atomDeposit

        const socialAtomCallData = encodeFunctionData({
          abi: MultiVaultAbi,
          functionName: 'createAtoms',
          args: [[socialAtomDataHex], [socialAtomTotalValue]],
        })

        const createSocialAtomHash = await walletClient.sendTransaction({
          to: MULTIVAULT_ADDRESS,
          data: socialAtomCallData,
          value: socialAtomTotalValue,
          gas: 500000n,
        })

        console.log(
          `[LinkSocialWorkflow] Social atom TX: ${createSocialAtomHash}`,
        )
        const socialAtomReceipt = await publicClient.waitForTransactionReceipt({
          hash: createSocialAtomHash,
        })

        if (socialAtomReceipt.status !== 'success') {
          return {
            success: false,
            platform,
            userId: verification.userId,
            username: verification.username,
            walletAtomCreated,
            error: `Social atom creation failed. TX: ${createSocialAtomHash}`,
          }
        }

        console.log(
          `[LinkSocialWorkflow] Social atom created in block ${socialAtomReceipt.blockNumber}`,
        )
        socialAtomCreated = true
      }

      console.log(
        `[LinkSocialWorkflow] Creating triple: [${walletAddress}] [${predicateName}] [${userId}]`,
      )

      const tripleDepositAmount = tripleCost + tripleExtraDeposit

      const tripleCallData = encodeFunctionData({
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [
          [walletAtomId as `0x${string}`],
          [predicateAtomId as `0x${string}`],
          [socialAtomId as `0x${string}`],
          [tripleDepositAmount],
        ],
      })

      const tripleTxHash = await walletClient.sendTransaction({
        to: MULTIVAULT_ADDRESS,
        data: tripleCallData,
        value: tripleDepositAmount,
        gas: 800000n,
      })

      console.log(`[LinkSocialWorkflow] Triple TX: ${tripleTxHash}`)
      const tripleReceipt = await publicClient.waitForTransactionReceipt({
        hash: tripleTxHash,
      })

      if (tripleReceipt.status !== 'success') {
        return {
          success: false,
          platform,
          userId: verification.userId,
          username: verification.username,
          walletAtomCreated,
          socialAtomCreated,
          error: `Triple creation failed. TX: ${tripleTxHash}`,
        }
      }

      console.log(
        `[LinkSocialWorkflow] Triple created in block ${tripleReceipt.blockNumber}`,
      )

      return {
        success: true,
        platform,
        userId: verification.userId,
        username: verification.username,
        txHash: tripleTxHash,
        blockNumber: Number(tripleReceipt.blockNumber),
        walletAtomCreated,
        predicateAtomCreated: false,
        socialAtomCreated,
      }
    } catch (error) {
      console.error('[LinkSocialWorkflow] Blockchain error:', error)
      return {
        success: false,
        platform,
        userId: verification.userId,
        username: verification.username,
        error:
          error instanceof Error
            ? error.message
            : 'Blockchain transaction failed',
      }
    }
  },
})

const linkSocialWorkflow = createWorkflow({
  id: 'link-social-workflow',
  inputSchema,
  outputSchema,
}).then(executeLinkSocial)

linkSocialWorkflow.commit()

export { linkSocialWorkflow }
