import { createStep, createWorkflow } from "@mastra/core/workflows"
import { z } from "zod"
import { getToken } from "../db/tokens"
import { SIGNAL_FETCHERS, runFetcher } from "../signals/registry"
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
  warnings: z.array(z.string()).optional(),
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

    const tokenRecord = await getToken(walletAddress, platform)
    if (!tokenRecord) {
      return { success: false, platformId: platform, error: "no_token" }
    }

    if (!SIGNAL_FETCHERS[platform]) {
      return { success: false, platformId: platform, error: "no_fetcher" }
    }

    try {
      const { metrics, warnings } = await runFetcher(
        platform,
        tokenRecord.access_token,
        tokenRecord.user_id
      )

      console.log(
        `[SignalFetcher] ${platform} metrics: ${Object.keys(metrics).join(", ")}` +
          (warnings.length ? ` | warnings: ${warnings.length}` : "")
      )

      return {
        success: true,
        platformId: platform,
        fetchedAt: Date.now(),
        metrics,
        warnings,
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
