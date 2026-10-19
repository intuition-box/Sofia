import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  eoaSmartAccount,
  ensureChain,
  fundBudget,
  fundHybrid,
  hybridSmartAccount,
  isUpgraded,
  probeDelegation,
  signPublishingDelegation,
  supportsSmartAccount,
  topUpSessionGas,
  upgradeApproveAndFund,
  withdrawBudget,
  type ActivationKind,
  type NetworkName,
} from './delegation'
import styles from '../auth/auth.module.css'

type Action = 'activate' | 'topup' | 'fund' | 'withdraw' | 'revoke'
type Phase = 'idle' | 'working' | 'done' | 'error'

const DEFAULT_BUDGET = '10'

function readParams() {
  const q = new URLSearchParams(window.location.search)
  const wallet = q.get('wallet') ?? ''
  const sessionKey = q.get('sessionKey') ?? ''
  const account = q.get('account') ?? ''
  const network = (q.get('network') ?? 'mainnet') as NetworkName
  return {
    action: (q.get('action') ?? 'activate') as Action,
    extensionId: q.get('extensionId') || DEFAULT_EXTENSION_ID,
    wallet: isAddress(wallet) ? getAddress(wallet) : null,
    sessionKey: isAddress(sessionKey) ? getAddress(sessionKey) : null,
    /** Hybrid smart account (fund / withdraw) */
    account: isAddress(account) ? getAddress(account) : null,
    net: NETWORKS[network] ?? null,
  }
}

const TITLES: Record<Action, string> = {
  activate: 'Publish without popup',
  topup: 'Top up publishing gas',
  fund: 'Top up publishing budget',
  withdraw: 'Withdraw publishing budget',
  revoke: 'Disable publishing permission',
}

const DONE: Record<Action, string> = {
  activate: 'Publishing without popup is on',
  topup: 'Gas topped up',
  fund: 'Budget topped up',
  withdraw: 'Budget sent back to your wallet',
  revoke: 'Permission disabled',
}

