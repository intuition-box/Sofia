/**
 * PageBlockchainHeader
 * Displays website info (favicon, URL, title) with StarBorder wrapper
 * and discovery badge. Also shows restricted page warning.
 */

import React from "react"
import StarBorder from "../StarBorder"

interface PageBlockchainHeaderProps {
  currentUrl: string
  pageTitle: string | null
  faviconUrl: string | null
  faviconError: boolean
  totalCertifications: number
  isRestricted: boolean
  restrictionMessage: string | null
  onToggleMetrics: () => void
  onNavigateDiscovery: () => void
}

const getBadgeType = (total: number) => {
  if (total === 0) return "pioneer"
  if (total < 10) return "explorer"
  return "contributor"
}

const getBadgeColor = (total: number) => {
  if (total === 0) return "#FFD700"
  if (total < 10) return "#3B82F6"
  return "#8B5CF6"
}

const PageBlockchainHeader: React.FC<PageBlockchainHeaderProps> = ({
  currentUrl,
  pageTitle,
  faviconUrl,
  totalCertifications,
  isRestricted,
  restrictionMessage,
  onToggleMetrics,
  onNavigateDiscovery
}) => {
  const badgeType = getBadgeType(totalCertifications)

  return (
    <>
      <StarBorder
        as="div"
        color={getBadgeColor(totalCertifications)}
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
            <svg
              className="discovery-badge-svg"
              viewBox="0 0 533 533"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="badge-fill-pioneer"
                  x1="266"
                  y1="0"
                  x2="266"
                  y2="533"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#F5C842" />
                  <stop offset="0.5" stopColor="#C88A2B" />
                  <stop offset="1" stopColor="#8B5E1A" />
                </linearGradient>
                <linearGradient
                  id="badge-fill-explorer"
                  x1="266"
                  y1="0"
                  x2="266"
                  y2="533"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#7BB3FF" />
                  <stop offset="0.5" stopColor="#4A8FE7" />
                  <stop offset="1" stopColor="#2557A7" />
                </linearGradient>
                <linearGradient
                  id="badge-fill-contributor"
                  x1="266"
                  y1="0"
                  x2="266"
                  y2="533"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#C4A8FF" />
                  <stop offset="0.5" stopColor="#9B7ED8" />
                  <stop offset="1" stopColor="#6B3FA0" />
                </linearGradient>
                <linearGradient
                  id="badge-stroke"
                  x1="266.468"
                  y1="-7.53223"
                  x2="266.468"
                  y2="540.468"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="white" stopOpacity="0.6" />
                  <stop offset="1" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M243.446 7.78125C257.651 -0.593282 275.284 -0.593284 289.489 7.78125C300.039 14.0007 312.556 15.9832 324.512 13.3281C340.609 9.7531 357.379 15.2016 368.301 27.5557C376.412 36.7309 387.705 42.485 399.896 43.6543C416.31 45.2287 430.575 55.5931 437.145 70.7178C442.024 81.9503 450.985 90.9118 462.218 95.791C477.342 102.361 487.707 116.626 489.281 133.04C490.451 145.231 496.205 156.523 505.38 164.635C517.734 175.557 523.182 192.326 519.607 208.424C516.952 220.379 518.935 232.897 525.154 243.446C533.529 257.651 533.529 275.284 525.154 289.489C518.935 300.039 516.952 312.556 519.607 324.512C523.182 340.609 517.734 357.379 505.38 368.301C496.205 376.412 490.451 387.705 489.281 399.896C487.707 416.31 477.342 430.575 462.218 437.145C450.985 442.024 442.024 450.985 437.145 462.218C430.575 477.342 416.31 487.707 399.896 489.281C387.705 490.451 376.412 496.205 368.301 505.38C357.379 517.734 340.609 523.182 324.512 519.607C312.556 516.952 300.039 518.935 289.489 525.154C275.284 533.529 257.651 533.529 243.446 525.154C232.897 518.935 220.379 516.952 208.424 519.607C192.326 523.182 175.557 517.734 164.635 505.38C156.523 496.205 145.231 490.451 133.04 489.281C116.626 487.707 102.361 477.342 95.791 462.218C90.9118 450.985 81.9503 442.024 70.7178 437.145C55.5931 430.575 45.2287 416.31 43.6543 399.896C42.485 387.705 36.7309 376.412 27.5557 368.301C15.2016 357.379 9.7531 340.609 13.3281 324.512C15.9832 312.556 14.0007 300.039 7.78125 289.489C-0.593284 275.284 -0.593282 257.651 7.78125 243.446C14.0007 232.897 15.9832 220.379 13.3281 208.424C9.7531 192.326 15.2016 175.557 27.5557 164.635C36.7309 156.523 42.485 145.231 43.6543 133.04C45.2287 116.626 55.5931 102.361 70.7178 95.791C81.9503 90.9118 90.9118 81.9503 95.791 70.7178C102.361 55.5931 116.626 45.2287 133.04 43.6543C145.231 42.485 156.523 36.7309 164.635 27.5557C175.557 15.2016 192.326 9.7531 208.424 13.3281C220.379 15.9832 232.897 14.0007 243.446 7.78125Z"
                fill={`url(#badge-fill-${badgeType})`}
                stroke="url(#badge-stroke)"
                strokeWidth="3"
              />
            </svg>
            <div className="discovery-badge-text">
              <span className="badge-rank">
                {totalCertifications === 0 && "#1"}
                {totalCertifications > 0 &&
                  totalCertifications < 10 &&
                  `#${totalCertifications + 1}`}
                {totalCertifications >= 10 && totalCertifications}
              </span>
              <span className="badge-status">
                {totalCertifications === 0 && "Pioneer"}
                {totalCertifications > 0 &&
                  totalCertifications < 10 &&
                  "Explorer"}
                {totalCertifications >= 10 && "Contributor"}
              </span>
            </div>
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
