import { useEffect, useState, useCallback, useRef } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { useWalletConnection } from '../../lib/web3/PrivyContext'
import { sendToExtension, DEFAULT_EXTENSION_ID } from './oauthConfig'
import styles from './auth.module.css'

function getExtensionId() {
  return (
    new URLSearchParams(window.location.search).get('extensionId') ||
    DEFAULT_EXTENSION_ID
  )
}

/**
 * Build an EIP-4361 (Sign-In With Ethereum) message. The extension verifies
 * the signature so it knows the wallet address actually belongs to the user
 * connecting, not a string the page chose to claim.
 */
function buildSiweMessage(address: string): string {
  const domain = window.location.host
  const uri = window.location.origin
  // 16-char hex nonce, fresh per connect
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const issuedAt = new Date().toISOString()
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Connect your wallet to the Sofia extension.',
    '',
    `URI: ${uri}`,
    'Version: 1',
    'Chain ID: 1155',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')
}

export function AuthPage() {
  const {
    address,
    walletType,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError,
  } = useWalletConnection()
  // Use the wallet's own provider (personal_sign) rather than Privy's
  // useSignMessage hook: the latter throws "No embedded or connected wallet
  // found for address" when signing for an external wallet (MetaMask et al.)
  // because it expects a Privy-managed embedded wallet by default.
  const { wallets } = useWallets()
  const [hasSent, setHasSent] = useState(false)
  const [siweError, setSiweError] = useState<string | null>(null)
  // hasSentRef persists across renders and useEffect cleanups, unlike the
  // hasSent state which is gated by React batching. Without it, when Privy
  // mutates `wallets` mid-signing (changing the effect deps), the cleanup
  // sets cancelled=true and the setHasSent update is skipped — the next
  // render then re-enters the effect and pops another MetaMask request.
  const hasSentRef = useRef(false)
  const signaturePending = useRef(false)
  const [claimStatus, setClaimStatus] = useState<'idle' | 'sending' | 'sent'>(
    'idle',
  )
  const autoLoginTriggered = useRef(false)
  const extensionId = getExtensionId()

  const retrySiwe = useCallback(() => {
    setSiweError(null)
    signaturePending.current = false
    hasSentRef.current = false
    setHasSent(false)
  }, [])

  useEffect(() => {
    // Skip if already sent, no wallet, an attempt is in flight, or the user
    // already rejected (avoid spamming the wallet popup on re-renders).
    if (
      !isConnected ||
      !address ||
      hasSentRef.current ||
      signaturePending.current ||
      siweError
    ) {
      return
    }
    signaturePending.current = true
    ;(async () => {
      try {
        const siweMessage = buildSiweMessage(address)

        // Find the wallet matching the connected address. Privy may have
        // multiple wallets (e.g. an embedded one + the user's external one);
        // we want the one whose address equals what we're authenticating.
        const wallet = wallets.find(
          (w) => w.address?.toLowerCase() === address.toLowerCase(),
        )
        if (!wallet) {
          throw new Error(
            `No connected wallet found for ${address.slice(0, 8)}…. Please reconnect.`,
          )
        }

        const provider = await wallet.getEthereumProvider()
        // EIP-191 personal_sign — what SIWE expects on the verifier side
        // (recoverPersonalSignAddress in the extension matches this scheme).
        const signature = (await provider.request({
          method: 'personal_sign',
          params: [siweMessage, address],
        })) as string

        // Claim the slot synchronously *before* any state mutation so the
        // next render of this effect (likely fired by Privy mutating wallets
        // during the await above) sees hasSentRef.current === true and bails.
        hasSentRef.current = true

        sendToExtension(
          {
            type: 'WALLET_CONNECTED',
            walletAddress: address,
            walletType: walletType || 'unknown',
            siweMessage,
            siweSignature: signature,
          },
          extensionId,
        )

        try {
          localStorage.setItem('sofia_wallet_address', address)
          localStorage.setItem('sofia_wallet_type', walletType || 'unknown')
          localStorage.setItem('sofia_wallet_timestamp', Date.now().toString())
        } catch {
          /* not available */
        }

        setHasSent(true)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Signature rejected'
        setSiweError(msg)
      } finally {
        signaturePending.current = false
      }
    })()
  }, [isConnected, address, walletType, extensionId, siweError, wallets])

  useEffect(() => {
    if (autoLoginTriggered.current) return
    const autoLogin = new URLSearchParams(window.location.search).get(
      'autoLogin',
    )
    if (autoLogin === 'true' && !isConnected && !isConnecting) {
      autoLoginTriggered.current = true
      connect()
    }
  }, [isConnected, isConnecting, connect])

  const handleFirstClaim = useCallback(async () => {
    setClaimStatus('sending')
    sendToExtension(
      {
        type: 'FIRST_CLAIM',
        data: { url: 'https://sofia.intuition.box' },
      },
      extensionId,
    )
    setClaimStatus('sent')
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
  }, [extensionId])

  const handleDisconnect = useCallback(async () => {
    await disconnect()
    setHasSent(false)
    try {
      localStorage.removeItem('sofia_wallet_address')
      localStorage.removeItem('sofia_wallet_type')
      localStorage.removeItem('sofia_wallet_timestamp')
    } catch {
      /* */
    }
  }, [disconnect])

  const status = error
    ? 'error'
    : isConnected && address
      ? 'success'
      : isConnecting
        ? 'loading'
        : 'connect'

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img
          src="/img/sofiaLogo.png"
          alt="Sofia"
          className={`${styles.logo} logo-invert`}
        />
        <p className={styles.subtitle}>Secure Wallet Connection</p>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Connecting...</p>
          </>
        )}

        {status === 'connect' && (
          <>
            <p className={styles.text}>Connect your wallet</p>
            <p className={styles.subtext}>
              Connect with MetaMask or another Web3 wallet
            </p>
            <button className={styles.btn} onClick={connect}>
              Connect Wallet
            </button>
          </>
        )}

        {status === 'success' && address && siweError && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Signature Required</p>
            <p className={styles.subtext}>
              The extension needs a signed message to verify ownership of your
              wallet. {siweError}
            </p>
            <button className={styles.btn} onClick={retrySiwe}>
              Retry signature
            </button>
            <button className={styles.disconnectBtn} onClick={handleDisconnect}>
              Disconnect
            </button>
          </>
        )}

        {status === 'success' && address && !siweError && !hasSent && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Waiting for signature...</p>
            <p className={styles.subtext}>
              Sign the message in your wallet to complete the connection.
            </p>
          </>
        )}

        {status === 'success' && address && hasSent && (
          <>
            <div className={styles.checkmark}>✓</div>
            <p className={styles.text}>Wallet Connected!</p>
            <div className={styles.walletAddress}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>

            {claimStatus === 'idle' && (
              <>
                <div className={styles.instructions}>
                  <p className={styles.instructionsText}>
                    Your wallet is connected. Create your first claim to get
                    started with Sofia.
                  </p>
                </div>
                <button className={styles.claimBtn} onClick={handleFirstClaim}>
                  Create your first claim
                </button>
              </>
            )}

            {claimStatus === 'sending' && <div className={styles.spinner} />}

            {claimStatus === 'sent' && (
              <div className={styles.instructions}>
                <p className={styles.instructionsText}>
                  Your first claim has been sent to the extension. You can close
                  this tab.
                </p>
              </div>
            )}

            <button className={styles.disconnectBtn} onClick={handleDisconnect}>
              Disconnect
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Connection Failed</p>
            <p className={styles.subtext}>{error}</p>
            <button className={styles.btn} onClick={clearError}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
