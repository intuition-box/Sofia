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
import { CERTIFICATION_LIST } from "~/types/intentionCategories"
import type { GroupUrlRecord } from "~types/database"

import { usePageCartActions, type UrlCertificationStatus } from "../../../hooks"
import { getDisplayTitle } from "../../../lib/utils/cleanTitle"
import PageTagsField from "../PageTagsField"

import "../../styles/PageMarketPanel.css"

export interface UrlRowProps {
  urlRecord: GroupUrlRecord
  onChainStatus?: UrlCertificationStatus
  onOAuthCertify: (urlRecord: GroupUrlRecord) => void
  onRemove: () => void
  isProcessing: boolean
  certifiedContexts?: string[]
}

// URL Row Component
function UrlRow({
  urlRecord,
  onChainStatus,
  onOAuthCertify,
  onRemove,
  isProcessing,
  certifiedContexts = []
}: UrlRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  // Same market actions as the Page tab: Recommend / Distrust + tags
  const page = usePageCartActions(urlRecord.url, urlRecord.title || null)
  let host = ""
  try {
    host = new URL(urlRecord.url).hostname
  } catch {
    // not a URL
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
          <div className="pm-actions">
            <button
              type="button"
              className={`pm-btn pm-btn--support${page.recommendItem ? " is-queued" : ""}`}
              aria-pressed={!!page.recommendItem}
              onClick={() => void page.toggleRecommend()}
              disabled={isProcessing}>
              {page.recommendItem ? "✓ Recommend" : "Recommend"}
            </button>
            <button
              type="button"
              className={`pm-btn pm-btn--oppose${page.distrustItem ? " is-queued" : ""}`}
              aria-pressed={!!page.distrustItem}
              onClick={() => void page.toggleDistrust()}
              disabled={isProcessing}>
              {page.distrustItem ? "✓ Distrust" : "Distrust"}
            </button>
          </div>
          <PageTagsField
            intentions={page.intentions}
            onToggleIntention={page.toggleIntention}
            contexts={page.topics}
            onChangeContexts={page.setTopics}
            hints={[urlRecord.title, host].filter(Boolean).join(" ")}
          />
        </div>
      )}
    </div>
  )
}

export default UrlRow
