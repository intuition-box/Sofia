import "../styles/Skeleton.css"

interface SkeletonLineProps {
  width?: string
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

/** Skeleton that mirrors PageBlockchainCard layout */
export const PageBlockchainSkeleton = () => (
  <div className="blockchain-skeleton">
    {/* Header skeleton */}
    <div className="blockchain-skeleton__header">
      <SkeletonCircle size={44} />
      <div className="blockchain-skeleton__header-text">
        <SkeletonLine width="70%" height={14} />
        <SkeletonLine width="45%" height={10} />
      </div>
    </div>

    {/* Trust/Distrust buttons skeleton */}
    <div className="blockchain-skeleton__buttons">
      <div className="blockchain-skeleton__btn" />
      <div className="blockchain-skeleton__btn" />
    </div>

    {/* Intention pills skeleton */}
    <div className="blockchain-skeleton__pills">
      <div className="blockchain-skeleton__pill" />
      <div className="blockchain-skeleton__pill" />
      <div className="blockchain-skeleton__pill" />
      <div className="blockchain-skeleton__pill" />
      <div className="blockchain-skeleton__pill" />
      <div className="blockchain-skeleton__pill" />
    </div>
  </div>
)
