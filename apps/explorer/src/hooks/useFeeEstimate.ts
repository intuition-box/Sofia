import { useState, useEffect, useCallback } from 'react'
import {
  type FeeParams,
  type CostEstimate,
  getFeeParams,
  estimateDepositCost,
} from '@/services/depositService'

export type { FeeParams, CostEstimate }

export function useFeeEstimate() {
  const [feeParams, setFeeParams] = useState<FeeParams | null>(null)

  useEffect(() => {
    let cancelled = false
    getFeeParams()
      .then((params) => { if (!cancelled) setFeeParams(params) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const estimate = useCallback(
    (depositTrust: number): CostEstimate | null => {
      if (!feeParams) return null
      return estimateDepositCost(depositTrust, feeParams)
    },
    [feeParams],
  )

  return { feeParams, estimate, loading: !feeParams }
}
