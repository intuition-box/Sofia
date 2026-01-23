/**
 * SkillsTab Component
 * Analyzes on-chain activity and categorizes into skills using AI
 * XP and levels are calculated locally from verifiable on-chain data
 */

import { useEffect } from 'react';
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage';
import { useSkillsAnalysis } from '../../../hooks/useSkillsAnalysis';
import SkillCard from '../../ui/SkillCard';
import SofiaLoader from '../../ui/SofiaLoader';
import '../../styles/SkillsTab.css';

const SkillsTab = () => {
  const { walletAddress } = useWalletFromStorage();
  const {
    skills,
    summary,
    totalPositions,
    isLoading,
    error,
    analyzedAt,
    analyzeSkills,
    reset,
  } = useSkillsAnalysis();

  // Auto-analyze when wallet is available and no data yet
  useEffect(() => {
    if (walletAddress && !analyzedAt && !isLoading && !error) {
      analyzeSkills(walletAddress);
    }
  }, [walletAddress, analyzedAt, isLoading, error, analyzeSkills]);

  // Reset when wallet changes
  useEffect(() => {
    if (!walletAddress) {
      reset();
    }
  }, [walletAddress, reset]);

  const handleAnalyze = () => {
    if (walletAddress) {
      analyzeSkills(walletAddress);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="skills-tab">
        <div className="skills-loading">
          <SofiaLoader size={100} />
          <p className="skills-loading-text">Analyzing your on-chain activity...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="skills-tab">
        <div className="skills-error">
          <span className="skills-error-icon">!</span>
          <p className="skills-error-text">{error}</p>
          <button className="skills-error-retry" onClick={handleAnalyze}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No wallet state
  if (!walletAddress) {
    return (
      <div className="skills-tab">
        <div className="skills-empty">
          <span className="skills-empty-icon">?</span>
          <h3 className="skills-empty-title">Connect Your Wallet</h3>
          <p className="skills-empty-text">
            Connect your wallet to analyze your on-chain activity and discover your skills.
          </p>
        </div>
      </div>
    );
  }

  // Empty state (no skills found)
  if (skills.length === 0 && analyzedAt) {
    return (
      <div className="skills-tab">
        <div className="skills-header">
          <h2 className="skills-title">Skills</h2>
          <button
            className="skills-analyze-btn"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            Analyze
          </button>
        </div>
        <div className="skills-empty">
          <span className="skills-empty-icon">-</span>
          <h3 className="skills-empty-title">No Skills Found</h3>
          <p className="skills-empty-text">
            Start certifying your web activity to build your skill profile. Your on-chain certifications will be analyzed to discover your skills.
          </p>
        </div>
      </div>
    );
  }

  // Skills list
  return (
    <div className="skills-tab">
      <div className="skills-header">
        <h2 className="skills-title">Skills</h2>
        <button
          className="skills-analyze-btn"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="skills-summary">
          <p className="skills-summary-text">{summary}</p>
          <div className="skills-summary-meta">
            <span>{totalPositions} certifications analyzed</span>
            <span>{skills.length} skills identified</span>
          </div>
        </div>
      )}

      {/* Skills grid */}
      <div className="skills-grid">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
};

export default SkillsTab;
