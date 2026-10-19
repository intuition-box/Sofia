import { useEffect, useState } from "react"

import { usePlatformPool } from "~/hooks"
import { MAX_PLATFORM_PERCENTAGE } from "~/lib/services"

const STEP = 1000 // 1%

/**
 * Settings section: share of each stake that goes to the page's platform
 * (GitHub, YouTube…). Taken out of the stake, never added on top; the
 * shares stay yours. Applies to the cart and to right-click publishing.
 */
const PlatformPoolSettings = () => {
  const { percentage, setUserPercentage } = usePlatformPool()
  const [draft, setDraft] = useState(percentage)

  useEffect(() => setDraft(percentage), [percentage])

  return (
    <div className="settings-section">
      <div className="settings-item">
        <div className="settings-item-content">
          <span>Platform pool · {draft / 1000}%</span>
          <span className="settings-item-description">
            Share of your stake that also backs the page's platform (GitHub,
            YouTube…). Taken out of your stake, not added on top — the position
            stays yours.
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={MAX_PLATFORM_PERCENTAGE}
          step={STEP}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          onMouseUp={() => setUserPercentage(draft)}
          onKeyUp={() => setUserPercentage(draft)}
          onTouchEnd={() => setUserPercentage(draft)}
          aria-label="Platform pool share"
          className="settings-range"
        />
      </div>
    </div>
  )
}

export default PlatformPoolSettings
