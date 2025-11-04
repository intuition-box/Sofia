import React from "react"
import { connectWallet, disconnectWallet } from "../../lib/services/metamask"
import { useStorage } from "@plasmohq/storage/hook"
import Iridescence from './Iridescence'

interface WalletConnectionButtonProps {
  disabled?: boolean;
}

const WalletConnectionButton = ({ disabled = false }: WalletConnectionButtonProps) => {
  const [account, setAccount] = useStorage<string>("metamask-account")
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
        <button
          className="disconnect-button-3d noselect"
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
      )}
    </div>
  )
}

export default WalletConnectionButton