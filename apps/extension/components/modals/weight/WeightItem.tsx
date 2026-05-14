/**
 * WeightItem — one triplet card inside WeightModal.
 *
 * Hierarchy reversed vs. the legacy layout: platform + favicon + page title + intention/topic
 * sit at the top (the "value"), while the deposit picker (3 presets) sits at the bottom (the "plumbing").
 */

import type { ModalTriplet } from "~/hooks"
import { getIntentionBadge } from "~/types/intentionCategories"
import { TOPIC_LABELS, TOPIC_COLORS } from "~/lib/config/topicConfig"
import { getFaviconUrl } from "~/lib/utils"
import { weightOptions, type WeightOptionId } from "./types"

const truncate = (text: string, max: number) =>
  text.length > max ? text.slice(0, max) + "..." : text

const hostFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export interface WeightItemProps {
  triplet: ModalTriplet
  index: number
  selectedWeight: WeightOptionId | undefined
  isFormState: boolean
  isProcessing: boolean
  fixedDeposit?: number
  showRemoveButton: boolean
  canRemove: boolean
  ppEnabled: boolean
  detectPlatformFromUrl: (
    url: string
  ) => { slug: string; termId: string; label: string } | null
  getPpForSlug: (slug: string) => number
  onPpChange: (slug: string, pct: number) => void
  onWeightSelect: (index: number, optionId: WeightOptionId) => void
  onRemove: () => void
}

const WeightItem = ({
  triplet,
  index,
  selectedWeight,
  isFormState,
  isProcessing,
  fixedDeposit,
  showRemoveButton,
  canRemove,
  ppEnabled,
  detectPlatformFromUrl,
  getPpForSlug,
  onPpChange,
  onWeightSelect,
  onRemove
}: WeightItemProps) => {
  const badge = getIntentionBadge(triplet.intention)
  const detectedPlatform = detectPlatformFromUrl(triplet.url)
  const platformLabel = detectedPlatform?.label ?? hostFromUrl(triplet.url)
  const pageTitle = triplet.description || triplet.triplet.object
  const interestTopic = triplet.interestContext
    ? TOPIC_LABELS[triplet.interestContext]
    : null
  const interestColor = triplet.interestContext
    ? TOPIC_COLORS[triplet.interestContext] || "#888"
    : null

  return (
    <div className="weight-item">
      {isFormState && showRemoveButton && (
        <button
          className="weight-modal-triplet-remove"
          onClick={onRemove}
          disabled={isProcessing || !canRemove}
          title="Remove from batch">
          ×
        </button>
      )}

      <div className="weight-item__header">
        <img
          src={getFaviconUrl(triplet.url, 32)}
          alt=""
          className="weight-item__favicon"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.visibility = "hidden"
          }}
        />
        <div className="weight-item__identity">
          <span className="weight-item__platform">{platformLabel}</span>
          <span className="weight-item__title" title={pageTitle}>
            {truncate(pageTitle, 56)}
          </span>
        </div>
      </div>

      <div className="weight-item__meta">
        {badge && (
          <span
            className="weight-item__intention"
            style={{
              color: badge.color,
              borderColor: `${badge.color}55`,
              backgroundColor: `${badge.color}12`
            }}>
            {badge.label}
          </span>
        )}
        {interestTopic && interestColor && (
          <span
            className="weight-item__topic"
            style={{
              color: interestColor,
              borderColor: `${interestColor}55`,
              backgroundColor: `${interestColor}12`
            }}>
            {interestTopic}
          </span>
        )}
      </div>

      {isFormState && fixedDeposit == null && (
        <div className="weight-item__presets">
          {weightOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onWeightSelect(index, option.id)}
              className={`weight-preset ${selectedWeight === option.id ? "is-selected" : ""}`}
              disabled={isProcessing}
              type="button">
              <span className="weight-preset__label">{option.label}</span>
              <span className="weight-preset__value">{option.value}</span>
            </button>
          ))}
        </div>
      )}

      {isFormState && ppEnabled && detectedPlatform && (
        <details className="weight-item__pp">
          <summary>{detectedPlatform.label} Pool contribution</summary>
          <div className="pp-item-slider">
            <input
              type="range"
              min={0}
              max={50000}
              step={1000}
              value={getPpForSlug(detectedPlatform.slug)}
              onChange={(e) =>
                onPpChange(detectedPlatform.slug, Number(e.target.value))
              }
              className="pp-item-slider__input"
              style={
                {
                  "--pp-fill-pct": `${(getPpForSlug(detectedPlatform.slug) / 50000) * 100}%`
                } as React.CSSProperties
              }
              disabled={isProcessing}
            />
            <span className="pp-item-slider__value">
              {getPpForSlug(detectedPlatform.slug) / 1000}%
            </span>
          </div>
        </details>
      )}
    </div>
  )
}

export default WeightItem
