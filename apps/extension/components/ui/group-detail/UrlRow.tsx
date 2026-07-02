/**
 * UrlRow Component
 * A single row in the GroupDetailView URL list. Shows certification badges,
 * metadata, and an expandable section with intention + context selectors.
 */

import { TopicPill, VerbTag } from "@0xsofia/design-system"
import { useState } from "react"

import {
  contextColor,
  contextIcon,
  contextLabel
} from "~/lib/config/contextDisplay"
import { INTENTION_ICONS } from "~/lib/config/intentionIcons"
import {
  formatDuration,
  formatShortDate,
  getEffectiveCertStatus,
  getFaviconUrl
} from "~/lib/utils"
import {
  CERTIFICATION_LIST,
  INTENTION_CONFIG,
  INTENTION_ITEMS,
  TRUST_ITEMS,
  type IntentionType
} from "~/types/intentionCategories"
import type { GroupUrlRecord } from "~types/database"

import type { UrlCertificationStatus } from "../../../hooks"
import { getDisplayTitle } from "../../../lib/utils/cleanTitle"
import type { IntentionPurpose } from "../../../types/discovery"
import { INTENTION_PREDICATES } from "../../../types/discovery"
import { IntentionSelector } from "../IntentionSelector"
import { InterestContextSelector } from "../InterestContextSelector"

export interface UrlRowProps {
  urlRecord: GroupUrlRecord
  onChainStatus?: UrlCertificationStatus
  onAddToCart: (
    intention: IntentionPurpose,
    title?: string,
    contexts?: string[]
  ) => void
  onAddTrustToCart: (
    predicateName: string,
    title?: string,
    contexts?: string[]
  ) => void
  onRemoveFromCart: (predicateName: string) => void
  onOAuthCertify: (urlRecord: GroupUrlRecord) => void
  onRemove: () => void
  isProcessing: boolean
  cartPredicates: string[]
  certifiedContexts?: string[]
  onContextChange: (contexts: string[]) => void
}

