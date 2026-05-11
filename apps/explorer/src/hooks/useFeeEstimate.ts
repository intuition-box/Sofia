import { useState, useEffect, useCallback } from 'react'
import {
  type FeeParams,
  type CostEstimate,
  type CostEstimateOptions,
  getFeeParams,
  estimateDepositCost,
} from '@/services/depositService'

export type { FeeParams, CostEstimate, CostEstimateOptions }

export function useFeeEstimate() {
  const [feeParams, setFeeParams] = useState<FeeParams | null>(null)

  useEffect(() => {
    let cancelled = false
    getFeeParams()
      .then((params) => {
        if (!cancelled) setFeeParams(params)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const estimate = useCallback(
    (
      depositTrust: number,
      options?: CostEstimateOptions,
    ): CostEstimate | null => {
      if (!feeParams) return null
      return estimateDepositCost(depositTrust, feeParams, options)
    },
    [feeParams],
  )

  return { feeParams, estimate, loading: !feeParams }
}
