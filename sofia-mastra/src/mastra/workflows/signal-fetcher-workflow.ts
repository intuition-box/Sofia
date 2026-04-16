import { createStep, createWorkflow } from "@mastra/core/workflows"
import { z } from "zod"
import { getToken } from "../db/tokens"
import { SIGNAL_FETCHERS } from "../signals/registry"
import { TokenExpiredError } from "../signals/utils"

const inputSchema = z.object({
  platform: z.string().describe("Platform to fetch signals from"),
  walletAddress: z.string().describe("User wallet address"),
})

const outputSchema = z.object({
  success: z.boolean(),
  platformId: z.string().optional(),
  fetchedAt: z.number().optional(),
  metrics: z.record(z.string(), z.number()).optional(),
  error: z.string().optional(),
})

const executeSignalFetch = createStep({
  id: "execute-signal-fetch",
  description: "Fetch platform metrics using stored OAuth token",
  inputSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    const { platform, walletAddress } = inputData

    if (!platform || !walletAddress) {
      return { success: false, error: "platform and walletAddress required" }
    }

    console.log(
      `[SignalFetcher] Fetching ${platform} signals for ${walletAddress.slice(0, 8)}...`
    )

    // 1. Get stored token
    const tokenRecord = await getToken(walletAddress, platform)
    if (!tokenRecord) {
      return { success: false, platformId: platform, error: "no_token" }
    }

    // 2. Get fetcher
    const fetcher = SIGNAL_FETCHERS[platform]
    if (!fetcher) {
      return { success: false, platformId: platform, error: "no_fetcher" }
    }

    // 3. Fetch metrics
    try {
      const metrics = await fetcher(
        tokenRecord.access_token,
        tokenRecord.user_id
      )

      console.log(
        `[SignalFetcher] ${platform} metrics fetched:`,
        Object.keys(metrics).join(", ")
      )

      return {
        success: true,
        platformId: platform,
        fetchedAt: Date.now(),
        metrics,
      }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        console.warn(`[SignalFetcher] ${platform} token expired`)
        return {
          success: false,
          platformId: platform,
          error: "token_expired",
        }
      }

      console.error(`[SignalFetcher] ${platform} fetch error:`, error)
      return {
        success: false,
        platformId: platform,
        error:
          error instanceof Error ? error.message : "Unknown fetch error",
      }
    }
  },
})

const signalFetcherWorkflow = createWorkflow({
  id: "signal-fetcher-workflow",
  inputSchema,
  outputSchema,
}).then(executeSignalFetch)

signalFetcherWorkflow.commit()

export { signalFetcherWorkflow }
