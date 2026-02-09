/**
 * InterestTab Component
 * Analyzes on-chain activity and categorizes into interests using AI
 * XP and levels are calculated locally from verifiable on-chain data
 */

import { useEffect } from 'react';
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage';
import { useInterestAnalysis } from '../../../hooks/useInterestAnalysis';
import InterestCard from '../../ui/InterestCard';
import SofiaLoader from '../../ui/SofiaLoader';
import '../../styles/InterestTab.css';

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

  // Loading state
  if (isLoading) {
    return (
      <div className="interest-tab">
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
        <div className="interest-empty">
          <span className="interest-empty-icon"></span>
          <h3 className="interest-empty-title">Interest Locked</h3>
          <p className="interest-empty-text">
            Create intention certifications in Echoes to unlock your interests
          </p>
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
        <div className="interest-header">
          <button
            className="interest-analyze-btn"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            Analyze
          </button>
        </div>
        <div className="interest-empty">
          <span className="interest-empty-icon">-</span>
          <h3 className="interest-empty-title">No Interests Found</h3>
          <p className="interest-empty-text">
            Start certifying your web activity to build your interest profile. Your on-chain certifications will be analyzed to discover your interests.
          </p>
        </div>
      </div>
    );
  }

  // Interests list
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
    </div>
  );
};

export default InterestTab;
