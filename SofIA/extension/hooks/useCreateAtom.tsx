import { useState } from 'react'
import { CURRENT_ENV, MULTIVAULT_CONTRACT_ADDRESS } from '../const/general'
import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/viemClients'
import { getChainEnvConfig } from '../lib/environment'
import { multivaultAbi } from '../lib/multiVault'

export const useCreateAtom = () => {
  const [metamaskAccount] = useStorage<string>("metamask-account")
  const [isIdle, setIsIdle] = useState(true)
  const [awaitingWalletConfirmation, setAwaitingWalletConfirmation] = useState(false)
  const [awaitingOnChainConfirmation, setAwaitingOnChainConfirmation] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const chainConfig = getChainEnvConfig(CURRENT_ENV)

  const writeContractAsync = async (args: any) => {
    console.log('writeContractAsync called with Sofia account:', metamaskAccount)
    console.log('args received:', args)
    
    if (!metamaskAccount || typeof metamaskAccount !== 'string') {
      throw new Error('No valid MetaMask account connected in Sofia')
    }

    try {
      setIsIdle(false)
      setIsError(false)
      setAwaitingWalletConfirmation(true)

      const { walletClient, publicClient } = await getClients()
      
      console.log('Using direct viem clients for transaction')
      console.log('Contract address:', MULTIVAULT_CONTRACT_ADDRESS)
      console.log('Account:', metamaskAccount)
      
      const hash = await walletClient.writeContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as `0x${string}`,
        abi: multivaultAbi,
        functionName: 'createAtom',
        args: args.args
      } as any)

      console.log('Transaction hash:', hash)
      setAwaitingWalletConfirmation(false)
      setAwaitingOnChainConfirmation(true)

      const txReceipt = await publicClient.waitForTransactionReceipt({ hash })
      
      console.log('Transaction confirmed:', txReceipt)
      setAwaitingOnChainConfirmation(false)
      setIsSuccess(true)
      setReceipt(txReceipt)

      return hash

    } catch (error) {
      console.error('Transaction failed:', error)
      setAwaitingWalletConfirmation(false)
      setAwaitingOnChainConfirmation(false)
      setIsError(true)
      throw error
    }
  }

  const reset = () => {
    setIsIdle(true)
    setAwaitingWalletConfirmation(false)
    setAwaitingOnChainConfirmation(false)
    setIsError(false)
    setIsSuccess(false)
    setReceipt(null)
  }

  return {
    writeContractAsync,
    isIdle,
    awaitingWalletConfirmation,
    awaitingOnChainConfirmation,
    isError,
    isSuccess,
    receipt,
    reset
  }
}