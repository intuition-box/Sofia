import { useWalletFromStorage, openAuthTab, disconnectWallet } from '../../hooks/useWalletFromStorage'
// Removed Iridescence import - using CSS salmon gradient now

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
          {isLoading ? (
            <>
              <div className="button-spinner"></div>
              Connecting...
            </>
          ) : (
            <>CONNECT WALLET</>
          )}
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
