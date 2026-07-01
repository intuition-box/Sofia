/**
 * WeightBasketRow — one selectable mark inside the Amplify ("b3") basket:
 * favicon + title/host, the live TRUST amount, verb + context pills, the
 * Light/Medium/Strong tier picker, and (when a platform is detected) the
 * URL↔Domain split with its share slider.
 *
 * Pure presentational: the parent owns selection state and passes `on`/`sel`
 * plus the toggle/select callbacks; this row only derives display values.
 */
import { VerbTag } from "@0xsofia/design-system"
import type { IntentionSlug } from "@0xsofia/design-system"

import { PP_FEE_DENOMINATOR } from "~/hooks"
import type { ModalTriplet } from "~/hooks"
import { INTENTION_ICONS } from "~/lib/config/intentionIcons"
import { getFaviconUrl } from "~/lib/utils"
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType
} from "~/types/intentionCategories"
import type { IntentionType } from "~/types/intentionCategories"

import ContextPills from "../../ui/ContextPills"
import {
  formatTrust,
  getWeightValue,
  hostFromUrl,
  weightOptions,
  type DetectPlatformFn,
  type WeightOptionId
} from "./types"

/** Leading lucide glyph for a verb tag — mirrors the Stats panel + Mark chips. */
const verbIcon = (type: IntentionType) => {
  const Icon = INTENTION_ICONS[type]
  return Icon ? <Icon className="fc-verb-ic" /> : undefined
}

interface WeightBasketRowProps {
  triplet: ModalTriplet
  /** Whether this mark is selected (contributes to the basket). */
  on: boolean
  /** The chosen weight tier, or undefined when none picked yet. */
  sel: WeightOptionId | undefined
  /** Fixed deposit mode hides the tier picker and live amount. */
  fixedDeposit?: number
  isProcessing: boolean
  /** Can this row be toggled OFF (≥2 active marks remain)? */
  canToggleOff: boolean
  /** Single-mark baskets lock the checkbox on. */
  lockedSingle: boolean
  ppEnabled: boolean
  detectPlatformFromUrl: DetectPlatformFn
  getPpForSlug: (slug: string) => number
  setPpForSlug: (slug: string, pct: number) => void
  onToggle: () => void
  onWeightSelect: (id: WeightOptionId) => void
}

