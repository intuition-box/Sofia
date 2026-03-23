/**
 * GlobalStakeModal
 * Dual-mode modal for the Beta Season Pool:
 * - "deposit" mode: choose amount and stake into the pool
 * - "redeem" mode: preview assets received and withdraw from the pool
 *
 * Uses the same visual language as WeightModal (pills, cost breakdown, processing states).
 */

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useBalance } from "wagmi"
import { formatUnits, parseEther, getAddress } from "viem"
import {
  useWalletFromStorage,
  useGlobalStake,
  useDepositGlobalStake,
  useRedeemGlobalStake
} from "~/hooks"
import { EXPLORER_URLS } from "~/lib/config/chainConfig"
import { createHookLogger } from "~/lib/utils"
import SofiaLoader from "../ui/SofiaLoader"
import "../styles/Modal.css"
import "../styles/GlobalStakeModal.css"

const goldRewardVideoUrl = chrome.runtime.getURL("assets/bggoldreward.mp4")

const logger = createHookLogger("GlobalStakeModal")

type Mode = "deposit" | "redeem"

interface GlobalStakeModalProps {
  isOpen: boolean
  mode: Mode
  onClose: () => void
}

type AmountOption = {
  id: string
  label: string
  value: number
}

const depositOptions: AmountOption[] = [
  { id: "small", label: "0.1", value: 0.1 },
  { id: "default", label: "0.5", value: 0.5 },
  { id: "medium", label: "1", value: 1 },
  { id: "high", label: "5", value: 5 },
  { id: "max", label: "10", value: 10 }
]

const redeemOptions: AmountOption[] = [
  { id: "25", label: "25%", value: 25 },
  { id: "50", label: "50%", value: 50 },
  { id: "75", label: "75%", value: 75 },
  { id: "100", label: "100%", value: 100 }
]

