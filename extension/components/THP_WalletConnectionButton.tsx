import React from "react"
import { connectWallet, disconnectWallet } from "../lib/metamask"
import { useStorage } from "@plasmohq/storage/hook"
import { PowerOff } from 'lucide-react'
import connectButton from './ui/icons/ConnectButton.png'
import connectButtonHover from './ui/icons/ConnectButtonHover.png'
import { useSmartAccount } from "../hooks/useSmartAccount"

interface WalletConnectionButtonProps {
  disabled?: boolean;
}

const WalletConnectionButton = ({ disabled = false }: WalletConnectionButtonProps) => {
  const [account, setAccount] = useStorage<string>("metamask-account")
  const [isDisconnectHovered, setIsDisconnectHovered] = React.useState(false)
  const [isConnectHovered, setIsConnectHovered] = React.useState(false)
  
  const smartAccount = useSmartAccount()
  
  // Auto-setup Smart Wallet only happens during connection in handleConnect

  const handleConnect = async () => {
    if (disabled) return;
    
    try {
      const accountAddress = await connectWallet()
      console.log('💳 Connected to wallet:', accountAddress)
      console.log('💾 Setting account in storage...')
      setAccount(accountAddress)
      console.log('✅ Account set in storage')
      
      // Force Smart Account initialization after storage is set
      console.log('⚡ Forcing Smart Account initialization with address:', accountAddress)
      setTimeout(async () => {
        try {
          console.log('🚀 Auto-deploying Smart Wallet for new user...')
          await smartAccount.deployAtomWallet(accountAddress)
          console.log('✅ Smart Wallet auto-deployment completed!')
        } catch (deployError) {
          console.warn('⚠️ Smart Wallet auto-deployment failed:', deployError)
        }
      }, 100) // Small delay to ensure storage propagation
    } catch (error) {
      console.error("Failed to connect to wallet: ", error)
    }
  }

  const handleDisconnect = () => {
    setAccount("");
    disconnectWallet()
  }

  const disconnectButtonStyle = {
    padding: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    color: isDisconnectHovered ? '#dc3545' : '#6c757d'
  }

  const iconStyle = {
    height: '16px',
    width: '16px'
  }

  return (
    <div>
      {!account ? (
        <img
          src={isConnectHovered && !disabled ? connectButtonHover : connectButton}
          alt="Connect your Wallet"
          onClick={handleConnect}
          onMouseEnter={() => !disabled && setIsConnectHovered(true)}
          onMouseLeave={() => setIsConnectHovered(false)}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            width: '350px',
            height: 'auto',
            objectFit: 'cover',
            filter: isConnectHovered && !disabled ? 'drop-shadow(0 0 20px rgba(242, 213, 124, 0.4)) drop-shadow(0 0 20px rgba(213, 223, 136, 0.4)) drop-shadow(0 0 20px rgba(251, 110, 58, 0.4)) drop-shadow(0 0 20px rgba(208, 74, 164, 0.4))' : 'none'
          }}
        />
      ) : (
        <div>
          <button
            title="Disconnect"
            onClick={handleDisconnect}
            style={disconnectButtonStyle}
            onMouseEnter={() => setIsDisconnectHovered(true)}
            onMouseLeave={() => setIsDisconnectHovered(false)}
          >
            <PowerOff style={iconStyle}/>
          </button>
        </div>
      )}
    </div>
  )
}

export default WalletConnectionButton