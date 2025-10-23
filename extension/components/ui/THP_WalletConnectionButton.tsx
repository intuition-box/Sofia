import React from "react"
import { connectWallet, disconnectWallet } from "../../lib/services/metamask"
import { useStorage } from "@plasmohq/storage/hook"
import { PowerOff } from 'lucide-react'
import Iridescence from './Iridescence'

interface WalletConnectionButtonProps {
  disabled?: boolean;
}

const WalletConnectionButton = ({ disabled = false }: WalletConnectionButtonProps) => {
  const [account, setAccount] = useStorage<string>("metamask-account")
  const [isDisconnectHovered, setIsDisconnectHovered] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConnect = async () => {
    if (disabled) return;

    setIsLoading(true)
    try {
      const accountAddress = await connectWallet()
      setAccount(accountAddress)
    } catch (error) {
      console.error("Failed to connect to wallet: ", error)
    } finally {
      setIsLoading(false)
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
        <button
          className={`wallet-connect-button ${isLoading ? 'loading' : ''}`}
          onClick={handleConnect}
          disabled={disabled || isLoading}
        >
          <div className="wallet-button-background">
            <Iridescence
              color={[1, 0.4, 0.5]}
              speed={0.3}
              mouseReact={false}
              amplitude={0.1}
              zoom={0.05}
            />
          </div>
          <span className="wallet-button-content">
            {isLoading ? (
              <>
                <div className="button-spinner"></div>
                Connecting...
              </>
            ) : (
              <>CONNECT WALLET</>
            )}
          </span>
        </button>
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