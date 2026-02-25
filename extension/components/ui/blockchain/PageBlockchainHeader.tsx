/**
 * PageBlockchainHeader
 * Displays website info (favicon, URL, title) with StarBorder wrapper
 * and discovery badge. Also shows restricted page warning.
 */

import React from "react"
import StarBorder from "../StarBorder"
import "../../styles/PageBlockchainHeader.css"
import pioneerBadge from "../img/badges/pioneer.png"
import explorerBadge from "../img/badges/explorer.png"
import contributorBadge from "../img/badges/contributor.png"
import type { DiscoveryStatus } from "~/types/discovery"

const badgeImages: Record<string, string> = {
  pioneer: pioneerBadge,
  explorer: explorerBadge,
  contributor: contributorBadge
}

interface PageBlockchainHeaderProps {
  currentUrl: string
  pageTitle: string | null
  faviconUrl: string | null
  faviconError: boolean
  totalCertifications: number
  discoveryStatus: DiscoveryStatus
  certificationRank: number | null
  userHasCertified: boolean
  isRestricted: boolean
  restrictionMessage: string | null
  onToggleMetrics: () => void
  onNavigateDiscovery: () => void
}

const getPotentialBadgeType = (total: number) => {
  if (total === 0) return "pioneer"
  if (total < 10) return "explorer"
  return "contributor"
}

const BADGE_COLORS: Record<string, string> = {
  pioneer: "#FFD700",
  explorer: "#3B82F6",
  contributor: "#8B5CF6"
}

const PageBlockchainHeader: React.FC<PageBlockchainHeaderProps> = ({
  currentUrl,
  pageTitle,
  faviconUrl,
  totalCertifications,
  discoveryStatus,
  certificationRank,
  userHasCertified,
  isRestricted,
  restrictionMessage,
  onToggleMetrics,
  onNavigateDiscovery
}) => {
  // Si l'user a certifié → utiliser son statut réel, sinon → statut potentiel
  const badgeType = userHasCertified && discoveryStatus
    ? discoveryStatus.toLowerCase()
    : getPotentialBadgeType(totalCertifications)

  return (
    <>
      <StarBorder
        as="div"
        color={BADGE_COLORS[badgeType] ?? "#FFD700"}
        speed="10s"
        thickness={5}
      >
        <div
          className="website-info-container clickable"
          onClick={onToggleMetrics}
          style={{ cursor: "pointer" }}
        >
          <div className="website-icon-container">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt="Site favicon"
                className="website-icon website-favicon"
              />
            ) : (
              <svg
                className="website-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="4" fill="white" />
                <circle cx="6" cy="6" r="2" fill="white" />
                <circle cx="18" cy="6" r="2" fill="white" />
                <circle cx="6" cy="18" r="2" fill="white" />
                <circle cx="18" cy="18" r="2" fill="white" />
                <line
                  x1="12"
                  y1="12"
                  x2="6"
                  y2="6"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <line
                  x1="12"
                  y1="12"
                  x2="18"
                  y2="6"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <line
                  x1="12"
                  y1="12"
                  x2="6"
                  y2="18"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <line
                  x1="12"
                  y1="12"
                  x2="18"
                  y2="18"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </div>
          <div className="website-url-container">
            <span className="website-url-text">
              {pageTitle || new URL(currentUrl).hostname}
            </span>
            <span className="website-url-full">
              {new URL(currentUrl).hostname}
            </span>
          </div>

          {/* Discovery Badge */}
          <div
            className={`discovery-badge-compact clickable badge-${badgeType}`}
            onClick={onNavigateDiscovery}
            title="View discovery stats"
          >
            <img
              src={badgeImages[badgeType]}
              alt={badgeType}
              className="discovery-badge-img"
            />
            {userHasCertified && certificationRank != null ? (
              <span className="discovery-badge-rank">
                #{certificationRank}
              </span>
            ) : totalCertifications > 0 ? (
              <span className="discovery-badge-rank">
                #{totalCertifications + 1}
              </span>
            ) : null}
          </div>
        </div>
      </StarBorder>

      {isRestricted && (
        <div className="restricted-page-warning">
          <span className="warning-icon">⚠️</span>
          <div className="warning-content">
            <strong>Page not certifiable</strong>
            <p>{restrictionMessage || "This page cannot be certified"}</p>
            <p className="restricted-page-hint">
              Navigate to an HTTPS page to sign transactions — e.g.{" "}
              <a
                href="https://sofia.intuition.box/values/"
                target="_blank"
                rel="noopener noreferrer"
              >
                sofia.intuition.box/values
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default PageBlockchainHeader
