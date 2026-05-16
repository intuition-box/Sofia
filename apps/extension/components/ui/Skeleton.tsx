import type { ReactNode } from "react"

import "../styles/Skeleton.css"

interface SkeletonLineProps {
  width?: string | number
  height?: number
}

const SkeletonLine = ({ width = "100%", height = 12 }: SkeletonLineProps) => (
  <div className="skeleton-line" style={{ width, height }} />
)

/* Pill skeleton — mirrors .intention-pill / .interest-context__btn
   (6px radius, ds-card surface). */
const SkeletonPill = ({
  width,
  height = 32
}: {
  width: number
  height?: number
}) => (
  <div
    className="blockchain-skeleton__pill"
    style={{ width, height }}
    aria-hidden="true"
  />
)

interface PageBlockchainSkeletonProps {
  /** Real Share-on-X button rendered in place during loading (instead of
   *  a shimmer placeholder) when the host can supply it. */
  shareSlot?: ReactNode
  /** Real Preview (live-sentence) section, in its empty state. */
  previewSlot?: ReactNode
}

/**
 * Skeleton mirroring PageBlockchainCard layout 1:1.
 * Section titles + scope toggle are rendered with the real text so the
 * skeleton-to-content swap doesn't reflow them. `shareSlot`/`previewSlot`
 * let the host keep the real Share-on-X + Preview visible during loading.
 */
export const PageBlockchainSkeleton = ({
  shareSlot,
  previewSlot
}: PageBlockchainSkeletonProps = {}) => (
  <div className="blockchain-skeleton">
    {/* Website header — StarBorder wrapper + salmon surface */}
    <div className="blockchain-skeleton__star-border">
      <div className="blockchain-skeleton__website">
        <div className="blockchain-skeleton__favicon" />
        <div className="blockchain-skeleton__website-text">
          <SkeletonLine width="62%" height={20} />
          <SkeletonLine width="38%" height={10} />
        </div>
        <div className="blockchain-skeleton__badge" />
      </div>
    </div>

    {/* Share button — real component during loading when provided */}
    {shareSlot ?? <div className="blockchain-skeleton__share" />}

    {/* Actions panel */}
    <div className="actions-panel blockchain-skeleton__actions">
      <div className="actions-panel-title">Actions on this page</div>

      {/* Intentions */}
      <div className="cert-section">
        <div className="cert-section-title">Intentions</div>
        <div className="blockchain-skeleton__pills">
          <SkeletonPill width={80} />
          <SkeletonPill width={96} />
          <span className="blockchain-skeleton__sep" />
          <SkeletonPill width={62} />
          <SkeletonPill width={88} />
          <SkeletonPill width={56} />
          <SkeletonPill width={108} />
          <SkeletonPill width={78} />
          <SkeletonPill width={66} />
        </div>
      </div>

      {/* In context of */}
      <div className="cert-section">
        <div className="cert-section-title">In context of</div>
        <div className="blockchain-skeleton__pills blockchain-skeleton__pills--full">
          <SkeletonPill width={0} height={42} />
          <SkeletonPill width={0} height={42} />
          <SkeletonPill width={0} height={42} />
        </div>
      </div>

      {/* Preview — real (empty) section during loading when provided */}
      {previewSlot ? (
        <>
          {previewSlot}
          <div className="blockchain-skeleton__validate" />
        </>
      ) : (
        <div className="cert-section">
          <div className="cert-section-title">Preview</div>
          <div className="blockchain-skeleton__sentence">
            <SkeletonLine width="92%" height={11} />
            <SkeletonLine width="68%" height={11} />
          </div>
          <div className="blockchain-skeleton__validate" />
        </div>
      )}
    </div>

    {/* Stats on this page */}
    <div className="extended-metrics-panel blockchain-skeleton__metrics">
      <div className="section-header">
        <span className="section-title">Stats on this page</span>
        <div className="scope-toggle">
          <button className="scope-btn active" disabled>
            Domain
          </button>
          <button className="scope-btn" disabled>
            Page
          </button>
          <button className="scope-btn" disabled>
            Certifiers
          </button>
          <button className="scope-btn" disabled>
            Signals
          </button>
        </div>
      </div>
      <div className="blockchain-skeleton__bars">
        {[
          { label: 56, count: 18 },
          { label: 70, count: 18 },
          { label: 44, count: 18 },
          { label: 64, count: 18 },
          { label: 36, count: 18 },
          { label: 76, count: 18 },
          { label: 56, count: 18 },
          { label: 50, count: 18 }
        ].map((row, idx) => (
          <div key={idx} className="blockchain-skeleton__bar-row">
            <SkeletonPill width={row.label} height={20} />
            <div className="blockchain-skeleton__bar" />
            <SkeletonLine width={row.count} height={11} />
          </div>
        ))}
      </div>
    </div>
  </div>
)
