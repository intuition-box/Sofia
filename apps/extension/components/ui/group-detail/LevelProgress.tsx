/**
 * LevelProgress Component
 * Fully automatic level bar for the GroupDetailView: it tracks the on-chain
 * certification count up and down. No Gold, no manual "Level Up" action.
 */

export interface LevelProgressProps {
  currentLevel: number
  progressPercent: number
  xpToNextLevel: number
  loading: boolean
}

function LevelProgress({
  currentLevel,
  progressPercent,
  xpToNextLevel,
  loading
}: LevelProgressProps) {
  return (
    <div className="level-progress-section">
      <div className="level-progress-header">
        <span className="level-label">Level {currentLevel}</span>
        <span className="level-xp">
          {loading
            ? "..."
            : xpToNextLevel > 0
              ? `${xpToNextLevel} cert${xpToNextLevel > 1 ? "s" : ""} to Level ${currentLevel + 1}`
              : "Max level!"}
        </span>
      </div>
      <div className="progress-bar-container level-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: `${progressPercent}%`,
            background: "var(--ds-accent)"
          }}
        />
      </div>
    </div>
  )
}

export default LevelProgress