// URL Row Component
function UrlRow({
  urlRecord,
  onChainStatus,
  onAddToCart,
  onAddTrustToCart,
  onRemoveFromCart,
  onOAuthCertify,
  onRemove,
  isProcessing,
  cartPredicates,
  certifiedContexts = [],
  onContextChange
}: UrlRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedContexts, setSelectedContexts] = useState<string[]>([])
  // Single active intention picked in the dropdown (null = placeholder).
  const [selectedIntention, setSelectedIntention] =
    useState<IntentionType | null>(null)

  // Resolve an intention type to its on-chain predicate (trust verb or
  // "visits for …" purpose) so we can add/remove the matching cart item.
  const predicateForType = (type: IntentionType): string | null => {
    const cfg = INTENTION_CONFIG[type]
    if (cfg.intentionPurpose) return INTENTION_PREDICATES[cfg.intentionPurpose]
    return cfg.predicateLabel
  }
  const addIntentionToCart = (type: IntentionType) => {
    const cfg = INTENTION_CONFIG[type]
    if (cfg.intentionPurpose) {
      onAddToCart(cfg.intentionPurpose, urlRecord.title, selectedContexts)
    } else if (cfg.predicateLabel) {
      onAddTrustToCart(cfg.predicateLabel, urlRecord.title, selectedContexts)
    }
  }
  const handleSelectIntention = (type: IntentionType) => {
    if (type === selectedIntention) return
    if (selectedIntention) {
      const prev = predicateForType(selectedIntention)
      if (prev) onRemoveFromCart(prev)
    }
    addIntentionToCart(type)
    setSelectedIntention(type)
  }
  const handleClearIntention = () => {
    if (selectedIntention) {
      const prev = predicateForType(selectedIntention)
      if (prev) onRemoveFromCart(prev)
    }
    setSelectedIntention(null)
  }

  const handleSelectContexts = (slugs: string[]) => {
    setSelectedContexts(slugs)
    onContextChange(slugs)

    // When picking contexts on a URL that is already certified, auto-queue
    // a deposit-with-context cart item for each certified predicate that is
    // not already in the cart.
    if (slugs.length === 0) return
    for (const certLabel of allCertLabels) {
      const intentionItem = INTENTION_ITEMS.find((i) => i.type === certLabel)
      if (intentionItem) {
        const predicateName = INTENTION_PREDICATES[intentionItem.key]
        if (!cartPredicates.includes(predicateName)) {
          onAddToCart(intentionItem.key, urlRecord.title, slugs)
        }
        continue
      }
      const trustItem = TRUST_ITEMS.find((t) => t.type === certLabel)
      if (trustItem && !cartPredicates.includes(trustItem.predicateLabel)) {
        onAddTrustToCart(trustItem.predicateLabel, urlRecord.title, slugs)
      }
    }
  }

  // Use Pipeline 2 data with Pipeline 1 fallback for trust/distrust
  const { isCertified: isCertifiedOnChain, labels: allCertLabels } =
    getEffectiveCertStatus(urlRecord, onChainStatus)

  const allCertInfos = allCertLabels
    .map((label) => CERTIFICATION_LIST.find((c) => c.type === label))
    .filter(Boolean) as typeof CERTIFICATION_LIST

  const canToggle = !urlRecord.removed && !isProcessing
  const handleToggle = () => {
    if (!canToggle) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <div
      className={`url-row ${urlRecord.removed ? "removed" : ""} ${isExpanded ? "expanded" : ""} ${isCertifiedOnChain ? "on-chain" : ""}`}>
      <div
        className="url-row-main"
        onClick={handleToggle}
        role={canToggle ? "button" : undefined}
        tabIndex={canToggle ? 0 : undefined}
        onKeyDown={(e) => {
          if (canToggle && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            handleToggle()
          }
        }}
        style={{ cursor: canToggle ? "pointer" : "default" }}>
        {/* xs-card favicon thumb — left rail, mirrors the feed card's
            .fc-xs-thumb. No OG fetch: a URL group shares one domain. */}
        <span className="url-row-thumb" aria-hidden="true">
          <img
            src={getFaviconUrl(urlRecord.url, 64)}
            alt=""
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.visibility = "hidden"
            }}
          />
        </span>
        <div className="url-info">
          <a
            href={urlRecord.url}
            target="_blank"
            rel="noopener noreferrer"
            className="url-title"
            onClick={(e) => e.stopPropagation()}>
            {urlRecord.title
              ? getDisplayTitle(urlRecord.title, urlRecord.url)
              : urlRecord.url}
          </a>
          {/* Full URL (sans protocole) — distinguishes pages that share the
              group's domain. Truncated with ellipsis. */}
          <span className="url-host">
            {urlRecord.url.replace(/^https?:\/\//, "")}
          </span>
          <div className="url-meta">
            {((isCertifiedOnChain && allCertInfos.length > 0) ||
              certifiedContexts.length > 0) && (
              <div className="cert-badges">
                {allCertInfos.map((certInfo) => {
                  const Icon = INTENTION_ICONS[certInfo.type]
                  return (
                    <VerbTag
                      key={certInfo.type}
                      intent={certInfo.type}
                      label={certInfo.label}
                      icon={Icon ? <Icon className="fc-verb-ic" /> : undefined}
                      title={`Marked as ${certInfo.label} (on-chain)`}
                    />
                  )
                })}
                {certifiedContexts.map((slug) => (
                  <TopicPill
                    key={`ctx-${slug}`}
                    color={contextColor(slug)}
                    label={contextLabel(slug) ?? slug}
                    glyph={contextIcon(slug)}
                    size="sm"
                    title={`Marked in context of ${contextLabel(slug) ?? slug}`}
                  />
                ))}
              </div>
            )}
            <span className="url-date">
              {formatShortDate(urlRecord.addedAt)}
            </span>
            <span className="url-duration">
              {formatDuration(urlRecord.attentionTime)}
            </span>
          </div>
        </div>

        <div className="url-actions">
          {!urlRecord.removed && (
            <>
              <span
                className={`url-chevron ${isExpanded ? "expanded" : ""}`}
                aria-hidden="true">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                disabled={isProcessing}
                title="Remove URL"
                aria-label="Remove URL">
                ×
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded section with OAuth predicate + intention bubbles on same line */}
      {isExpanded && (
        <div className="url-expanded-section">
          {urlRecord.oauthPredicate && (
            <button
              className="oauth-predicate-btn"
              onClick={() => {
                onOAuthCertify(urlRecord)
                setIsExpanded(false)
              }}
              disabled={isProcessing}>
              {urlRecord.oauthPredicate}
            </button>
          )}
          {/* Two matching dropdowns side by side — same layout as
              PageBlockchainCard's actions panel. */}
          <div className="cert-actions-row">
            <IntentionSelector
              selected={selectedIntention}
              onSelect={handleSelectIntention}
              onClear={handleClearIntention}
              disabled={isProcessing}
            />
            <InterestContextSelector
              selectedContexts={selectedContexts}
              onChange={handleSelectContexts}
              disabled={isProcessing}
              certifiedContexts={certifiedContexts}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default UrlRow