export function ActivatePage() {
  const params = useMemo(readParams, [])
  const { address, isConnected, isConnecting, connect, disconnect } =
    useWalletConnection()
  const { wallets } = useWallets()
  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<ActivationKind | null>(null)
  const [dailyCap, setDailyCap] = useState(DEFAULT_DAILY_CAP)
  const [maxPerAction, setMaxPerAction] = useState(DEFAULT_MAX_PER_ACTION)
  const [budget, setBudget] = useState(DEFAULT_BUDGET)
  // Same guard as AuthPage: Privy mutating `wallets` mid-flow must never
  // re-trigger a wallet popup.
  const busy = useRef(false)

  const expected = params.wallet
  const wrongWallet =
    isConnected &&
    address &&
    expected &&
    address.toLowerCase() !== expected.toLowerCase()

  const getClients = useCallback(
    async (switchChain = true) => {
      const wallet = wallets.find(
        (w) => w.address?.toLowerCase() === expected?.toLowerCase(),
      )
      if (!wallet || !params.net || !expected) {
        throw new Error('Wallet not found — reconnect and try again.')
      }
      const provider = await wallet.getEthereumProvider()
      if (switchChain) await ensureChain(provider, params.net)
      return clientsFor(params.net, provider, expected)
    },
    [wallets, expected, params.net],
  )

  // Pick the path once the right wallet is connected: 7702 when the wallet
  // can upgrade (MetaMask), otherwise a Sofia smart account with a budget.
  useEffect(() => {
    if (params.action !== 'activate' || !isConnected || wrongWallet) return
    if (!expected || !params.net || kind) return
    let cancelled = false
    ;(async () => {
      try {
        const clients = await getClients(false)
        const can7702 =
          (await isUpgraded(clients, expected, params.net!.chain.id)) ||
          (await supportsSmartAccount(clients, params.net!))
        if (!cancelled) setKind(can7702 ? '7702' : 'hybrid')
      } catch {
        if (!cancelled) setKind('hybrid')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    params.action,
    params.net,
    isConnected,
    wrongWallet,
    expected,
    kind,
    getClients,
  ])

  const run = useCallback(async (flow: () => Promise<void>) => {
    if (busy.current) return
    busy.current = true
    setError(null)
    setPhase('working')
    try {
      await flow()
      setPhase('done')
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

      let grant: Record<string, unknown>
      if (kind === 'hybrid') {
        const { account, factory, factoryData } = await hybridSmartAccount(
          clients,
          wallet,
        )
        await fundHybrid(
          clients,
          net,
          account.address,
          sessionKey,
          parseEther(budget),
          setStep,
        )
        setStep('Sign the publishing permission in your wallet')
        const { delegation, expiresAt } = await signPublishingDelegation(
          clients,
          net,
          account,
          wallet,
          sessionKey,
          limits,
        )
        setStep('Verifying the permission…')
        await probeDelegation(
          clients,
          net,
          account.address,
          wallet,
          sessionKey,
          delegation,
          { factory, factoryData },
        )
        grant = {
          kind: 'hybrid',
          delegator: account.address,
          deploy: { factory, factoryData },
          delegation,
          expiresAt,
        }
      } else {
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
        const account = await eoaSmartAccount(clients, wallet)
        const { delegation, expiresAt } = await signPublishingDelegation(
          clients,
          net,
          account,
          wallet,
          sessionKey,
          limits,
        )
        setStep('Verifying the permission…')
        await probeDelegation(
          clients,
          net,
          wallet,
          wallet,
          sessionKey,
          delegation,
        )
        grant = { kind: '7702', delegator: wallet, delegation, expiresAt }
      }

      setStep('Sending the permission to Sofia…')
      const res = await sendToExtensionAsync(
        {
          type: 'DELEGATION_GRANTED',
          data: {
            ...grant,
            wallet,
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
    })

  const topUp = () =>
    run(async () => {
      setStep('Confirm the transfer in your wallet')
      await topUpSessionGas(await getClients(), params.sessionKey as Address)
    })

  const fund = () =>
    run(async () => {
      setStep('Confirm the transfer in your wallet')
      await fundBudget(
        await getClients(),
        params.account as Address,
        parseEther(budget),
      )
    })

  const withdraw = () =>
    run(async () => {
      setStep('Sign, then confirm the withdrawal in your wallet')
      await withdrawBudget(
        await getClients(),
        params.net!,
        expected as Address,
        params.account as Address,
      )
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
          expected as Address,
          res.delegation,
        )
        await sendToExtensionAsync(
          { type: 'DELEGATION_REVOKED', data: { wallet: expected } },
          params.extensionId,
        )
      }
    })

  const needsSessionKey = ['activate', 'topup'].includes(params.action)
  const needsAccount = ['fund', 'withdraw'].includes(params.action)
  const invalidLink =
    !params.net ||
    !expected ||
    (needsSessionKey && !params.sessionKey) ||
    (needsAccount && !params.account)

  const budgetInput = (
    <label className={styles.instructionsText}>
      Budget (TRUST){' '}
      <input
        type="number"
        min="0.5"
        step="0.5"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
      />
    </label>
  )

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
              <span className={styles.checkmark}>✓</span> {DONE[params.action]}
            </p>
            <p className={styles.subtext}>
              You can close this tab and go back to Sofia.
            </p>
          </>
        ) : params.action === 'activate' ? (
          !kind ? (
            <>
              <div className={styles.spinner} />
              <p className={styles.text}>Checking your wallet…</p>
            </>
          ) : (
            <>
              <p className={styles.subtext}>
                {kind === '7702'
                  ? 'One confirmation + one signature, then Sofia publishes for you without wallet popups. Your TRUST stays in your wallet.'
                  : 'Your wallet sends a publishing budget to your own Sofia account (3 confirmations), then one signature. Sofia publishes from that budget without popups; you can withdraw it any time.'}{' '}
                Positions always land in your wallet, and Sofia can only deposit
                into them, within these limits, for {DURATION_DAYS} days.
              </p>
              <div className={styles.instructions}>
                {kind === 'hybrid' && budgetInput}
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
          )
        ) : (
          <>
            {params.action === 'fund' && (
              <div className={styles.instructions}>{budgetInput}</div>
            )}
            {error && <p className={styles.subtext}>{error}</p>}
            {params.action === 'revoke' ? (
              <button className={styles.disconnectBtn} onClick={revoke}>
                Disable on-chain
              </button>
            ) : params.action === 'withdraw' ? (
              <button className={styles.disconnectBtn} onClick={withdraw}>
                Withdraw all
              </button>
            ) : params.action === 'fund' ? (
              <button className={styles.claimBtn} onClick={fund}>
                Send {budget} TRUST
              </button>
            ) : (
              <button className={styles.claimBtn} onClick={topUp}>
                Send 0.05 TRUST
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