const GlobalStakeModal = ({
  isOpen,
  mode,
  onClose
}: GlobalStakeModalProps) => {
  const { walletAddress } = useWalletFromStorage()
  const { position: gsPosition, vaultStats } = useGlobalStake()
  const {
    deposit,
    previewDeposit,
    loading: depositLoading
  } = useDepositGlobalStake()
  const {
    redeem,
    getUserShares,
    previewRedeem,
    loading: redeemLoading
  } = useRedeemGlobalStake()

  const checksumAddress = walletAddress
    ? getAddress(walletAddress)
    : undefined
  const { data: balanceData } = useBalance({ address: checksumAddress })
  const userBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0

  // State
  const [selectedPill, setSelectedPill] = useState<string>("default")
  const [customValue, setCustomValue] = useState("")
  const [redeemPercent, setRedeemPercent] = useState<string>("100")
  const [previewShares, setPreviewShares] = useState<bigint>(0n)
  const [previewAssets, setPreviewAssets] = useState<bigint>(0n)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [txSuccess, setTxSuccess] = useState(false)

  const isProcessing = depositLoading || redeemLoading

  // Reset state when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPill(mode === "deposit" ? "default" : "100")
      setCustomValue("")
      setRedeemPercent("100")
      setPreviewShares(0n)
      setPreviewAssets(0n)
      setTxHash(null)
      setTxError(null)
      setTxSuccess(false)
    }
  }, [isOpen, mode])

  // Compute deposit amount from selection
  const getDepositAmount = useCallback((): number => {
    if (selectedPill === "custom") {
      return parseFloat(customValue) || 0
    }
    const opt = depositOptions.find((o) => o.id === selectedPill)
    return opt?.value ?? 0.5
  }, [selectedPill, customValue])

  // Preview deposit shares
  useEffect(() => {
    if (!isOpen || mode !== "deposit") return
    const amount = getDepositAmount()
    if (amount <= 0) {
      setPreviewShares(0n)
      return
    }

    let cancelled = false
    const amountWei = parseEther(amount.toString())
    previewDeposit(amountWei).then((shares) => {
      if (!cancelled) setPreviewShares(shares)
    }).catch(() => {})

    return () => { cancelled = true }
  }, [isOpen, mode, getDepositAmount, previewDeposit])

  // Preview redeem assets
  useEffect(() => {
    if (!isOpen || mode !== "redeem" || !gsPosition) return

    let cancelled = false
    const pct = parseInt(redeemPercent) || 100
    const sharesToRedeem = (gsPosition.shares * BigInt(pct)) / 100n

    previewRedeem(sharesToRedeem).then((assets) => {
      if (!cancelled) setPreviewAssets(assets)
    }).catch(() => {})

    return () => { cancelled = true }
  }, [isOpen, mode, redeemPercent, gsPosition, previewRedeem])

  const handleDeposit = async () => {
    const amount = getDepositAmount()
    if (amount <= 0) return

    const amountWei = parseEther(amount.toString())
    const result = await deposit(amountWei)

    if (result.success) {
      setTxHash(result.txHash || null)
      setTxSuccess(true)
      setTxError(null)
    } else {
      setTxError(result.error || "Transaction failed")
    }
  }

  const handleRedeem = async () => {
    if (!gsPosition || gsPosition.shares === 0n) return

    const pct = parseInt(redeemPercent) || 100
    const sharesToRedeem = pct >= 100
      ? undefined // redeem all
      : (gsPosition.shares * BigInt(pct)) / 100n

    const result = await redeem(sharesToRedeem)

    if (result.success) {
      setTxHash(result.txHash || null)
      setTxSuccess(true)
      setTxError(null)
    } else {
      setTxError(result.error || "Transaction failed")
    }
  }

  const handleClose = () => {
    if (isProcessing) return
    onClose()
  }

  /** Format number to max 4 decimal places */
  const fmt = (val: number): string => {
    if (val === 0) return "0"
    return parseFloat(val.toFixed(4)).toString()
  }

  const fmtBigint = (val: bigint): string =>
    fmt(parseFloat(formatUnits(val, 18)))

  if (!isOpen) return null

  const depositAmount = getDepositAmount()
  const insufficientBalance = mode === "deposit" && depositAmount > userBalance
  const pct = parseInt(redeemPercent) || 100
  const redeemSharesAmount = gsPosition
    ? (gsPosition.shares * BigInt(pct)) / 100n
    : 0n

  return createPortal(
    <div
      className={`modal-overlay ${isProcessing ? "processing" : ""}`}>
      <div className="modal-content">
        <div className="modal-body">
          {/* Title */}
          {!txSuccess && !txError && (
            <div className="gs-modal__header">
              <h2 className="gs-modal__title">
                {mode === "deposit"
                  ? "Add to Pool"
                  : "Redeem Position"}
              </h2>
              <p className="gs-modal__subtitle">
                Beta Season Pool
              </p>
            </div>
          )}

          {/* Current position summary */}
          {!txSuccess && gsPosition && (
            <div className="gs-modal__position">
              <div className="gs-modal__position-row">
                <span className="gs-modal__position-label">
                  Your stake
                </span>
                <span className="gs-modal__position-value">
                  {fmtBigint(gsPosition.currentValue)} TRUST
                </span>
              </div>
              <div className="gs-modal__position-row">
                <span className="gs-modal__position-label">
                  P&L
                </span>
                <span
                  className={`gs-modal__position-value ${gsPosition.profitLoss >= 0n ? "gs-modal__positive" : "gs-modal__negative"}`}>
                  {gsPosition.profitLoss >= 0n ? "+" : ""}
                  {fmtBigint(gsPosition.profitLoss)} TRUST (
                  {gsPosition.profitLoss >= 0n ? "+" : ""}
                  {gsPosition.profitPercent.toFixed(1)}%)
                </span>
              </div>
              {vaultStats && (
                <div className="gs-modal__position-row">
                  <span className="gs-modal__position-label">
                    TVL
                  </span>
                  <span className="gs-modal__position-value">
                    {fmtBigint(vaultStats.tvl)} TRUST
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Deposit mode ── */}
          {mode === "deposit" && !txSuccess && !txError && (
            <>
              <div className="gs-modal__amount-section">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    selectedPill === "custom"
                      ? customValue
                      : depositOptions.find(
                          (o) => o.id === selectedPill
                        )?.value || ""
                  }
                  onChange={(e) => {
                    setSelectedPill("custom")
                    setCustomValue(e.target.value)
                  }}
                  onFocus={(e) => {
                    setSelectedPill("custom")
                    e.target.select()
                  }}
                  className="weight-modal-amount-input"
                  placeholder="0.5"
                  disabled={isProcessing}
                />
                <div className="weight-modal-pills">
                  {depositOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedPill(opt.id)}
                      className={`weight-modal-pill ${selectedPill === opt.id ? "selected" : ""}`}
                      disabled={isProcessing}>
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="weight-modal-cost-summary">
                <div className="weight-modal-cost-row">
                  <span>Deposit</span>
                  <span>{fmt(depositAmount)} TRUST</span>
                </div>
                {previewShares > 0n && (
                  <div className="weight-modal-cost-row weight-modal-cost-sub">
                    <span>Shares received</span>
                    <span>~{fmtBigint(previewShares)}</span>
                  </div>
                )}
                <div className="weight-modal-cost-divider" />
                <div
                  className={`weight-modal-cost-row weight-modal-cost-balance ${insufficientBalance ? "weight-modal-insufficient" : ""}`}>
                  <span>Balance</span>
                  <span>{fmt(userBalance)} TRUST</span>
                </div>
              </div>
            </>
          )}

          {/* ── Redeem mode ── */}
          {mode === "redeem" && !txSuccess && !txError && (
            <>
              {gsPosition && gsPosition.shares > 0n ? (
                <>
                  <div className="gs-modal__redeem-pills">
                    {redeemOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() =>
                          setRedeemPercent(opt.id)
                        }
                        className={`weight-modal-pill ${redeemPercent === opt.id ? "selected" : ""}`}
                        disabled={isProcessing}>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="weight-modal-cost-summary">
                    <div className="weight-modal-cost-row">
                      <span>Shares to redeem</span>
                      <span>{fmtBigint(redeemSharesAmount)}</span>
                    </div>
                    <div className="weight-modal-cost-row">
                      <span>You will receive</span>
                      <span className="gs-modal__receive-value">
                        ~{fmtBigint(previewAssets)} TRUST
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="gs-modal__empty">
                  No position to redeem
                </div>
              )}
            </>
          )}

          {/* Processing state */}
          {isProcessing && !txSuccess && (
            <div className="modal-processing-section">
              <SofiaLoader size={60} />
              <div className="modal-processing-text">
                <p className="modal-processing-title">
                  {mode === "deposit"
                    ? "Depositing..."
                    : "Redeeming..."}
                </p>
                <p className="modal-processing-step">
                  Confirming transaction...
                </p>
              </div>
            </div>
          )}

          {/* Success state — video overlay */}
          {txSuccess && (
            <div className="reward-claimed-overlay">
              <video
                className="reward-claimed-bg-video"
                src={goldRewardVideoUrl}
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="reward-claimed-content">
                <div className="reward-claimed-top">
                  <h2 className="reward-claimed-title">
                    {mode === "deposit" ? (
                      <>Deposit<br />Confirmed!</>
                    ) : (
                      <>Position<br />Redeemed!</>
                    )}
                  </h2>
                  <p className="reward-claimed-subtitle">
                    {mode === "deposit"
                      ? `${fmt(depositAmount)} TRUST added to Beta Season Pool`
                      : `~${fmtBigint(previewAssets)} TRUST returned to your wallet`}
                  </p>
                </div>
                <div className="reward-claimed-bottom">
                  {txHash && (
                    <a
                      href={`${EXPLORER_URLS.TRANSACTION}${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="reward-view-tx-link">
                      View on Explorer →
                    </a>
                  )}
                  <button
                    className="reward-continue-btn"
                    onClick={handleClose}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {txError && !txSuccess && (
            <div className="modal-error-section">
              <div className="modal-error-icon">❌</div>
              <div className="modal-error-text">
                <p className="modal-error-title">
                  Transaction Failed
                </p>
                <p className="modal-error-message">{txError}</p>
              </div>
            </div>
          )}

          {/* Actions — hidden during success overlay */}
          {!txSuccess && (
          <div className="modal-actions">
            <button
              className="stake-btn stake-btn-cancel"
              onClick={handleClose}
              disabled={isProcessing}>
              {txError ? "Close" : "Cancel"}
            </button>
            {!txError && (
              <button
                className="modal-btn primary"
                onClick={
                  mode === "deposit" ? handleDeposit : handleRedeem
                }
                disabled={
                  isProcessing ||
                  insufficientBalance ||
                  (mode === "deposit" && depositAmount <= 0) ||
                  (mode === "redeem" &&
                    (!gsPosition || gsPosition.shares === 0n))
                }>
                {isProcessing
                  ? "Processing..."
                  : mode === "deposit"
                    ? "Deposit"
                    : "Redeem"}
              </button>
            )}
            {txError && (
              <button
                className="modal-btn primary"
                onClick={
                  mode === "deposit" ? handleDeposit : handleRedeem
                }
                disabled={isProcessing}>
                Retry
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default GlobalStakeModal
