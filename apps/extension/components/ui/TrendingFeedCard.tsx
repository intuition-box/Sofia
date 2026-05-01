/**
 * TrendingFeedCard — feed-style card for the Trending tab.
 *
 * Mirrors the explorer's `<FeedCard />` anatomy (favicon + title/host,
 * actor row with certifier avatar + relative timestamp, verb pills) but
 * adapted for the side-panel viewport and Sofia's data shape. CSS lives
 * in `components/styles/TrendingFeedCard.css`, prefixed with `tfc-` so
 * it doesn't collide with the explorer's `.fc-*` rules.
 *
 * Phase A — Support/Oppose buttons and topic-context tags are skipped
 * intentionally; they belong to the optional Phase 5.
 */

import type { KeyboardEvent, MouseEvent } from "react"

import { getFaviconUrl, formatRelativeTime } from "~/lib/utils"
import type { IntentionType } from "~/types/intentionCategories"
import { INTENTION_CONFIG } from "~/types/intentionCategories"

import Avatar from "./Avatar"

import "../styles/TrendingFeedCard.css"

export interface TrendingFeedCardProps {
  /** Page title (or domain when no title). 2-line clamped. */
  title: string
  /** Page URL — opens in new tab when card is clicked (unless overridden). */
  url: string
  /** Domain (e.g. "youtube.com") — shown as the small mono host line. */
  domain: string
  /** Top certifier wallet address — used to seed avatar fallback. */
  certifierId?: string
  /** Display label for the top certifier (ENS, account.label, or 0x…). */
  certifierLabel?: string
  /** Avatar URL for the top certifier, when available. */
  certifierImage?: string
  /** ISO/string timestamp of the latest activity on this URL/triple. */
  timestamp?: string
  /** Verb pills — IntentionType keys map to label/color via INTENTION_CONFIG. */
  intentions: IntentionType[]
  /** Optional certifier count badge on the bottom-right. */
  certifierCount?: number
  /** Click override; defaults to `chrome.tabs.create({ url })`. */
  onClick?: () => void
}

const TrendingFeedCard = ({
  title,
  url,
  domain,
  certifierId,
  certifierLabel,
  certifierImage,
  timestamp,
  intentions,
  certifierCount,
  onClick
}: TrendingFeedCardProps) => {
  const openUrl = () => {
    if (onClick) {
      onClick()
      return
    }
    if (!url) return
    if (typeof chrome !== "undefined" && chrome?.tabs?.create) {
      chrome.tabs.create({ url })
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const handleClick = (_e: MouseEvent<HTMLElement>) => {
    openUrl()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      openUrl()
    }
  }

  const ago = timestamp ? formatRelativeTime(timestamp) : ""

  return (
    <article
      className="tfc"
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}>
      <div className="tfc-head">
        <div className="tfc-favicon">
          <img
            src={getFaviconUrl(domain || url, 64)}
            alt=""
            className="tfc-favicon-img"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.visibility = "hidden"
            }}
          />
        </div>
        <div className="tfc-title-wrap">
          <div className="tfc-title">{title || domain}</div>
          <div className="tfc-host">{domain}</div>
        </div>
      </div>

      {(certifierLabel || certifierId) && (
        <div className="tfc-actor">
          <Avatar
            imgSrc={certifierImage || undefined}
            name={certifierLabel || certifierId}
            avatarClassName="tfc-actor-avatar"
          />
          <span className="tfc-actor-name">
            {certifierLabel || certifierId}
          </span>
          {ago && <span className="tfc-actor-ago">{ago}</span>}
        </div>
      )}

      <div className="tfc-bottom">
        {intentions.map((intent) => {
          const cfg = INTENTION_CONFIG[intent]
          if (!cfg) return null
          return (
            <span
              key={intent}
              className="tfc-verb-tag"
              style={{ background: cfg.color }}>
              {cfg.label}
            </span>
          )
        })}
        {typeof certifierCount === "number" && certifierCount > 0 && (
          <span className="tfc-cert-count">
            {certifierCount}{" "}
            {certifierCount === 1 ? "certifier" : "certifiers"}
          </span>
        )}
      </div>
    </article>
  )
}

export default TrendingFeedCard
