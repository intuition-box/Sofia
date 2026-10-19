import { formatEther } from "viem"

import { useDelegatedPublishing } from "~/hooks"

const formatTrust = (wei: bigint | null) =>
  wei === null ? "—" : `${Number(formatEther(wei)).toFixed(3)} TRUST`

const formatLimit = (wei: bigint | null) =>
  wei === null ? "—" : `${Number(formatEther(wei))} TRUST`

const formatDate = (seconds: number | null) =>
  seconds === null ? "—" : new Date(seconds * 1000).toLocaleDateString()

const shortAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`

/** One read-only line of the current setup */
const SetupRow = ({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint?: string
}) => (
  <div className="settings-item">
    <div className="settings-item-content">
      <span>{label}</span>
      {hint && <span className="settings-item-description">{hint}</span>}
    </div>
    <div className="wallet-address-display">{value}</div>
  </div>
)

/**
 * Settings section: publish without wallet popups. Shows how it is set up
 * (mode, limits, validity, gas, budget) and lets the user edit it any time.
 */
const DelegatedPublishingSettings = () => {
  const {
    status,
    loading,
    error,
    activate,
    editLimits,
    topUp,
    fundBudget,
    withdrawBudget,
    deactivate
  } = useDelegatedPublishing()

  if (!status) return null

  const isActive = status.state === "active"
  const isConfigured = status.state !== "inactive"
  const isHybrid = status.kind === "hybrid"
  // The hybrid budget stays withdrawable even after disabling
  const showBudget =
    !!status.smartAccount && (isHybrid || (status.budget ?? 0n) > 0n)

  return (
    <div className="settings-section">
      <div className="settings-item">
        <div className="settings-item-content">
          <span>Publish without popup</span>
          <span className="settings-item-description">
            {isActive
              ? "On — Sofia publishes for you, within the limits below."
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

      {isConfigured && (
        <>
          <SetupRow
            label="Mode"
            value={
              isHybrid && status.smartAccount
                ? shortAddress(status.smartAccount)
                : "Your wallet"
            }
            hint={
              isHybrid
                ? "Your own Sofia account holds the publishing budget."
                : status.kind === "7715"
                  ? "MetaMask permission — TRUST leaves your wallet only when you publish."
                  : "Your wallet is a MetaMask smart account; TRUST stays in it."
            }
          />
          <SetupRow label="Max per day" value={formatLimit(status.dailyCap)} />
          <SetupRow
            label="Max per action"
            value={formatLimit(status.maxPerAction)}
          />
          <SetupRow
            label={isActive ? "Valid until" : "Expired on"}
            value={formatDate(status.expiresAt)}
          />
        </>
      )}

      {isActive && (
        <SetupRow
          label="Publishing gas"
          value={formatTrust(status.gasBalance)}
          hint={
            status.gasLow
              ? "Low — top it up to keep publishing without popups."
              : "Pays the network fee of each publication."
          }
        />
      )}

      {showBudget && (
        <SetupRow
          label="Publishing budget"
          value={formatTrust(status.budget)}
          hint="Withdraw it to your wallet any time."
        />
      )}

      {isActive && (
        <div className="settings-item">
          <button className="wallet-connect-button" onClick={editLimits}>
            Edit limits
          </button>
          <button className="wallet-connect-button" onClick={topUp}>
            Top up gas
          </button>
        </div>
      )}

      {(showBudget || isActive) && (
        <div className="settings-item">
          {isActive && isHybrid && (
            <button className="wallet-connect-button" onClick={fundBudget}>
              Top up budget
            </button>
          )}
          {showBudget && (
            <button
              className="delete-button-3d"
              onClick={withdrawBudget}
              disabled={!status.budget}>
              Withdraw
            </button>
          )}
          {isActive && (
            <button
              className="delete-button-3d destructive"
              onClick={deactivate}>
              Disable
            </button>
          )}
        </div>
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