export default function WeightBasketRow({
  triplet,
  on,
  sel,
  fixedDeposit,
  isProcessing,
  canToggleOff,
  lockedSingle,
  ppEnabled,
  detectPlatformFromUrl,
  getPpForSlug,
  setPpForSlug,
  onToggle,
  onWeightSelect
}: WeightBasketRowProps) {
  const name = triplet.description || triplet.triplet.object
  const intentKey: IntentionType | null = triplet.intention
    ? (((triplet.intention as string) in INTENTION_CONFIG
        ? triplet.intention
        : triplet.intention.replace(/^for_/, "")) as IntentionType)
    : // Trust / distrust rows carry no `intention` —
      // resolve the verb from the predicate label.
      predicateLabelToIntentionType(triplet.triplet.predicate)
  const intentEntry =
    intentKey && intentKey in INTENTION_CONFIG
      ? INTENTION_CONFIG[intentKey]
      : null
  const ctxSlugs =
    triplet.interestContexts && triplet.interestContexts.length
      ? triplet.interestContexts
      : triplet.interestContext
        ? [triplet.interestContext]
        : []
  const platform =
    ppEnabled && fixedDeposit == null
      ? detectPlatformFromUrl(triplet.url)
      : null
  const rowTrust = on ? getWeightValue(sel) : 0
  const ppFraction = platform
    ? getPpForSlug(platform.slug) / PP_FEE_DENOMINATOR
    : 0
  const platAmt = on ? rowTrust * ppFraction : 0
  const urlAmt = on ? rowTrust - platAmt : 0

  // A user→user trust (TrustAccountButton mints `trust-<termId>` ids) renders
  // as the "trust card" — a person→person bond, not an ordinary URL row.
  const isTrustRelation = triplet.id.startsWith("trust-")
  if (isTrustRelation) {
    const peerInit = (triplet.triplet.object || "?")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 2)
      .toUpperCase()
    return (
      <div
        className={`b3-row b3-row--trust tcard${on ? " is-on" : ""}`}
        style={
          { "--tc": intentEntry?.color ?? "#22c55e" } as React.CSSProperties
        }>
        <div className="tcard-row">
          <button
            className="tcard-check"
            role="checkbox"
            aria-checked={on}
            aria-label={on ? "Deselect" : "Select"}
            type="button"
            disabled={lockedSingle || (on && !canToggleOff)}
            onClick={onToggle}>
            {on && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6 9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <div className="bond">
            <div className="bond-p you">
              <span className="bond-av bond-av--you">YOU</span>
              <span className="bond-name">you</span>
            </div>
            <div className="bond-mid">
              <span className="bond-line" />
              <span className="bond-verb">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M12 3l7 4v5c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V7z" />
                </svg>
                {intentEntry?.label ?? "Trusted"}
              </span>
            </div>
            <div className="bond-p">
              <span className="bond-av bond-av--peer">{peerInit}</span>
              <span className="bond-name" title={triplet.triplet.object}>
                {triplet.triplet.object}
              </span>
            </div>
          </div>
        </div>

        <div className="tcard-stake">
          <span className="tcard-amt">
            {fixedDeposit != null ? "—" : formatTrust(rowTrust)}
            <small>TRUST</small>
          </span>
        </div>

        {fixedDeposit == null && (
          <div className="b3-tiers" role="radiogroup" aria-disabled={!on}>
            {weightOptions.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={sel === o.id}
                type="button"
                className={`b3-tier${sel === o.id ? " is-on" : ""}`}
                disabled={!on || isProcessing}
                onClick={() => on && onWeightSelect(o.id)}>
                <span className="b3-tier-label">{o.label}</span>
                <span className="b3-tier-value">{o.value}</span>
              </button>
            ))}
          </div>
        )}

        <p className="tcard-note">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>
            Trusting a <b>person</b> backs everything they curate — it shapes
            your circle, not just one page.
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className={`b3-row${on ? " is-on" : ""}`}>
      <button
        className="b3-check"
        role="checkbox"
        aria-checked={on}
        aria-label={on ? "Deselect mark" : "Select mark"}
        type="button"
        disabled={lockedSingle || (on && !canToggleOff)}
        onClick={onToggle}>
        {on && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l4 4L19 6"
              stroke="var(--ds-on-accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <img
        src={getFaviconUrl(triplet.url, 32)}
        alt=""
        className="b3-row-fav"
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.visibility = "hidden"
        }}
      />

      <div className="b3-row-meta">
        <div className="b3-row-name" title={name}>
          {name}
        </div>
        <div className="b3-row-sub" title={triplet.url}>
          {hostFromUrl(triplet.url)}
        </div>
      </div>

      <div className="b3-row-trust">
        <span className="b3-row-trust-val">
          {fixedDeposit != null ? "—" : formatTrust(rowTrust)}
        </span>
        <span className="b3-row-trust-unit">TRUST</span>
      </div>

      {/* Verb + context pills get their own full-width grid row
          (grid-column 1/-1) so multiple contexts wrap cleanly
          instead of crowding the title column. */}
      {(intentEntry || ctxSlugs.length > 0) && (
        <div className="b3-row-tags">
          {intentEntry && (
            <VerbTag
              intent={intentKey as IntentionSlug}
              label={intentEntry.label}
              icon={verbIcon(intentKey as IntentionType)}
            />
          )}
          <ContextPills slugs={ctxSlugs} />
        </div>
      )}

      {/* Weight selector spans its own full-width row below the tags
          so the 3 tiers stay uncramped. */}
      {fixedDeposit == null && (
        <div className="b3-tiers" role="radiogroup" aria-disabled={!on}>
          {weightOptions.map((o) => (
            <button
              key={o.id}
              role="radio"
              aria-checked={sel === o.id}
              type="button"
              className={`b3-tier${sel === o.id ? " is-on" : ""}`}
              disabled={!on || isProcessing}
              onClick={() => on && onWeightSelect(o.id)}>
              <span className="b3-tier-label">{o.label}</span>
              <span className="b3-tier-value">{o.value}</span>
            </button>
          ))}
        </div>
      )}

      {platform && fixedDeposit == null && (
        <div className={`b3-dest${on ? "" : " is-off"}`}>
          <div className="b3-dest-line">
            <span className="b3-dest-tag b3-dest-tag--url">URL</span>
            <span className="b3-dest-where" title={triplet.url}>
              {hostFromUrl(triplet.url)} · this page
            </span>
            <span className="b3-dest-amt">{formatTrust(urlAmt)} T</span>
          </div>
          <div className="b3-dest-line">
            <span className="b3-dest-tag b3-dest-tag--domain">DOMAIN</span>
            <span className="b3-dest-where">
              {platform.label} · whole platform
            </span>
            <span className="b3-dest-ctl">
              <input
                type="range"
                min={0}
                max={100000}
                step={1000}
                value={getPpForSlug(platform.slug)}
                onChange={(e) =>
                  setPpForSlug(platform.slug, Number(e.target.value))
                }
                disabled={!on || isProcessing}
                aria-label={`${platform.label} share`}
                className="b3-dest-range"
                style={
                  {
                    "--pp-fill": `${getPpForSlug(platform.slug) / 1000}%`
                  } as React.CSSProperties
                }
              />
              <span className="b3-dest-pct">
                {(getPpForSlug(platform.slug) / 1000).toFixed(0)}%
              </span>
            </span>
            <span className="b3-dest-amt">{formatTrust(platAmt)} T</span>
          </div>
        </div>
      )}
    </div>
  )
}
