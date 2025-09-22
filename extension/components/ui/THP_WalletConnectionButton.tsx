import React from "react"
import { connectWallet, disconnectWallet } from "../../lib/services/metamask"
import { useStorage } from "@plasmohq/storage/hook"
import { PowerOff } from 'lucide-react'
import '../styles/Buttons.css'

interface WalletConnectionButtonProps {
  disabled?: boolean;
}

const WalletConnectionButton = ({ disabled = false }: WalletConnectionButtonProps) => {
  const [account, setAccount] = useStorage<string>("metamask-account")

  const handleConnect = async () => {
    if (disabled) return;
    
    try {
      const accountAddress = await connectWallet()
      setAccount(accountAddress)
    } catch (error) {
      console.error("Failed to connect to wallet: ", error)
    }
  }

  const handleDisconnect = () => {
    setAccount("");
    disconnectWallet()
  }

  const iconStyle = {
    height: '16px',
    width: '16px'
  }

  return (
    <div>
      {!account ? (
        <button
          onClick={handleConnect}
          disabled={disabled}
          className="btn btn-default btn-primary"
          style={{ width: '350px' }}
        >
          Connect your Wallet
        </button>
      ) : (
        <div>
          <button
            title="Disconnect"
            onClick={handleDisconnect}
            className="btn btn-sm btn-ghost"
          >
            <PowerOff style={iconStyle}/>
          </button>
        </div>
      )}
    </div>
  )
}

export default WalletConnectionButton