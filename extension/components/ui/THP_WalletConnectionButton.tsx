import { usePrivy } from '@privy-io/react-auth'
import Iridescence from './Iridescence'

interface WalletConnectionButtonProps {
  disabled?: boolean;
}

const WalletConnectionButton = ({ disabled = false }: WalletConnectionButtonProps) => {
  const { login, logout, authenticated, ready } = usePrivy()
  const isLoading = !ready

  const handleConnect = async () => {
    if (disabled || isLoading) return
    login()
  }

  const handleDisconnect = async () => {
    await logout()
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
