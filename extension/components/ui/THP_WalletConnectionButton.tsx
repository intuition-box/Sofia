import { useWalletFromStorage, openAuthTab, disconnectWallet } from '../../hooks/useWalletFromStorage'
import Iridescence from './Iridescence'

interface WalletConnectionButtonProps {
  disabled?: boolean;
}

const WalletConnectionButton = ({ disabled = false }: WalletConnectionButtonProps) => {
  const { authenticated, ready } = useWalletFromStorage()
  const isLoading = !ready

  const handleConnect = () => {
    if (disabled || isLoading) return
    // Ouvre le tab d'authentification Privy
    openAuthTab()
  }

  const handleDisconnect = async () => {
    await disconnectWallet()
  }

  return (
    <div>
      {!authenticated ? (
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
