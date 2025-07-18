import React from "react";
import type { VisitData } from "~types/history";

interface RecentVisitsProps {
  visits: VisitData[];
  maxItems?: number;
}

const RecentVisits: React.FC<RecentVisitsProps> = ({ visits, maxItems = 5 }) => {
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatTitle = (title: string): string => {
    return title.length > 30 ? `${title.slice(0, 30)}...` : title;
  };

  const recentVisits = visits.slice(0, maxItems);

  if (recentVisits.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>🕒 Visites récentes</span>
        </div>
        <div style={styles.emptyState}>
          <span style={styles.emptyText}>Aucune visite récente</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>🕒 Visites récentes</span>
      </div>
      <div style={styles.visitsList}>
        {recentVisits.map((visit, index) => (
          <div key={`${visit.url}-${index}`} style={styles.visitItem}>
            <div style={styles.visitContent}>
              <div style={styles.visitTitle}>{formatTitle(visit.title)}</div>
              <div style={styles.visitUrl}>{formatUrl(visit.url)}</div>
            </div>
            <div style={styles.visitMeta}>
              <div style={styles.visitCount}>{visit.visitCount}x</div>
              <div style={styles.visitTime}>{formatTimestamp(visit.lastVisitTime)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    marginBottom: '16px',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  header: {
    marginBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    paddingBottom: '8px'
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FBF7F5'
  },
  visitsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  visitItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px) saturate(100%)',
    WebkitBackdropFilter: 'blur(5px) saturate(100%)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    gap: '8px',
    transition: 'all 0.3s ease'
  },
  visitContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    flex: '1',
    minWidth: '0'
  },
  visitTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#FBF7F5',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  visitUrl: {
    fontSize: '11px',
    color: '#F2DED6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  visitMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '2px',
    minWidth: '40px'
  },
  visitCount: {
    fontSize: '11px',
    color: '#C7866C',
    fontWeight: '600'
  },
  visitTime: {
    fontSize: '10px',
    color: '#F2DED6'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '20px'
  },
  emptyText: {
    fontSize: '12px',
    color: '#F2DED6',
    fontStyle: 'italic'
  }
};

export default RecentVisits;