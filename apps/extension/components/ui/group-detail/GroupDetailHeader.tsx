/**
 * GroupDetailHeader Component
 * Header for the GroupDetailView: back button, domain title, and the
 * Explorer link aligned to the right of the same line.
 */

import { getFaviconUrl, getProfilePlatformUrl } from "~/lib/utils"

import Breadcrumb from "../Breadcrumb"

export interface GroupDetailHeaderProps {
  domain: string
  /** Navigate back up to the Echoes grid — wired to the "Echoes" crumb. */
  onBack: () => void
}

function GroupDetailHeader({ domain, onBack }: GroupDetailHeaderProps) {
  return (
    <div className="group-detail-header">
      <div className="group-detail-title-section">
        <img
          src={getFaviconUrl(domain, 64)}
          alt=""
          className="group-detail-favicon"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
        <Breadcrumb
          crumbs={[{ label: "Echoes", onClick: onBack }, { label: domain }]}
        />
        <button
          className="sort-btn gm-manage-btn echoes-open-sofia-btn"
          onClick={() =>
            chrome.tabs.create({
              url: getProfilePlatformUrl(domain),
              active: true
            })
          }
          title={`View ${domain} on Explorer`}>
          View on Explorer ↗
        </button>
      </div>
    </div>
  )
}

export default GroupDetailHeader
