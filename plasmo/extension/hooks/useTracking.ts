import { useState, useEffect } from 'react';
import { useStorage } from '@plasmohq/storage/hook';
import { HistoryManager } from '~lib/history';
import type { VisitData } from '~types/history';

interface TrackingStats {
  totalPages: number;
  totalVisits: number;
  totalTime: number;
  mostVisitedUrl: string | null;
  recentVisits: VisitData[];
}

export const useTracking = () => {
  const [isTrackingEnabled, setIsTrackingEnabled] = useStorage('tracking_enabled', true);
  const [stats, setStats] = useState<TrackingStats>({
    totalPages: 0,
    totalVisits: 0,
    totalTime: 0,
    mostVisitedUrl: null,
    recentVisits: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const historyManager = new HistoryManager();

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const globalStats = historyManager.getGlobalStats();
      const recentVisits = historyManager.getRecentVisits(5);
      
      setStats({
        totalPages: globalStats.totalUrls,
        totalVisits: globalStats.totalVisits,
        totalTime: globalStats.totalTimeSpent,
        mostVisitedUrl: globalStats.mostVisitedUrl,
        recentVisits
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTracking = async () => {
    setIsTrackingEnabled(!isTrackingEnabled);
  };

  const exportData = async () => {
    try {
      const data = historyManager.exportHistory();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sofia-tracking-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const clearData = async () => {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données de tracking ?')) {
      try {
        await historyManager.clearAll();
        await loadStats();
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
      }
    }
  };

  const viewConsole = () => {
    // Envoyer un message pour afficher les données dans la console
    chrome.runtime.sendMessage({ type: 'TEST_MESSAGE' });
    // Rediriger vers la console des outils développeur
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.executeScript(tabs[0].id!, {
          code: `console.log('📊 SOFIA - Consultez les données de tracking dans la console du background script');`
        });
      }
    });
  };

  useEffect(() => {
    loadStats();
    // Actualiser les stats toutes les 5 secondes
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    isTrackingEnabled,
    stats,
    isLoading,
    toggleTracking,
    exportData,
    clearData,
    viewConsole,
    refreshStats: loadStats
  };
};