import { useEffect } from 'react'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { useStorage } from "@plasmohq/storage/hook"

export const useWalletSync = () => {
  const [metamaskAccount] = useStorage<string>("metamask-account")
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    const injectedConnector = connectors.find(connector => 
      connector.type === 'injected' || connector.id === 'injected'
    )
    
    if (metamaskAccount && !isConnected && injectedConnector) {
      try {
        connect({ connector: injectedConnector })
      } catch (error) {
        console.error('Wagmi connection failed:', error)
      }
    } else if (!metamaskAccount && isConnected) {
      disconnect()
    }
  }, [metamaskAccount, isConnected, connect, disconnect, connectors])

  return {
    isWagmiConnected: isConnected,
    wagmiAddress: address,
    sofiaAccount: metamaskAccount
  }
}