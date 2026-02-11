/**
 * InterestTab Component
 * Analyzes on-chain activity and categorizes into interests using AI
 * XP and levels are calculated locally from verifiable on-chain data
 */

import { useEffect } from 'react';
import { useWalletFromStorage, useInterestAnalysis, useDiscoveryScore } from '../../../hooks';
import { INTENTION_LABELS, type IntentionPurpose } from '../../../types/discovery';
import InterestCard from '../../ui/InterestCard';
import SofiaLoader from '../../ui/SofiaLoader';
import { createHookLogger } from '../../../lib/utils/logger';
import '../../styles/InterestTab.css';

const logger = createHookLogger('InterestTab');

const INTENTION_GRADIENTS: Record<IntentionPurpose, string> = {
  for_work: 'linear-gradient(90deg, #1E40AF, #60A5FA)',
  for_learning: 'linear-gradient(90deg, #065F46, #34D399)',
  for_fun: 'linear-gradient(90deg,rgb(146, 122, 14), #FBBF24)',
  for_inspiration: 'linear-gradient(90deg, #5B21B6, #C4B5FD)',
  for_buying: 'linear-gradient(90deg,rgb(153, 84, 27), #F87171)'
};

const InterestTab = () => {
  const { walletAddress } = useWalletFromStorage();
  const {
    interests,
    summary,
    totalPositions,
    isLoading,
    error,
    analyzedAt,
    analyzeInterests,
    reset,
    loadFromCache,
  } = useInterestAnalysis();
  const { stats: discoveryStats } = useDiscoveryScore();

  const hasResults = interests.length > 0;
  const maxIntention = discoveryStats
    ? Math.max(...Object.values(discoveryStats.intentionBreakdown), 1)
    : 1;

  // Load cached data on mount
  useEffect(() => {
    if (walletAddress) {
      loadFromCache(walletAddress);
    }
  }, [walletAddress, loadFromCache]);

  // Check for trigger flag from "Sort Interest" button in Echoes tab
  useEffect(() => {
    const shouldTrigger = localStorage.getItem('triggerInterestAnalysis');
    if (shouldTrigger === 'true' && walletAddress && !isLoading) {
      localStorage.removeItem('triggerInterestAnalysis');
      analyzeInterests(walletAddress);
    }
  }, [walletAddress, isLoading, analyzeInterests]);

  // Reset when wallet changes
  useEffect(() => {
    if (!walletAddress) {
      reset();
    }
  }, [walletAddress, reset]);

  const handleAnalyze = () => {
    if (walletAddress) {
      analyzeInterests(walletAddress);
    }
  };

  // Intentions Breakdown (always visible when discoveryStats exists)
  const intentionsBreakdown = discoveryStats && (
    <div className="intentions-breakdown-section">
      <h2 className="intentions-breakdown-title">Intentions Breakdown</h2>
      <div className="intentions-breakdown-list">
        {(Object.entries(discoveryStats.intentionBreakdown) as [IntentionPurpose, number][]).map(
          ([intention, count]) => (
            <div key={intention} className="intention-row">
              <span className="intention-label">{INTENTION_LABELS[intention]}</span>
              <div className="intention-bar-container">
                <div
                  className="intention-bar"
                  style={{
                    width: `${Math.max((count / maxIntention) * 100, 3)}%`,
                    background: INTENTION_GRADIENTS[intention]
                  }}
                />
              </div>
              <span className="intention-value">{count}</span>
            </div>
          )
        )}
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="interest-tab">
        {intentionsBreakdown}
        <div className="interest-loading">
          <SofiaLoader size={100} />
          <p className="interest-loading-text">Analyzing your on-chain activity...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="interest-tab">
        {intentionsBreakdown}
        <div className="interest-error">
          <span className="interest-error-icon">!</span>
          <p className="interest-error-text">{error}</p>
          <button className="interest-error-retry" onClick={handleAnalyze}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No wallet state
  if (!walletAddress) {
    return (
      <div className="interest-tab">
        {intentionsBreakdown}
        <div className="interest-empty">
          <span className="interest-empty-icon">?</span>
          <h3 className="interest-empty-title">Connect Your Wallet</h3>
          <p className="interest-empty-text">
            Connect your wallet to analyze your on-chain activity and discover your interests.
          </p>
        </div>
      </div>
    );
  }

  // Not analyzed yet state
  if (!analyzedAt && interests.length === 0) {
    return (
      <div className="interest-tab">
        {intentionsBreakdown}

        <div className="interest-empty">
          <span className="interest-empty-icon"></span>
          <h3 className="interest-empty-title">Interest Locked</h3>
          <p className="interest-empty-text">
            Create intention certifications in Echoes to unlock your interests
          </p>
        </div>

        <div className="interest-footer">
          <button
            className="interest-analyze-btn"
            onClick={handleAnalyze}
            disabled={!walletAddress}
          >
            Analyze
          </button>
        </div>
      </div>
    );
  }

  // Empty state (no interests found after analysis)
  if (interests.length === 0 && analyzedAt) {
    return (
      <div className="interest-tab">
        {intentionsBreakdown}

        <div className="interest-empty">
          <span className="interest-empty-icon">-</span>
          <h3 className="interest-empty-title">No Interests Found</h3>
          <p className="interest-empty-text">
            Start certifying your web activity to build your interest profile. Your on-chain certifications will be analyzed to discover your interests.
          </p>
        </div>

        <div className="interest-footer">
          <button
            className="interest-analyze-btn"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            Analyze
          </button>
        </div>
      </div>
    );
  }

  // Interests list with Intentions Breakdown below
  return (
    <div className="interest-tab">
      <div className="interest-header">
        <button
          className="interest-analyze-btn"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="interest-summary">
          <p className="interest-summary-text">{summary}</p>
          <div className="interest-summary-meta">
            <span>{totalPositions} certifications analyzed</span>
            <span>{interests.length} interests identified</span>
          </div>
        </div>
      )}

      {/* Interests grid */}
      <div className="interest-grid">
        {interests.map((interest) => (
          <InterestCard key={interest.id} interest={interest} />
        ))}
      </div>

      {/* Intentions Breakdown below interests */}
      {intentionsBreakdown}
    </div>
  );
};

export default InterestTab;
