
import { formatDuration, formatUrl } from '~lib/formatters';

interface TrackingStatsProps {
  totalPages: number;
  totalVisits: number;
  totalTime: number;
  mostVisitedUrl: string | null;
}

const TrackingStats = ({
  totalPages,
  totalVisits,
  totalTime,
  mostVisitedUrl
}: TrackingStatsProps) => {
  const formatMostVisitedUrl = (url: string | null): string => {
    if (!url) return 'N/A';
    return formatUrl(url, 25);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>📊 Statistiques de navigation</span>
      </div>
      <div style={styles.statsGrid}>
        <div style={styles.statItem}>
          <div style={styles.statIcon}>🌐</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{totalPages}</div>
            <div style={styles.statLabel}>Pages visitées</div>
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statIcon}>👁️</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{totalVisits}</div>
            <div style={styles.statLabel}>Visites totales</div>
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statIcon}>⏱️</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{formatDuration(totalTime)}</div>
            <div style={styles.statLabel}>Temps total</div>
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statIcon}>🥇</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{formatMostVisitedUrl(mostVisitedUrl)}</div>
            <div style={styles.statLabel}>Plus visitée</div>
          </div>
        </div>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px) saturate(100%)',
    WebkitBackdropFilter: 'blur(5px) saturate(100%)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease'
  },
  statIcon: {
    fontSize: '16px',
    minWidth: '20px'
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    minWidth: '0',
    flex: '1'
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FBF7F5',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  statLabel: {
    fontSize: '11px',
    color: '#F2DED6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  }
};

export default TrackingStats;