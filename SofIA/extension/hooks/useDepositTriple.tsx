import { CURRENT_ENV } from '../const/general'
import type { GetContractReturnType } from 'viem'

import { getChainEnvConfig } from '../lib/environment'
import { useContractWriteAndWait } from './useContractWriteAndWait'
import { useMultivaultContract } from './useMultivaultContract'

export const useDepositTriple = (contract: string) => {
  const multivault = useMultivaultContract(
    contract,
    getChainEnvConfig(CURRENT_ENV).chainId,
  ) as GetContractReturnType

  return useContractWriteAndWait({
    ...multivault,
    // @ts-ignore TODO: Fix type for useContractWriteAndWait
    functionName: 'depositTriple',
  })
}