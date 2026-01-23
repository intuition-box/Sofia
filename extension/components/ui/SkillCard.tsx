/**
 * SkillCard Component
 * Displays a skill with level, XP progress, and domain tags
 * Based on AI categorization of on-chain activity
 */

import type { Skill } from '../../types/skills';
import { getXpProgressPercent, getLevelColor } from '../../types/skills';

interface SkillCardProps {
  skill: Skill;
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

const SkillCard = ({ skill, onClick }: SkillCardProps) => {
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
  } = skill;

  const progressPercent = getXpProgressPercent(xp, level);
  const levelColor = getLevelColor(level);

  // Get dominant certification type for styling
  const dominantCert = Object.entries(certifications)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)[0];

  const dominantColor = dominantCert ? CERT_COLORS[dominantCert[0] as keyof typeof CERT_COLORS] : levelColor;

  return (
    <div
      className="skill-card"
      onClick={onClick}
      style={{
        borderColor: `${dominantColor}40`,
      }}
    >
      {/* Header */}
      <div className="skill-card-header">
        <div className="skill-card-title-section">
          <h3 className="skill-card-title">{name}</h3>
          {confidence < 80 && (
            <span className="skill-confidence-badge" title={reasoning}>
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
      <div className="skill-card-progress">
        <div className="skill-progress-bar-container">
          <div
            className="skill-progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${dominantColor}, ${levelColor})`,
            }}
          />
        </div>
        <div className="skill-progress-labels">
          <span className="skill-xp-current">{xp} XP</span>
          <span className="skill-xp-next">
            {xpToNextLevel > 0 ? `${xpToNextLevel} to LVL ${level + 1}` : 'Max!'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="skill-card-stats">
        <div className="skill-stat">
          <span className="skill-stat-value">{totalCertifications}</span>
          <span className="skill-stat-label">Certs</span>
        </div>
        <div className="skill-stat">
          <span className="skill-stat-value">{domains.length}</span>
          <span className="skill-stat-label">Domains</span>
        </div>
      </div>

      {/* Certification breakdown */}
      <div className="skill-cert-breakdown">
        {Object.entries(certifications)
          .filter(([_, count]) => count > 0)
          .map(([type, count]) => (
            <div
              key={type}
              className="skill-cert-item"
              style={{ color: CERT_COLORS[type as keyof typeof CERT_COLORS] }}
            >
              <span className="skill-cert-dot" style={{ backgroundColor: CERT_COLORS[type as keyof typeof CERT_COLORS] }} />
              <span className="skill-cert-type">{type}</span>
              <span className="skill-cert-count">{count}</span>
            </div>
          ))}
      </div>

      {/* Domain tags */}
      <div className="skill-domains">
        {domains.slice(0, 4).map((domain) => (
          <div key={domain} className="skill-domain-tag">
            <img
              src={getFaviconUrl(domain)}
              alt={domain}
              className="skill-domain-favicon"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="skill-domain-name">{domain}</span>
          </div>
        ))}
        {domains.length > 4 && (
          <span className="skill-domains-more">+{domains.length - 4}</span>
        )}
      </div>

      {/* Reasoning tooltip */}
      {reasoning && (
        <div className="skill-reasoning" title={reasoning}>
          <span className="skill-reasoning-icon">i</span>
          <span className="skill-reasoning-text">{reasoning}</span>
        </div>
      )}
    </div>
  );
};

export default SkillCard;
