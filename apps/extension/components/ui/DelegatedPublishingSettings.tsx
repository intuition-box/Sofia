import { formatEther } from "viem"

import { useDelegatedPublishing } from "~/hooks"

const formatTrust = (wei: bigint | null) =>
  wei === null ? "—" : `${Number(formatEther(wei)).toFixed(3)} TRUST`

const formatDate = (seconds: number | null) =>
  seconds === null ? "—" : new Date(seconds * 1000).toLocaleDateString()

/** Settings section: publish without wallet popups (delegated session key) */
const DelegatedPublishingSettings = () => {
  const {
    status,
    loading,
    error,
    activate,
    topUp,
    fundBudget,
    withdrawBudget,
    deactivate
  } = useDelegatedPublishing()

  if (!status) return null

  const isActive = status.state === "active"
  // Hybrid (wallets without 7702): a Sofia account holds the budget. It stays
  // withdrawable after disabling.
  const hasBudgetAccount = !!status.smartAccount
  const showBudget =
    hasBudgetAccount && (status.kind === "hybrid" || (status.budget ?? 0n) > 0n)

  return (
    <div className="settings-section">
      <div className="settings-item">
        <div className="settings-item-content">
          <span>Publish without popup</span>
          <span className="settings-item-description">
            {isActive
              ? `Active until ${formatDate(status.expiresAt)} · up to ${formatTrust(status.dailyCap)}/day`
              : status.state === "expired"
                ? "Your permission expired — re-enable it to skip wallet popups."
                : "Sign once, then publish without wallet popups. Positions always land in your wallet; Sofia can only deposit into them, within your limits."}
          </span>
        </div>
        {!isActive && (
          <button
            className="wallet-connect-button"
            onClick={activate}
            disabled={loading}>
            {status.state === "expired" ? "Re-enable" : "Enable"}
          </button>
        )}
      </div>

      {isActive && (
        <>
          <div className="settings-item">
            <div className="settings-item-content">
              <span>Publishing gas</span>
              <span className="settings-item-description">
                {status.gasLow
                  ? "Low — top it up to keep publishing without popups."
                  : "Pays the network fee of each publication."}
              </span>
            </div>
            <div className="wallet-address-display">
              {formatTrust(status.gasBalance)}
            </div>
          </div>

          <div className="settings-item">
            <button className="wallet-connect-button" onClick={topUp}>
              Top up gas
            </button>
            <button
              className="delete-button-3d destructive"
              onClick={deactivate}>
              Disable
            </button>
          </div>
        </>
      )}

      {showBudget && (
        <>
          <div className="settings-item">
            <div className="settings-item-content">
              <span>Publishing budget</span>
              <span className="settings-item-description">
                TRUST in your own Sofia account (your wallet doesn't support
                smart accounts). Withdraw it any time.
              </span>
            </div>
            <div className="wallet-address-display">
              {formatTrust(status.budget)}
            </div>
          </div>
          <div className="settings-item">
            {isActive && (
              <button className="wallet-connect-button" onClick={fundBudget}>
                Top up budget
              </button>
            )}
            <button
              className="delete-button-3d"
              onClick={withdrawBudget}
              disabled={!status.budget}>
              Withdraw
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="settings-item">
          <span className="settings-item-description">{error}</span>
        </div>
      )}
    </div>
  )
}

export default DelegatedPublishingSettings
