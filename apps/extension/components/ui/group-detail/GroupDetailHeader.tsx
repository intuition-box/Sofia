/**
 * GroupDetailHeader Component
 *
 * Unified header card for the GroupDetailView (ported from the Claude Design
 * "Echoes Domain" handoff): a mono breadcrumb, then a single bordered card
 * holding the domain identity row (favicon tile + domain + "View on Explorer")
 * and a hairline-separated level-progress row. The level bar lives here now so
 * the whole above-feed identity reads as one harmonious card.
 */

import { getFaviconUrl, getProfilePlatformUrl } from "~/lib/utils"

import "../../styles/EchoesDomainHeader.css"

export interface GroupDetailHeaderProps {
  domain: string
  /** Navigate back up to the Echoes grid — wired to the "Echoes" crumb. */
  onBack: () => void
  /** Level data (fully automatic from on-chain certification count). */
  currentLevel: number
  progressPercent: number
  xpToNextLevel: number
  loading: boolean
}

const IcExt = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
)

function GroupDetailHeader({
  domain,
  onBack,
  currentLevel,
  progressPercent,
  xpToNextLevel,
  loading
}: GroupDetailHeaderProps) {
  return (
    <>
      <div className="ecrumb pagecrumb">
        <a onClick={onBack}>Echoes</a>
        <span className="sep">›</span>
        <span className="ecrumb-current">{domain}</span>
      </div>

      <div className="ehead">
        <div className="ehead-top">
          <span className="efav">
            <img
              src={getFaviconUrl(domain, 64)}
              alt=""
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </span>
          <span className="edomain">{domain}</span>
          <a
            className="eexplorer"
            onClick={() =>
              chrome.tabs.create({
                url: getProfilePlatformUrl(domain),
                active: true
              })
            }
            title={`View ${domain} on Explorer`}>
            View on Explorer {IcExt}
          </a>
        </div>

        <div className="ehead-lvlbar">
          <span className="lvl-tag">Level {currentLevel}</span>
          <div className="lvl-track">
            <div className="lvl-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="lvl-next">
            {loading
              ? "…"
              : xpToNextLevel > 0
                ? (
                    <>
                      <b>{xpToNextLevel}</b> cert{xpToNextLevel > 1 ? "s" : ""} to
                      Level {currentLevel + 1}
                    </>
                  )
                : "Max level"}
          </span>
        </div>
      </div>
    </>
  )
}

export default GroupDetailHeader
