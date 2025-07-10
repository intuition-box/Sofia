import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import type { NavigationEntry } from '../types';

interface HistoryStats {
  totalVisits: number;
  dailyVisits: number;
  weeklyVisits: number;
  topDomains: { domain: string; visits: number; percentage: number }[];
  categoriesDistribution: { category: string; visits: number; percentage: number }[];
  trackingEnabled: boolean;
  lastUpdated: number;
}

// Types pour les messages Chrome Runtime
interface ChromeMessage {
  type: 'GET_TRACKING_STATUS' | 'TOGGLE_TRACKING' | 'GET_RECENT_HISTORY' | 'GET_STATISTICS' | 'EXPORT_HISTORY' | 'RESET_HISTORY';
  limit?: number;
}

interface ChromeResponse {
  enabled?: boolean;
  data?: NavigationEntry[] | HistoryStats;
  json?: string;
  success?: boolean;
}

// Types spécifiques pour les réponses (préfixés avec _ car non encore utilisés)
// interface _TrackingResponse {
//   enabled: boolean;
// }

// interface _HistoryResponse {
//   data: NavigationEntry[];
// }

// interface _StatsResponse {
//   data: HistoryStats;
// }

// interface _ExportResponse {
//   json: string;
// }

type TabType = 'dashboard' | 'history' | 'settings';

