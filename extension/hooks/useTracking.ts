import { useState, useEffect } from 'react';
import { useStorage } from '@plasmohq/storage/hook';
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

  // Communication avec le background script pour obtenir les stats
  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      // Demander les stats au background script
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'GET_TRACKING_STATS' },
          (response) => resolve(response)
        );
      });
      
      if (response && response.success) {
        setStats(response.data);
      }
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
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'EXPORT_TRACKING_DATA' },
          (response) => resolve(response)
        );
      });
      
      if (response && response.success) {
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sofia-tracking-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const clearData = async () => {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données de tracking ?')) {
      try {
        const response = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'CLEAR_TRACKING_DATA' },
            (response) => resolve(response)
          );
        });
        
        if (response && response.success) {
          await loadStats();
        }
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
          code: `console.log('📊 SOFIA - Check tracking data in background script console');`
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