import { useCallback, useMemo, useRef, useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import {
  getSmartAccountsEnvironment,
  type Delegation,
} from '@metamask/smart-accounts-kit'
import { getAddress, isAddress, parseEther, type Address } from 'viem'
import { useWalletConnection } from '../lib/services/WalletProvider'
import { DEFAULT_EXTENSION_ID, sendToExtensionAsync } from '../auth/oauthConfig'
import {
  DEFAULT_DAILY_CAP,
  DEFAULT_MAX_PER_ACTION,
  DURATION_DAYS,
  NETWORKS,
  clientsFor,
  disableDelegationOnChain,
  ensureChain,
  isUpgraded,
  probeDelegation,
  signPublishingDelegation,
  supportsSmartAccount,
  topUpSessionGas,
  upgradeApproveAndFund,
  type NetworkName,
} from './delegation'
import styles from '../auth/auth.module.css'

type Action = 'activate' | 'topup' | 'revoke'
type Phase = 'idle' | 'working' | 'done' | 'incompatible' | 'error'

function readParams() {
  const q = new URLSearchParams(window.location.search)
  const wallet = q.get('wallet') ?? ''
  const sessionKey = q.get('sessionKey') ?? ''
  const network = (q.get('network') ?? 'mainnet') as NetworkName
  return {
    action: (q.get('action') ?? 'activate') as Action,
    extensionId: q.get('extensionId') || DEFAULT_EXTENSION_ID,
    wallet: isAddress(wallet) ? getAddress(wallet) : null,
    sessionKey: isAddress(sessionKey) ? getAddress(sessionKey) : null,
    net: NETWORKS[network] ?? null,
  }
}

const TITLES: Record<Action, string> = {
  activate: 'Publish without popup',
  topup: 'Top up publishing gas',
  revoke: 'Disable publishing permission',
}

export function ActivatePage() {
  const params = useMemo(readParams, [])
  const { address, isConnected, isConnecting, connect, disconnect } =
    useWalletConnection()
  const { wallets } = useWallets()
  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dailyCap, setDailyCap] = useState(DEFAULT_DAILY_CAP)
  const [maxPerAction, setMaxPerAction] = useState(DEFAULT_MAX_PER_ACTION)
  // Same guard as AuthPage: Privy mutating `wallets` mid-flow must never
  // re-trigger a wallet popup.
  const busy = useRef(false)

  const expected = params.wallet
  const wrongWallet =
    isConnected &&
    address &&
    expected &&
    address.toLowerCase() !== expected.toLowerCase()

  const getClients = useCallback(async () => {
    const wallet = wallets.find(
      (w) => w.address?.toLowerCase() === expected?.toLowerCase(),
    )
    if (!wallet || !params.net || !expected) {
      throw new Error('Wallet not found — reconnect and try again.')
    }
    const provider = await wallet.getEthereumProvider()
    await ensureChain(provider, params.net)
    return clientsFor(params.net, provider, expected)
  }, [wallets, expected, params.net])

  const run = useCallback(async (flow: () => Promise<Phase>) => {
    if (busy.current) return
    busy.current = true
    setError(null)
    setPhase('working')
    try {
      setPhase(await flow())
    } catch (err) {
      setError(err instanceof Error ? err.message.split('\n')[0] : String(err))
      setPhase('error')
    } finally {
      busy.current = false
    }
  }, [])

  const activate = () =>
    run(async () => {
      const net = params.net!
      const wallet = expected as Address
      const sessionKey = params.sessionKey as Address
      const limits = {
        dailyCap: parseEther(dailyCap),
        maxPerAction: parseEther(maxPerAction),
      }
      if (limits.maxPerAction > limits.dailyCap) {
        throw new Error('The per-action limit cannot exceed the daily limit.')
      }

      setStep('Checking your wallet…')
      const clients = await getClients()
      const upgraded = await isUpgraded(clients, wallet, net.chain.id)
      if (!upgraded && !(await supportsSmartAccount(clients, net))) {
        return 'incompatible'
      }

      setStep(
        'Confirm in your wallet: smart account + approval + publishing gas',
      )
      await upgradeApproveAndFund(clients, net, sessionKey)
      if (!(await isUpgraded(clients, wallet, net.chain.id))) {
        throw new Error(
          'Your account was not upgraded to a smart account. Accept the upgrade in MetaMask and retry.',
        )
      }

      setStep('Sign the publishing permission in your wallet')
      const { delegation, expiresAt } = await signPublishingDelegation(
        clients,
        net,
        wallet,
        sessionKey,
        limits,
      )

      setStep('Verifying the permission…')
      await probeDelegation(clients, net, wallet, sessionKey, delegation)

      setStep('Sending the permission to Sofia…')
      const res = await sendToExtensionAsync(
        {
          type: 'DELEGATION_GRANTED',
          data: {
            wallet,
            delegation,
            expiresAt,
            dailyCap: limits.dailyCap.toString(),
            maxPerAction: limits.maxPerAction.toString(),
            delegationManager: getSmartAccountsEnvironment(net.chain.id)
              .DelegationManager,
            chainId: net.chain.id,
          },
        },
        params.extensionId,
      )
      if (!res.success)
        throw new Error(res.error ?? 'The extension refused the permission.')
      return 'done'
    })

  const topUp = () =>
    run(async () => {
      setStep('Confirm the transfer in your wallet')
      await topUpSessionGas(await getClients(), params.sessionKey as Address)
      return 'done'
    })

  const revoke = () =>
    run(async () => {
      setStep('Fetching the permission from Sofia…')
      const res = await sendToExtensionAsync<{
        success: boolean
        delegation: Delegation | null
      }>(
        { type: 'GET_DELEGATION', data: { wallet: expected } },
        params.extensionId,
      )
      if (res.delegation) {
        setStep('Confirm in your wallet to disable the permission on-chain')
        await disableDelegationOnChain(
          await getClients(),
          params.net!,
          res.delegation,
        )
        await sendToExtensionAsync(
          { type: 'DELEGATION_REVOKED', data: { wallet: expected } },
          params.extensionId,
        )
      }
      return 'done'
    })

  const invalidLink =
    !params.net ||
    !expected ||
    (params.action !== 'revoke' && !params.sessionKey)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/logoWhite.svg" alt="Sofia" className={styles.logo} />
        <p className={styles.subtitle}>{TITLES[params.action]}</p>

        {invalidLink ? (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Invalid link</p>
            <p className={styles.subtext}>
              Open this page from the Sofia extension settings.
            </p>
          </>
        ) : !isConnected ? (
          <>
            <p className={styles.text}>Connect your wallet</p>
            <p className={styles.subtext}>
              Use the wallet connected to the extension: {expected.slice(0, 6)}…
              {expected.slice(-4)}
            </p>
            <button
              className={styles.btn}
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          </>
        ) : wrongWallet ? (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Wrong wallet</p>
            <p className={styles.subtext}>
              The extension is connected with {expected.slice(0, 6)}…
              {expected.slice(-4)}. Switch to that wallet.
            </p>
            <button className={styles.disconnectBtn} onClick={disconnect}>
              Disconnect
            </button>
          </>
        ) : phase === 'working' ? (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>{step}</p>
          </>
        ) : phase === 'done' ? (
          <>
            <p className={styles.successHeading}>
              <span className={styles.checkmark}>✓</span>{' '}
              {params.action === 'activate'
                ? 'Publishing without popup is on'
                : params.action === 'topup'
                  ? 'Gas topped up'
                  : 'Permission disabled'}
            </p>
            <p className={styles.subtext}>
              You can close this tab and go back to Sofia.
            </p>
          </>
        ) : phase === 'incompatible' ? (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Wallet not compatible yet</p>
            <p className={styles.subtext}>
              Publishing without popup needs MetaMask (smart account). Sofia
              keeps working with the usual wallet confirmations.
            </p>
          </>
        ) : params.action === 'activate' ? (
          <>
            <p className={styles.subtext}>
              One confirmation + one signature, then Sofia publishes for you
              without wallet popups. Your TRUST and positions stay in your
              wallet; Sofia can only deposit into your own positions, within
              these limits, for {DURATION_DAYS} days.
            </p>
            <div className={styles.instructions}>
              <label className={styles.instructionsText}>
                Max per day (TRUST){' '}
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={dailyCap}
                  onChange={(e) => setDailyCap(e.target.value)}
                />
              </label>
              <label className={styles.instructionsText}>
                Max per action (TRUST){' '}
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={maxPerAction}
                  onChange={(e) => setMaxPerAction(e.target.value)}
                />
              </label>
            </div>
            {error && <p className={styles.subtext}>{error}</p>}
            <button className={styles.claimBtn} onClick={activate}>
              Enable
            </button>
          </>
        ) : (
          <>
            {error && <p className={styles.subtext}>{error}</p>}
            <button
              className={
                params.action === 'revoke'
                  ? styles.disconnectBtn
                  : styles.claimBtn
              }
              onClick={params.action === 'revoke' ? revoke : topUp}
            >
              {params.action === 'revoke'
                ? 'Disable on-chain'
                : 'Send 0.05 TRUST'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
