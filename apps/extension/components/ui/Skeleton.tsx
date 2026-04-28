import "../styles/Skeleton.css"

interface SkeletonLineProps {
  width?: string | number
  height?: number
}

interface SkeletonCircleProps {
  size?: number
}

export const SkeletonLine = ({
  width = "100%",
  height = 12
}: SkeletonLineProps) => (
  <div className="skeleton-line" style={{ width, height }} />
)

export const SkeletonCircle = ({ size = 40 }: SkeletonCircleProps) => (
  <div className="skeleton-circle" style={{ width: size, height: size }} />
)

/**
 * Skeleton that mirrors PageBlockchainCard layout 1:1:
 *  - .website-info-container (favicon 44 + url stack + 56 badge)
 *  - .cert-section "Intentions" (mono title + trust/distrust + 6 intention pills)
 *  - .cert-section "Context" (mono title + 2 topic pills)
 *  - ExtendedMetricsPanel preview (mono title + 5 progress rows)
 */
export const PageBlockchainSkeleton = () => (
  <div className="blockchain-skeleton">
    {/* Website header — mirrors .website-info-container */}
    <div className="blockchain-skeleton__website">
      <div className="blockchain-skeleton__favicon" />
      <div className="blockchain-skeleton__website-text">
        <SkeletonLine width="60%" height={14} />
        <SkeletonLine width="40%" height={10} />
      </div>
      <div className="blockchain-skeleton__badge" />
    </div>

    {/* Cert section "Intentions" */}
    <div className="blockchain-skeleton__section">
      <SkeletonLine width="38%" height={11} />
      <div className="blockchain-skeleton__pills">
        <div className="blockchain-skeleton__pill" style={{ width: 78 }} />
        <div className="blockchain-skeleton__pill" style={{ width: 96 }} />
        <div className="blockchain-skeleton__sep" />
        <div className="blockchain-skeleton__pill" style={{ width: 56 }} />
        <div className="blockchain-skeleton__pill" style={{ width: 76 }} />
        <div className="blockchain-skeleton__pill" style={{ width: 52 }} />
        <div className="blockchain-skeleton__pill" style={{ width: 90 }} />
        <div className="blockchain-skeleton__pill" style={{ width: 68 }} />
        <div className="blockchain-skeleton__pill" style={{ width: 60 }} />
      </div>
    </div>

    {/* Cert section "Context" */}
    <div className="blockchain-skeleton__section">
      <SkeletonLine width="22%" height={11} />
      <div className="blockchain-skeleton__pills">
        <div className="blockchain-skeleton__pill" style={{ width: 110, height: 36 }} />
        <div className="blockchain-skeleton__pill" style={{ width: 92, height: 36 }} />
      </div>
    </div>

    {/* Extended metrics preview — mirrors .intentions-stats-section */}
    <div className="blockchain-skeleton__metrics">
      <SkeletonLine width="55%" height={13} />
      <div className="blockchain-skeleton__bars">
        <div className="blockchain-skeleton__bar-row">
          <SkeletonLine width={64} height={20} />
          <div className="blockchain-skeleton__bar" />
          <SkeletonLine width={20} height={10} />
        </div>
        <div className="blockchain-skeleton__bar-row">
          <SkeletonLine width={68} height={20} />
          <div className="blockchain-skeleton__bar" />
          <SkeletonLine width={20} height={10} />
        </div>
        <div className="blockchain-skeleton__bar-row">
          <SkeletonLine width={58} height={20} />
          <div className="blockchain-skeleton__bar" />
          <SkeletonLine width={20} height={10} />
        </div>
        <div className="blockchain-skeleton__bar-row">
          <SkeletonLine width={72} height={20} />
          <div className="blockchain-skeleton__bar" />
          <SkeletonLine width={20} height={10} />
        </div>
        <div className="blockchain-skeleton__bar-row">
          <SkeletonLine width={50} height={20} />
          <div className="blockchain-skeleton__bar" />
          <SkeletonLine width={20} height={10} />
        </div>
      </div>
    </div>
  </div>
)