function PopupApp() {
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [historyData, setHistoryData] = useState<NavigationEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [extensionId, setExtensionId] = useState<string>('');

  const loadStatistics = useCallback(async () => {
    try {
      console.log('🎭 POPUP: Demande des statistiques...');
      const response = await sendMessage({ type: 'GET_STATISTICS' });
      console.log('🎭 POPUP: Réponse reçue:', response);

      if (response && response.data && !Array.isArray(response.data)) {
        const statsData = response.data as HistoryStats;
        console.log('🎭 POPUP: Données statistiques trouvées:');
        console.log('   📊 Total visites:', statsData.totalVisits);
        console.log("   📊 Visites aujourd'hui:", statsData.dailyVisits);
        console.log('   📊 Top domaines:', statsData.topDomains?.length || 0);
        console.log('   📊 Catégories:', statsData.categoriesDistribution?.length || 0);
        setStats(statsData);
      } else {
        console.log('🎭 POPUP: Aucune donnée dans la réponse ou réponse invalide');
        console.log('🎭 POPUP: Détails réponse:', { response });
        setStats(null); // Réinitialiser les stats en cas d'erreur
      }
    } catch (error) {
      console.error('🎭 POPUP: Erreur chargement statistiques:', error);
      setStats(null); // Réinitialiser les stats en cas d'erreur
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      console.log('🎭 POPUP: loadInitialData démarré');
      setIsLoading(true);

      // Paralléliser les appels non dépendants
      const [trackingResponse, historyResponse] = await Promise.all([
        sendMessage({ type: 'GET_TRACKING_STATUS' }),
        sendMessage({ type: 'GET_RECENT_HISTORY', limit: 20 }),
      ]);

      // Obtenir l'ID de l'extension
      setExtensionId(chrome.runtime.id);
      console.log('🎭 POPUP: Extension ID défini:', chrome.runtime.id);

      // Traiter la réponse du statut de tracking
      console.log('🎭 POPUP: Réponse tracking reçue:', trackingResponse);
      if (trackingResponse && trackingResponse.enabled !== undefined) {
        setIsTrackingEnabled(trackingResponse.enabled);
        console.log('🎭 POPUP: Statut tracking défini:', trackingResponse.enabled);
      } else {
        console.log('🎭 POPUP: Statut tracking non défini dans la réponse');
      }

      // Traiter la réponse de l'historique
      console.log('🎭 POPUP: Réponse historique reçue:', historyResponse);
      if (historyResponse && historyResponse.data && Array.isArray(historyResponse.data)) {
        console.log("🎭 POPUP: Entrées d'historique trouvées:", historyResponse.data.length);
        setHistoryData(historyResponse.data as NavigationEntry[]);
      } else {
        console.log("🎭 POPUP: Aucune donnée d'historique dans la réponse");
        setHistoryData([]);
      }

      // Charger les statistiques
      await loadStatistics();
    } catch (error) {
      console.error('🎭 POPUP: Erreur chargement données globale:', error);
    } finally {
      setIsLoading(false);
      console.log('🎭 POPUP: Fin du chargement initial');
    }
  }, [loadStatistics]);

  // Charger les données au démarrage
  useEffect(() => {
    console.log('🎭 POPUP: useEffect démarré - Chargement initial...');
    loadInitialData();
  }, [loadInitialData]);

  const sendMessage = (message: ChromeMessage): Promise<ChromeResponse> => {
    return new Promise((resolve, reject) => {
      console.log('🎭 POPUP: Envoi message:', message);
      chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
          console.error('🎭 POPUP: Erreur runtime:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('🎭 POPUP: Réponse reçue:', response);
          resolve(response);
        }
      });
    });
  };

  const handleTrackingToggle = async () => {
    try {
      const response = await sendMessage({ type: 'TOGGLE_TRACKING' });
      if (response.enabled !== undefined) {
        setIsTrackingEnabled(response.enabled);
        // Recharger les stats après changement
        await loadStatistics();
      }
    } catch (error) {
      console.error('Erreur toggle tracking:', error);
    }
  };

  const handleExportHistory = async () => {
    try {
      const response = await sendMessage({ type: 'EXPORT_HISTORY' });
      if (response.json) {
        // Créer un blob et télécharger
        const blob = new Blob([response.json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sofia-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const handleResetHistory = async () => {
    if (confirm("Êtes-vous sûr de vouloir effacer tout l'historique ?")) {
      try {
        await sendMessage({ type: 'RESET_HISTORY' });
        await loadInitialData(); // Recharger les données
      } catch (error) {
        console.error('Erreur reset:', error);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'development':
        return '👨‍💻';
      case 'social':
        return '📱';
      case 'entertainment':
        return '🎬';
      case 'productivity':
        return '⚡';
      case 'news':
        return '📰';
      case 'shopping':
        return '🛒';
      case 'education':
        return '📚';
      case 'search':
        return '🔍';
      case 'finance':
        return '💰';
      case 'blog':
        return '📝';
      case 'documentation':
        return '📖';
      default:
        return '🌐';
    }
  };

  const getCategoryVariant = (
    category: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (category) {
      case 'development':
        return 'default';
      case 'social':
        return 'secondary';
      case 'entertainment':
        return 'outline';
      case 'productivity':
        return 'default';
      case 'news':
        return 'secondary';
      case 'documentation':
        return 'default';
      case 'shopping':
        return 'outline';
      case 'finance':
        return 'default';
      case 'blog':
        return 'secondary';
      case 'education':
        return 'outline';
      case 'search':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="w-[400px] h-[600px] bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-[600px] bg-background text-foreground">
      {/* Header */}
      <div className="border-b p-4">
        {/* Status en haut à droite */}
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isTrackingEnabled ? 'bg-green-500' : 'bg-destructive'}`}
            />
            <span className="text-sm text-foreground">
              {isTrackingEnabled ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
        
        {/* Logo et titre centrés */}
        <div className="flex flex-col items-center justify-center mb-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden mb-2">
            <img 
              src="/icons/icon.png" 
              alt="SOFIA Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="font-semibold text-xl">SOFIA</h1>
            <p className="text-sm text-foreground">Smart History Tracker</p>
          </div>
        </div>

        {/* API Status Card */}

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b">
        {([
          { id: 'dashboard' as const, label: 'Dashboard', icon: '📊' },
          { id: 'history' as const, label: 'History', icon: '📈' },
          { id: 'settings' as const, label: 'Settings', icon: '⚙️' },
        ] as const).map(tab => (
          <Button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            variant={currentTab === tab.id ? 'default' : 'ghost'}
            className="flex-1 rounded-none border-0 py-2"
            size="sm"
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {currentTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stats?.dailyVisits || 0}</div>
                  <div className="text-xs text-muted-foreground">Websites visited today</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats?.totalVisits || 0}</div>
                  <div className="text-xs text-muted-foreground">Total visits</div>
                </CardContent>
              </Card>
            </div>

            {/* Top Sites */}
            <Card>
              <CardHeader className="pb-2 px-4 pt-3">
                <CardTitle className="text-base flex items-center justify-center gap-2">
                  🔥 Most visited websites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                {stats && stats.topDomains && stats.topDomains.length > 0 ? (
                  stats.topDomains.slice(0, 3).map(site => (
                    <div
                      key={site.domain}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=16`}
                          alt="favicon"
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="font-medium text-sm">{site.domain}</div>
                          <div className="text-xs text-muted-foreground">
                            {site.percentage.toFixed(1)}% du trafic
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{site.visits}</div>
                        <div className="text-xs text-muted-foreground">visites</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune donnée disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Categories Distribution */}
            <Card>
              <CardHeader className="pb-2 px-4 pt-3">
                <CardTitle className="text-sm flex items-center justify-center">
                  📂 Categories distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                {stats &&
                stats.categoriesDistribution &&
                stats.categoriesDistribution.length > 0 ? (
                  stats.categoriesDistribution.slice(0, 4).map(cat => (
                    <div key={cat.category} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(cat.category)}</span>
                        <span className="text-sm capitalize">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.visits}</span>
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'history' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 px-4 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent history</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportHistory}>
                    Export JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto px-4 pb-4">
                {historyData && historyData.length > 0 ? (
                  historyData.map((entry, index) => (
                    <Card key={entry.id || index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${entry.domain}&sz=16`}
                            alt="favicon"
                            className="w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm truncate hover:underline block mb-1"
                            >
                              {entry.title}
                            </a>
                            <div className="text-xs text-muted-foreground truncate mb-1">
                              {entry.domain} • {formatDate(entry.timestamp)}
                            </div>
                            {entry.category && (
                              <Badge
                                variant={getCategoryVariant(entry.category)}
                                className="text-xs"
                              >
                                {entry.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No history available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="space-y-4">
            {/* Tracking Control */}
            <Card>
              <CardHeader className="pb-2 px-4 pt-3">
                <CardTitle className="text-base">Tracking controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="font-medium text-sm">Automatic tracking</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically capture navigations
                    </div>
                  </div>
                  <Switch checked={isTrackingEnabled} onCheckedChange={handleTrackingToggle} />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader className="pb-2 px-4 pt-3">
                <CardTitle className="text-base">Data management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <Button variant="outline" className="w-full text-foreground" onClick={handleExportHistory}>
                  📄 History export (JSON)
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleResetHistory}>
                  🗑️ Delete all history
                </Button>
              </CardContent>
            </Card>

            {/* Extension Info */}
            <Card>
              <CardHeader className="pb-2 px-4 pt-3">
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extension ID:</span>
                    <span className="font-mono text-xs">{extensionId.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update:</span>
                    <span>{stats?.lastUpdated ? formatDate(stats.lastUpdated) : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent1 Connection */}

          </div>
        )}
      </div>
    </div>
  );
}

// Export du composant pour Fast Refresh
export { PopupApp };

// Montage de l'application
const container = document.getElementById('popup-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<PopupApp />);
}
