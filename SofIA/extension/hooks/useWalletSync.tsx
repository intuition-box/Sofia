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
    
    console.log('Available connectors:', connectors.map(c => ({ id: c.id, type: c.type, name: c.name })))
    console.log('MetaMask account:', metamaskAccount)
    console.log('Wagmi connected:', isConnected)
    console.log('Found injected connector:', injectedConnector)
    
    if (metamaskAccount && !isConnected && injectedConnector) {
      console.log('Connecting wagmi to match Sofia...')
      try {
        connect({ connector: injectedConnector })
        console.log('Wagmi connection initiated')
      } catch (error) {
        console.error('Wagmi connection failed:', error)
      }
    } else if (!metamaskAccount && isConnected) {
      console.log('Disconnecting wagmi to match Sofia...')
      disconnect()
    }
  }, [metamaskAccount, isConnected, connect, disconnect, connectors])

  return {
    isWagmiConnected: isConnected,
    wagmiAddress: address,
    sofiaAccount: metamaskAccount
  }
}