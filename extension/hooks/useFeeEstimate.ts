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
    Promise.all([
      BlockchainService.getFeeParams(),
      BlockchainService.getTripleCost(),
      BlockchainService.getAtomCost()
    ])
      .then(([fees, tripleCost, atomCost]) => {
        setFeeParams(fees)
        setProtocolCosts({ tripleCost, atomCost })
        logger.debug("Fee params loaded", {
          depositFixed: Number(fees.depositFixed) / 1e18,
          depositPct: Number(fees.depositPct),
          tripleCost: Number(tripleCost) / 1e18,
          atomCost: Number(atomCost) / 1e18
        })
      })
      .catch((err) => {
        logger.error("Failed to load fee params", err)
      })
  }, [])

  const estimate = useCallback(
    (
      depositTrust: number,
      gsPercentage: number,
      opts?: { isNewTriple?: boolean; newAtomCount?: number }
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
