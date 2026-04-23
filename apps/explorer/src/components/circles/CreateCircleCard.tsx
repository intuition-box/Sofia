/**
 * CreateCircleCard — "+ Create a circle" ghost card. Non-functional for
 * now (the feature depends on on-chain circle-creation support that
 * doesn't exist yet).
 */
export default function CreateCircleCard() {
  return (
    <button
      type="button"
      className="cr-card cr-card-new"
      // TODO: open a Create Circle drawer once the on-chain primitive lands.
      onClick={() => {}}
    >
      <span className="cr-card-new-plus">+</span>
      <span className="cr-card-new-label">Create a circle</span>
    </button>
  )
}
