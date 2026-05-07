/**
 * CreateCircleCard — "+ Create a circle" ghost card. Opens the
 * CreateCircleDrawer; the actual on-chain creation primitive doesn't
 * exist yet so the drawer's submit handler is a no-op for now.
 */
interface CreateCircleCardProps {
  onClick: () => void
}

export default function CreateCircleCard({ onClick }: CreateCircleCardProps) {
  return (
    <button
      type="button"
      className="cr-card cr-card-new"
      onClick={onClick}
    >
      <span className="cr-card-new-plus">+</span>
      <span className="cr-card-new-label">Create a circle</span>
    </button>
  )
}
