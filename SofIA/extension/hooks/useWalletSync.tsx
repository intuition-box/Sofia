import { useEffect } from 'react'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { useStorage } from "@plasmohq/storage/hook"

export const useWalletSync = () => {
  const [metamaskAccount] = useStorage<string>("metamask-account")
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    const injectedConnector = connectors.find(connector => connector.type === 'injected')
    
    if (metamaskAccount && !isConnected && injectedConnector) {
      // Sofia has a connected account but wagmi doesn't - connect wagmi
      connect({ connector: injectedConnector })
    } else if (!metamaskAccount && isConnected) {
      // Sofia doesn't have an account but wagmi is connected - disconnect wagmi
      disconnect()
    }
  }, [metamaskAccount, isConnected, connect, disconnect, connectors])

  return {
    isWagmiConnected: isConnected,
    wagmiAddress: address,
    sofiaAccount: metamaskAccount
  }
}