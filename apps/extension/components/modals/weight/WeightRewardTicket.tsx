/**
 * WeightRewardTicket — the "Mark captured." reward stub shown after a discovery
 * reward is claimed: ticket header, the list of marked pages, the Pioneer /
 * Explorer / Contributor tier ladder, the Gold ledger, and share/close actions.
 */
import { TopicPill, UserBadge } from "@0xsofia/design-system"

import type { ModalTriplet } from "~/hooks"
import { EXPLORER_URLS } from "~/lib/config/chainConfig"
import {
  contextColor,
  contextIcon,
  contextLabel
} from "~/lib/config/contextDisplay"

import contributorBadge from "../../ui/img/badges/contributor.png"
import explorerBadge from "../../ui/img/badges/explorer.png"
import pioneerBadge from "../../ui/img/badges/pioneer.png"
import { hostFromUrl, type DiscoveryReward } from "./types"

const TIER_ORDER = ["pioneer", "explorer", "contributor"] as const
type RewardTier = (typeof TIER_ORDER)[number]

const BADGE_IMAGES: Record<RewardTier, string> = {
  pioneer: pioneerBadge,
  explorer: explorerBadge,
  contributor: contributorBadge
}

interface WeightRewardTicketProps {
  discoveryReward: DiscoveryReward
  transactionHash?: string
  keptTriplets: ModalTriplet[]
  totalGold: number
  onClose: () => void
}

export default function WeightRewardTicket({
  discoveryReward,
  transactionHash,
  keptTriplets,
  totalGold,
  onClose
}: WeightRewardTicketProps) {
  return (
    <div className="rc">
      <div className="rc-ember" />
      <div className="rc-ticket">
        <div className="rc-stub">
          <div className="rc-stub-row">
            <span className="rc-stub-k">N°</span>
            <span className="rc-stub-v">
              {transactionHash
                ? transactionHash.slice(2, 10).toUpperCase()
                : "—"}
            </span>
          </div>
          <div className="rc-stub-row">
            <span className="rc-stub-k">DATE</span>
            <span className="rc-stub-v">
              {new Date().toLocaleDateString("fr-FR").replace(/\//g, " · ")}
            </span>
          </div>
        </div>
        <div className="rc-perf" />

        <div className="rc-body">
          <div className="rc-headline">
            <span className="rc-drop">M</span>
            <h1 className="rc-h1">
              ark
              <br />
              captured.
            </h1>
          </div>
          <p className="rc-sub">
            {keptTriplets.length === 1
              ? "Awarded for marking one page."
              : `Awarded for marking ${keptTriplets.length} pages.`}
          </p>

          <div className="rc-marks">
            {keptTriplets.map((t) => (
              <div className="rc-mark" key={t.id}>
                <span className="rc-mark-verb">{t.triplet.predicate}</span>
                <span className="rc-mark-obj" title={t.triplet.object}>
                  {t.description || t.triplet.object}
                </span>
                <span className="rc-mark-meta">
                  {(t.interestContexts?.length
                    ? t.interestContexts
                    : t.interestContext
                      ? [t.interestContext]
                      : []
                  ).map((slug) => {
                    const l = contextLabel(slug)
                    return l ? (
                      <TopicPill
                        key={slug}
                        color={contextColor(slug)}
                        label={l}
                        glyph={contextIcon(slug)}
                        size="sm"
                      />
                    ) : null
                  })}
                  <span className="rc-mark-host">{hostFromUrl(t.url)}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="rc-tiers">
            <div className="rc-tiers-k">Tier ladder</div>
            {TIER_ORDER.map((tier) => {
              const earned = discoveryReward.status.toLowerCase() === tier
              return (
                <div
                  className={`rc-tier${earned ? " is-earned" : ""}`}
                  key={tier}>
                  <UserBadge
                    tier={tier}
                    iconUrl={BADGE_IMAGES[tier]}
                    size={32}
                  />
                  <span className="rc-tier-label">
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </span>
                  <span className="rc-tier-state">
                    {earned ? "earned" : "locked"}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="rc-ledger">
            <div className="rc-ledger-row">
              <span>Gold reward</span>
              <span>+ {discoveryReward.gold} G</span>
            </div>
            <div className="rc-ledger-row rc-ledger-total">
              <span>Balance</span>
              <span>{totalGold.toLocaleString()} G</span>
            </div>
          </div>

          <div className="rc-actions">
            {transactionHash ? (
              <a
                className="rc-btn rc-btn--primary"
                href={`${EXPLORER_URLS.TRANSACTION}${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer">
                View my Echo →
              </a>
            ) : (
              <button className="rc-btn rc-btn--primary" onClick={onClose}>
                View my Echo →
              </button>
            )}
            <a
              className="rc-btn"
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                `Just marked ${keptTriplets.length} page${
                  keptTriplets.length === 1 ? "" : "s"
                } on Sofia and earned ${discoveryReward.gold} Gold.`
              )}`}
              target="_blank"
              rel="noopener noreferrer">
              Share on X
            </a>
            <button className="rc-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
