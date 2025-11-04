import { disconnectWallet } from "../../lib/services/metamask"
import { sessionStorage, METAMASK_ACCOUNT_KEY } from "../../lib/storage/sessionStorage"

const DisconnectButton = () => {
  const handleDisconnect = async () => {
    try {
      console.log("🔌 Starting disconnect process...")

      // Supprimer le compte du session storage
      await sessionStorage.remove(METAMASK_ACCOUNT_KEY)
      console.log("✅ Account removed from session storage")

      // Révoquer les permissions MetaMask
      await disconnectWallet()
      console.log("✅ Wallet disconnected successfully")
    } catch (error) {
      console.error("❌ Error disconnecting wallet:", error)
    }
  }

  return (
    <button
      className="disconnect-button-3d noselect"
      onClick={handleDisconnect}
    >
      Disconnect
    </button>
  )
}

export default DisconnectButton
