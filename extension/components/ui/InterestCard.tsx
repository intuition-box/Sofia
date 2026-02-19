/**
 * InterestCard Component
 * Displays an interest with a semi-circular gauge, XP progress, cert/domain breakdown
 * Redesigned to match dark card UI with level gauge
 */

import type { Interest } from '../../types/interests';
import { getXpProgressPercent, getLevelColor } from '../../types/interests';
import { getFaviconUrl } from '~/lib/utils';

interface InterestCardProps {
  interest: Interest;
  onClick?: () => void;
}

// Certification type colors
const CERT_COLORS: Record<string, string> = {
  work: '#3B82F6',
  learning: '#10B981',
  fun: '#F59E0B',
  inspiration: '#8B5CF6',
  buying: '#EF4444',
};

// Semi-circular gauge SVG component
const LevelGauge = ({ progressPercent, levelColor }: { progressPercent: number; levelColor: string }) => {
  const gradId = `gauge-${levelColor.replace('#', '')}`;
  const radius = 50;
  const cx = 60;
  const cy = 58;
  const halfCircumference = Math.PI * radius;
  const filledLength = (progressPercent / 100) * halfCircumference;
  const dashOffset = halfCircumference - filledLength;

  return (
    <svg viewBox="0 0 120 66" className="interest-gauge-svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={levelColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={levelColor} stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Background arc */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Progress arc */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={halfCircumference}
        strokeDashoffset={dashOffset}
      />
      {/* Tick marks */}
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const angle = Math.PI - tick * Math.PI;
        const innerR = radius - 10;
        const outerR = radius - 6;
        const x1 = cx + innerR * Math.cos(angle);
        const y1 = cy - innerR * Math.sin(angle);
        const x2 = cx + outerR * Math.cos(angle);
        const y2 = cy - outerR * Math.sin(angle);
        return (
          <line
            key={tick}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
};

const InterestCard = ({ interest, onClick }: InterestCardProps) => {
  const {
    name,
    domains,
    level,
    xp,
    xpToNextLevel,
    certifications,
    reasoning,
  } = interest;

  const progressPercent = getXpProgressPercent(xp, level);
  const levelColor = getLevelColor(level);

  // Get dominant certification type for accent
  const dominantCert = Object.entries(certifications)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)[0];
  const accentColor = dominantCert ? CERT_COLORS[dominantCert[0]] : levelColor;


  return (
    <div
      className="interest-card"
      onClick={onClick}
      style={{ '--accent-color': accentColor, '--level-color': levelColor } as React.CSSProperties}
    >
      {/* Card title */}
      <h3 className="interest-card-title">{name}</h3>

      {/* Level gauge + badge */}
      <div className="interest-gauge-container">
        <LevelGauge progressPercent={progressPercent} levelColor={levelColor} />
        <div className="interest-level-badge">
          <svg viewBox="0 0 198 142" className="interest-level-badge-bg">
            <path
              d="M97.3165 0.496638C98.6954 -0.168559 100.303 -0.165385 101.679 0.505274L195.19 46.0741C196.909 46.9118 198 48.6566 198 50.5688V90.3461C198 92.2436 196.926 93.9776 195.227 94.8227L101.716 141.341C100.319 142.036 98.679 142.039 97.2798 141.35L2.79102 94.8177C1.08223 93.9762 0 92.2369 0 90.3322V50.5826C0 48.6632 1.09876 46.9132 2.82751 46.0793L97.3165 0.496638Z"
              fill={levelColor}
            />
          </svg>
          <span className="interest-level-badge-text">LVL {level}</span>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="interest-xp-row">
        <span className="interest-xp-label">XP</span>
        <div className="interest-xp-bar-wrap">
          <div className="interest-xp-bar-bg">
            <div
              className="interest-xp-bar-fill"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${levelColor})`,
              }}
            />
          </div>
        </div>
        <span className="interest-xp-next-label">
          {xpToNextLevel > 0 ? 'Next Level' : 'Max!'}
        </span>
      </div>

      {/* Domain favicons */}
      <div className="interest-domains-row">
        {domains.slice(0, 3).map((domain) => (
          <img
            key={domain}
            src={getFaviconUrl(domain)}
            alt={domain}
            title={domain}
            className="interest-domain-icon"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ))}
        {domains.length > 3 && (
          <span className="interest-domain-more">+{domains.length - 3}</span>
        )}
      </div>

      {/* Activity Summary — always pushed to bottom */}
      <div className="interest-activity-summary">
        <span className="interest-activity-title">Activity Summary</span>
        <p className="interest-activity-text">
          {reasoning || 'No activity summary available.'}
        </p>
      </div>
    </div>
  );
};

export default InterestCard;
