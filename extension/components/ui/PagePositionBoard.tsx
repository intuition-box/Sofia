import type { RankedPosition } from "~/lib/utils"
import Avatar from "./Avatar"
import "../styles/PagePositionBoard.css"

interface PagePositionBoardProps {
  positions: RankedPosition[]
  userPosition: RankedPosition | null
  totalPositions: number
  variant: "compact" | "expanded"
  loading?: boolean
  maxDisplay?: number
}

const PagePositionBoard = ({
  positions,
  userPosition,
  totalPositions,
  variant,
  loading = false,
  maxDisplay = 5
}: PagePositionBoardProps) => {
  if (totalPositions === 0 && !loading) return null

  const displayed = positions.slice(0, maxDisplay)
  const remaining = totalPositions - displayed.length

  // If user is beyond maxDisplay, show them at the bottom
  const userBeyondList =
    userPosition &&
    userPosition.rank > maxDisplay &&
    !displayed.some((p) => p.isCurrentUser)

  return (
    <div
      className={`position-board position-board--${variant}`}>
      <div className="position-board__header">
        <span className="position-board__title">Certifiers</span>
        <span className="position-board__count">
          {totalPositions}
        </span>
      </div>

      {loading && totalPositions === 0 && (
        <div className="position-board__loading">
          Loading certifiers...
        </div>
      )}

      <ul className="position-board__list">
        {displayed.map((pos) => (
          <li
            key={pos.accountId}
            className={`position-board__item${pos.isCurrentUser ? " position-board__item--current-user" : ""}${pos.isInTrustCircle && !pos.isCurrentUser ? " position-board__item--trust-circle" : ""}`}>
            <span className="position-board__rank">
              #{pos.rank}
            </span>
            <Avatar
              imgSrc={pos.avatar ?? undefined}
              name={pos.accountId}
              size="small"
              avatarClassName="position-board__avatar"
            />
            <span className="position-board__label">
              {pos.displayLabel}
            </span>
            {pos.isCurrentUser && (
              <span className="position-board__you-tag">
                You
              </span>
            )}
            {pos.isInTrustCircle && !pos.isCurrentUser && (
              <span className="position-board__circle-tag">
                Circle
              </span>
            )}
            <span
              className={`position-board__badge position-board__badge--${pos.status.toLowerCase()}`}>
              {pos.status}
            </span>
          </li>
        ))}

        {userBeyondList && userPosition && (
          <li className="position-board__item position-board__item--current-user">
            <span className="position-board__rank">
              #{userPosition.rank}
            </span>
            <Avatar
              imgSrc={userPosition.avatar ?? undefined}
              name={userPosition.accountId}
              size="small"
              avatarClassName="position-board__avatar"
            />
            <span className="position-board__label">
              {userPosition.displayLabel}
            </span>
            <span className="position-board__you-tag">
              You
            </span>
            <span
              className={`position-board__badge position-board__badge--${userPosition.status.toLowerCase()}`}>
              {userPosition.status}
            </span>
          </li>
        )}
      </ul>

      {remaining > 0 && !userBeyondList && (
        <div className="position-board__more">
          +{remaining} more
        </div>
      )}
    </div>
  )
}

export default PagePositionBoard
