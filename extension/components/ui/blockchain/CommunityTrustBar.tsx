/**
 * CommunityTrustBar
 * Displays trust/distrust bar with counts and ratio
 */

import React from "react"
import type { CredibilityAnalysis } from "~/hooks/useCredibilityAnalysis"
import "../../styles/CommunityTrustBar.css"

interface CommunityTrustBarProps {
  analysis: CredibilityAnalysis
}

const CommunityTrustBar: React.FC<CommunityTrustBarProps> = ({ analysis }) => {
  return (
    <div className="trust-support-section">
      <div className="section-header">
        <span className="section-title">Community Support</span>
        <span
          className="support-ratio"
          style={{ color: analysis.barColor }}
        >
          {analysis.totalSupport > 0
            ? `${analysis.trustRatio}% Trust`
            : "No votes yet"}
        </span>
      </div>

      <div className="trust-distrust-bar">
        <div
          className="trust-fill"
          style={{
            width: `${analysis.trustRatio}%`,
            background: "linear-gradient(90deg, #22c55e 0%, #84cc16 100%)"
          }}
        />
        <div
          className="distrust-fill"
          style={{
            width: `${100 - analysis.trustRatio}%`,
            background: "linear-gradient(90deg, #f97316 0%, #ef4444 100%)"
          }}
        />
      </div>

      <div className="support-counts">
        <span className="trust-count">
          <svg
            className="count-icon-svg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="7" r="4" fill="currentColor" />
            <path
              d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {analysis.trustCount} people
        </span>
        <span className="distrust-count">
          <svg
            className="count-icon-svg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="7" r="4" fill="currentColor" />
            <path
              d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {analysis.distrustCount} people
        </span>
      </div>
    </div>
  )
}

export default CommunityTrustBar
