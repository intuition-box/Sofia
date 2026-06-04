/**
 * GroupDetailHeader Component
 * Header for the GroupDetailView: back button, domain title, and the
 * Explorer link aligned to the right of the same line.
 */

import { getFaviconUrl, getProfilePlatformUrl } from "~/lib/utils"

export interface GroupDetailHeaderProps {
  domain: string
  onBack: () => void
}

function GroupDetailHeader({ domain, onBack }: GroupDetailHeaderProps) {
  return (
    <div className="group-detail-header">
      <button className="pf-btn back-btn" onClick={onBack}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to my Echoes
      </button>
      <div className="group-detail-title-section">
        <img
          src={getFaviconUrl(domain, 64)}
          alt=""
          className="group-detail-favicon"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
        <h2 className="group-detail-domain">
          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${domain}`}>
            {domain}
          </a>
        </h2>
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
