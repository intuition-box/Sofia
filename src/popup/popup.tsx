import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';

// Messages pour communication avec le service worker
interface ChromeMessage {
  type: 'get-history' | 'clear-data';
}

interface ChromeResponse {
  success: boolean;
  data?: unknown[];
  error?: string;
}

interface HistoryEntry {
  url?: string;
  lastVisitTime?: number;
  visitCount?: number;
  timestamp?: number;
  duration?: number;
}

function PopupApp() {
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [extensionId, setExtensionId] = useState<string>('');

  // Charger l'état initial
  useEffect(() => {
    const initializePopup = async () => {
      try {
        setExtensionId(chrome.runtime.id);
        
        const result = await chrome.storage.local.get(['isTrackingEnabled']);
        if (result.isTrackingEnabled !== undefined) {
          setIsTrackingEnabled(result.isTrackingEnabled);
        }
        
        await displayHistoryInConsole();
        
      } catch (error) {
        console.error('❌ SOFIA Popup Init Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePopup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Afficher les données d'historique dans la console
   */
  const displayHistoryInConsole = useCallback(async () => {
    try {
      const response = await sendMessage({ type: 'get-history' });
      if (response.success && response.data && response.data.length > 0) {
        console.log('📊 SOFIA - Données stockées (' + response.data.length + ' entrées):');
        
        response.data.forEach((item: unknown, index: number) => {
          const entry = item as HistoryEntry;
          console.log(`\n--- Entrée ${index + 1} ---`);
          console.log('  🌐 url:', entry.url || 'N/A');
          console.log('  ⏰ lastVisitTime:', entry.lastVisitTime ? new Date(entry.lastVisitTime).toLocaleString() : 'N/A');
          console.log('  📈 visitCount:', entry.visitCount || 'N/A');
          console.log('  🕐 timestamp:', entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A');
          console.log('  ⌛ duration:', entry.duration ? Math.round(entry.duration / 1000) + 's' : 'N/A');
        });
      } else {
        console.log('📊 SOFIA: Aucune donnée stockée');
      }
    } catch (error) {
      console.error('❌ SOFIA Console Error:', error);
    }
  }, []);

  /**
   * Envoyer un message au service worker
   */
  const sendMessage = (message: ChromeMessage): Promise<ChromeResponse> => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  };

  /**
   * Basculer l'état de tracking
   */
  const handleTrackingToggle = async () => {
    try {
      const newState = !isTrackingEnabled;
      setIsTrackingEnabled(newState);
      
      await chrome.storage.local.set({ isTrackingEnabled: newState });
      console.log(`🔄 SOFIA Tracking: ${newState ? 'ON' : 'OFF'}`);
      
      await displayHistoryInConsole();
      
    } catch (error) {
      console.error('❌ SOFIA Toggle Error:', error);
      setIsTrackingEnabled(!isTrackingEnabled);
    }
  };

  /**
   * Exporter les données vers un fichier JSON
   */
  const handleExportData = async () => {
    try {
      const response = await sendMessage({ type: 'get-history' });
      if (response.success && response.data) {
        const exportData = {
          metadata: {
            exportDate: new Date().toISOString(),
            version: '1.0',
            extension: 'SOFIA Chrome Extension - Version Simplifiée',
            totalEntries: response.data.length,
          },
          data: response.data
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sofia-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ SOFIA Export: Success');
      } else {
        console.log('⚠️ SOFIA Export: No data');
      }
    } catch (error) {
      console.error('❌ SOFIA Export Error:', error);
    }
  };

  /**
   * Effacer toutes les données
   */
  const handleClearData = async () => {
    if (confirm("Êtes-vous sûr de vouloir effacer toutes les données capturées ?")) {
      try {
        const response = await sendMessage({ type: 'clear-data' });
        if (response.success) {
          console.log('✅ SOFIA Clear: Success');
          await displayHistoryInConsole();
        } else {
          console.error('❌ SOFIA Clear Error:', response.error);
        }
      } catch (error) {
        console.error('❌ SOFIA Clear Error:', error);
      }
    }
  };

  /**
   * Rafraîchir l'affichage console
   */
  const handleRefreshConsole = async () => {
    await displayHistoryInConsole();
  };

  if (isLoading) {
    return (
      <div className="w-[400px] h-[600px] bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement SOFIA...</p>
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
              {isTrackingEnabled ? 'Actif' : 'Inactif'}
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
            <p className="text-sm text-foreground">Smart Data Capture</p>
          </div>
        </div>
      </div>

      {/* Content - Settings et RainbowKit uniquement */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Section RainbowKit (placeholder pour l'authentification) */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-base">🔐 Authentification Web3</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Connectez votre wallet pour une identité décentralisée
              </p>
              <Button variant="outline" className="w-full text-foreground">
                🦄 Connecter Wallet (RainbowKit)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                (À implémenter avec RainbowKit)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contrôles de Tracking */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-base">⚙️ Contrôles de Capture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="font-medium text-sm">Capture automatique</div>
                <div className="text-xs text-muted-foreground">
                  Capturer les données DOM et historique
                </div>
              </div>
              <Switch checked={isTrackingEnabled} onCheckedChange={handleTrackingToggle} />
            </div>
            
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">
                📊 Les données capturées sont visibles dans la console des Developer Tools
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-foreground" 
                onClick={handleRefreshConsole}
              >
                🔄 Rafraîchir Console
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gestion des Données */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-base">💾 Gestion des Données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <Button 
              variant="outline" 
              className="w-full text-foreground" 
              onClick={handleExportData}
            >
              📄 Exporter (JSON)
            </Button>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleClearData}
            >
              🗑️ Effacer toutes les données
            </Button>
          </CardContent>
        </Card>

        {/* Informations Extension */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-base">ℹ️ Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extension ID:</span>
                <span className="font-mono text-xs">{extensionId.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>1.0.0 (Simplifiée)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Console:</span>
                <span className="text-xs">F12 → Console</span>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">
                🎯 <strong>Données capturées:</strong><br/>
                • Titre, mots-clés, description, type OG, H1<br/>
                • URL, temps de visite, nombre de visites<br/>
                • Tout est visible dans les logs console
              </p>
            </div>
          </CardContent>
        </Card>
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
