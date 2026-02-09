/**
 * InterestCard Component
 * Displays an interest with level, XP progress, and domain tags
 * Based on AI categorization of on-chain activity
 */

import type { Interest } from '../../types/interests';
import { getXpProgressPercent, getLevelColor } from '../../types/interests';

interface InterestCardProps {
  interest: Interest;
  onClick?: () => void;
}

// Get favicon URL from domain
const getFaviconUrl = (domain: string): string => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

// Certification type colors
const CERT_COLORS = {
  work: '#3B82F6',      // blue
  learning: '#10B981',  // green
  fun: '#F59E0B',       // yellow/orange
  inspiration: '#8B5CF6', // purple
  buying: '#EF4444'     // red
};

const InterestCard = ({ interest, onClick }: InterestCardProps) => {
  const {
    name,
    domains,
    level,
    xp,
    xpToNextLevel,
    totalCertifications,
    certifications,
    confidence,
    reasoning,
  } = interest;

  const progressPercent = getXpProgressPercent(xp, level);
  const levelColor = getLevelColor(level);

  // Get dominant certification type for styling
  const dominantCert = Object.entries(certifications)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)[0];

  const dominantColor = dominantCert ? CERT_COLORS[dominantCert[0] as keyof typeof CERT_COLORS] : levelColor;

  return (
    <div
      className="interest-card"
      onClick={onClick}
      style={{
        borderColor: `${dominantColor}40`,
      }}
    >
      {/* Header */}
      <div className="interest-card-header">
        <div className="interest-card-title-section">
          <h3 className="interest-card-title">{name}</h3>
          {confidence < 80 && (
            <span className="interest-confidence-badge" title={reasoning}>
              {confidence}%
            </span>
          )}
        </div>
        <span
          className={`level-badge level-${Math.min(level, 10)}`}
          style={{ backgroundColor: levelColor }}
        >
          LVL {level}
        </span>
      </div>

      {/* XP Progress */}
      <div className="interest-card-progress">
        <div className="interest-progress-bar-container">
          <div
            className="interest-progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${dominantColor}, ${levelColor})`,
            }}
          />
        </div>
        <div className="interest-progress-labels">
          <span className="interest-xp-current">{xp} XP</span>
          <span className="interest-xp-next">
            {xpToNextLevel > 0 ? `${xpToNextLevel} to LVL ${level + 1}` : 'Max!'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="interest-card-stats">
        <div className="interest-stat">
          <span className="interest-stat-value">{totalCertifications}</span>
          <span className="interest-stat-label">Certs</span>
        </div>
        <div className="interest-stat">
          <span className="interest-stat-value">{domains.length}</span>
          <span className="interest-stat-label">Domains</span>
        </div>
      </div>

      {/* Certification breakdown */}
      <div className="interest-cert-breakdown">
        {Object.entries(certifications)
          .filter(([_, count]) => count > 0)
          .map(([type, count]) => (
            <div
              key={type}
              className="interest-cert-item"
              style={{ color: CERT_COLORS[type as keyof typeof CERT_COLORS] }}
            >
              <span className="interest-cert-dot" style={{ backgroundColor: CERT_COLORS[type as keyof typeof CERT_COLORS] }} />
              <span className="interest-cert-type">{type}</span>
              <span className="interest-cert-count">{count}</span>
            </div>
          ))}
      </div>

      {/* Domain tags */}
      <div className="interest-domains">
        {domains.slice(0, 4).map((domain) => (
          <div key={domain} className="interest-domain-tag">
            <img
              src={getFaviconUrl(domain)}
              alt={domain}
              className="interest-domain-favicon"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="interest-domain-name">{domain}</span>
          </div>
        ))}
        {domains.length > 4 && (
          <span className="interest-domains-more">+{domains.length - 4}</span>
        )}
      </div>

      {/* Reasoning tooltip */}
      {reasoning && (
        <div className="interest-reasoning" title={reasoning}>
          <span className="interest-reasoning-icon">i</span>
          <span className="interest-reasoning-text">{reasoning}</span>
        </div>
      )}
    </div>
  );
};

export default InterestCard;
