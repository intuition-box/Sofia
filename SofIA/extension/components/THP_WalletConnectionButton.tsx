import React from "react"
import { Button } from "~components/ui/button"
import { connectWallet, disconnectWallet } from "../lib/metamask"
import { useStorage } from "@plasmohq/storage/hook"
import { PowerOff } from 'lucide-react';

const WalletConnectionButton = () => {
  const [account, setAccount] = useStorage<string>("metamask-account")
  const [isDisconnectHovered, setIsDisconnectHovered] = React.useState(false)

  const handleConnect = async () => {
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

  const disconnectButtonStyle = {
    padding: '4px',
    color: '#6c757d',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transform: isDisconnectHovered ? 'scale(1.1)' : 'scale(1)'
  }

  const iconStyle = {
    height: '16px',
    width: '16px'
  }

  return (
    <div>
      {!account ? (
        <Button variant="successOutline" onClick={handleConnect}>Connect to Metamask</Button>
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