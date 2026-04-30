import "../styles/Skeleton.css"

interface SkeletonLineProps {
  width?: string | number
  height?: number
}

interface SkeletonCircleProps {
  size?: number
}

const SkeletonLine = ({
  width = "100%",
  height = 12
}: SkeletonLineProps) => (
  <div className="skeleton-line" style={{ width, height }} />
)

const SkeletonCircle = ({ size = 40 }: SkeletonCircleProps) => (
  <div className="skeleton-circle" style={{ width: size, height: size }} />
)

/* Helper: pill skeleton with optional dot prefix (mirrors the real
   .circle-chip / .intention-pill structure). */
const SkeletonPill = ({
  width,
  height = 28,
  withDot = false
}: {
  width: number
  height?: number
  withDot?: boolean
}) => (
  <div
    className="blockchain-skeleton__pill"
    style={{ width, height }}
    aria-hidden="true"
  >
    {withDot && <span className="blockchain-skeleton__pill-dot" />}
  </div>
)

/**
 * Skeleton that mirrors PageBlockchainCard layout 1:1.
 * Sections (top → bottom):
 *   1. Website info card (favicon 44 + URL stack + 56 badge)
 *   2. cert-section "Intentions" (mono title + trust/distrust + 6 pills)
 *   3. cert-section "Context" (mono title + 1-3 topic pills)
 *   4. Position board preview (4 certifier rows)
 *   5. Share button preview
 *   6. Extended metrics panel (title + 8 progress rows)
 */
export const PageBlockchainSkeleton = () => (
  <div className="blockchain-skeleton">
    {/* Website header */}
    <div className="blockchain-skeleton__website">
      <div className="blockchain-skeleton__favicon" />
      <div className="blockchain-skeleton__website-text">
        <SkeletonLine width="62%" height={15} />
        <SkeletonLine width="38%" height={10} />
      </div>
      <div className="blockchain-skeleton__badge">
        <div className="blockchain-skeleton__badge-rank" />
      </div>
    </div>

    {/* Cert section "Intentions" */}
    <div className="blockchain-skeleton__section">
      <div className="blockchain-skeleton__section-title" />
      <div className="blockchain-skeleton__pills">
        <SkeletonPill width={84} />
        <SkeletonPill width={104} />
        <span className="blockchain-skeleton__sep" />
        <SkeletonPill width={62} />
        <SkeletonPill width={84} />
        <SkeletonPill width={56} />
        <SkeletonPill width={102} />
        <SkeletonPill width={74} />
        <SkeletonPill width={66} />
      </div>
    </div>

    {/* Cert section "Context" */}
    <div className="blockchain-skeleton__section">
      <div
        className="blockchain-skeleton__section-title"
        style={{ width: 64 }}
      />
      <div className="blockchain-skeleton__pills">
        <SkeletonPill width={120} height={36} />
        <SkeletonPill width={92} height={36} />
        <SkeletonPill width={76} height={36} />
      </div>
    </div>

    {/* Position board preview — 4 certifier rows */}
    <div className="blockchain-skeleton__board">
      <div className="blockchain-skeleton__board-header">
        <div className="blockchain-skeleton__section-title" style={{ width: 96 }} />
        <SkeletonLine width={28} height={10} />
      </div>
      <div className="blockchain-skeleton__board-rows">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="blockchain-skeleton__board-row">
            <SkeletonLine width={18} height={10} />
            <SkeletonCircle size={22} />
            <SkeletonLine width="40%" height={11} />
            <div
              className="blockchain-skeleton__pill"
              style={{ width: 68, height: 18, marginLeft: "auto" }}
            />
          </div>
        ))}
      </div>
    </div>

    {/* Share button placeholder */}
    <div className="blockchain-skeleton__share" />

    {/* Extended metrics — 2 trust + 6 intention rows */}
    <div className="blockchain-skeleton__metrics">
      <div className="blockchain-skeleton__metrics-header">
        <div
          className="blockchain-skeleton__section-title"
          style={{ width: 168 }}
        />
        <div
          className="blockchain-skeleton__pill"
          style={{ width: 78, height: 24 }}
        />
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
            <SkeletonPill width={row.label} height={20} withDot />
            <div className="blockchain-skeleton__bar" />
            <SkeletonLine width={row.count} height={11} />
          </div>
        ))}
      </div>
    </div>
  </div>
)
