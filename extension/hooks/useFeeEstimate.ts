import { useState, useEffect, useCallback } from "react"
import { BlockchainService } from "~/lib/services"
import { estimateCertificationCost } from "~/lib/utils"
import type { FeeParams, ProtocolCosts, CostEstimate } from "~/types/blockchain"
import { createHookLogger } from "~/lib/utils"

const logger = createHookLogger("useFeeEstimate")

const GS_DENOMINATOR = 100000

export function useFeeEstimate() {
  const [feeParams, setFeeParams] = useState<FeeParams | null>(null)
  const [protocolCosts, setProtocolCosts] = useState<ProtocolCosts | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadFeeParams = async () => {
      try {
        const fees = await BlockchainService.getFeeParams()
        if (!cancelled) {
          setFeeParams(fees)
          logger.debug("Fee params loaded", {
            depositFixed: Number(fees.depositFixed) / 1e18,
            depositPct: Number(fees.depositPct),
            feeDenom: Number(fees.feeDenom)
          })
        }
      } catch (err) {
        logger.error("Failed to load fee params", err)
      }
    }

    const loadProtocolCosts = async () => {
      try {
        const costs = await BlockchainService.getProtocolCosts()
        if (!cancelled) {
          setProtocolCosts(costs)
          logger.debug("Protocol costs loaded", {
            atomCost: Number(costs.atomCost) / 1e18,
            tripleCost: Number(costs.tripleCost) / 1e18
          })
        }
      } catch (err) {
        logger.error("Failed to load protocol fees", err)
      }
    }

    loadFeeParams()
    loadProtocolCosts()

    return () => { cancelled = true }
  }, [])

  const estimate = useCallback(
    (
      depositTrust: number,
      gsPercentage: number,
      opts?: { isNewTriple?: boolean; newAtomCount?: number; itemCount?: number }
    ): CostEstimate | null => {
      if (!feeParams || !protocolCosts) return null
      return estimateCertificationCost(
        depositTrust,
        gsPercentage,
        GS_DENOMINATOR,
        feeParams,
        protocolCosts,
        opts
      )
    },
    [feeParams, protocolCosts]
  )

  return {
    feeParams,
    protocolCosts,
    estimate,
    loading: !feeParams
  }
}
