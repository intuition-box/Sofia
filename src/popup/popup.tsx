import ReactDOM from 'react-dom/client'
import '../index.css'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import type { NavigationEntry } from '../types'

interface HistoryStats {
  totalVisits: number
  dailyVisits: number
  weeklyVisits: number
  topDomains: Array<{ domain: string; visits: number; percentage: number }>
  categoriesDistribution: Array<{ category: string; visits: number; percentage: number }>
  trackingEnabled: boolean
  lastUpdated: number
}

function PopupApp() {
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true)
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard')
  const [historyData, setHistoryData] = useState<NavigationEntry[]>([])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [extensionId, setExtensionId] = useState<string>('')

  // Charger les données au démarrage
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      // Obtenir l'ID de l'extension
      setExtensionId(chrome.runtime.id)

      // Charger le statut du tracking
      const trackingResponse = await sendMessage({ type: 'GET_TRACKING_STATUS' })
      if (trackingResponse.enabled !== undefined) {
        setIsTrackingEnabled(trackingResponse.enabled)
      }

      // Charger l'historique récent
      const historyResponse = await sendMessage({ type: 'GET_RECENT_HISTORY', limit: 20 })
      if (historyResponse.data) {
        setHistoryData(historyResponse.data)
      }

      // Charger les statistiques
      await loadStatistics()

    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await sendMessageExternal({ action: 'GET_STATISTICS' })
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
    }
  }

  const sendMessage = (message: any): Promise<any> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve)
    })
  }

  const sendMessageExternal = (message: any): Promise<any> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(chrome.runtime.id, message, resolve)
    })
  }

  const handleTrackingToggle = async () => {
    try {
      const response = await sendMessage({ type: 'TOGGLE_TRACKING' })
      if (response.enabled !== undefined) {
        setIsTrackingEnabled(response.enabled)
        // Recharger les stats après changement
        await loadStatistics()
      }
    } catch (error) {
      console.error('Erreur toggle tracking:', error)
    }
  }

  const handleExportHistory = async () => {
    try {
      const response = await sendMessage({ type: 'EXPORT_HISTORY' })
      if (response.json) {
        // Créer un blob et télécharger
        const blob = new Blob([response.json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sofia-history-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur export:', error)
    }
  }

  const handleResetHistory = async () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      try {
        await sendMessage({ type: 'RESET_HISTORY' })
        await loadInitialData() // Recharger les données
      } catch (error) {
        console.error('Erreur reset:', error)
      }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'development': return '👨‍💻'
      case 'social': return '📱'
      case 'entertainment': return '🎬'
      case 'productivity': return '⚡'
      case 'news': return '📰'
      case 'shopping': return '🛒'
      case 'education': return '📚'
      case 'search': return '🔍'
      case 'finance': return '💰'
      case 'blog': return '📝'
      case 'documentation': return '📖'
      default: return '🌐'
    }
  }

  const getCategoryVariant = (category: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (category) {
      case 'development': return 'default'
      case 'social': return 'secondary'
      case 'entertainment': return 'outline'
      case 'productivity': return 'default'
      case 'news': return 'secondary'
      default: return 'secondary'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (isLoading) {
    return (
      <div className="w-[400px] h-[600px] bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[400px] h-[600px] bg-background text-foreground">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="font-semibold text-xl">SOFIA</h1>
              <p className="text-sm text-muted-foreground">Smart History Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isTrackingEnabled ? 'bg-green-500' : 'bg-destructive'}`} />
            <span className="text-sm text-muted-foreground">
              {isTrackingEnabled ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* API Status Card */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">API Ready for Agent1</span>
              </div>
              <Badge variant="outline" className="text-xs">
                ID: {extensionId.slice(0, 8)}...
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'history', label: 'History', icon: '📈' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as any)}
            variant={currentTab === tab.id ? "default" : "ghost"}
            className="flex-1 rounded-none border-0"
            size="sm"
          >
            <span className="mr-1">{tab.icon}</span>
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
                  <div className="text-2xl font-bold text-primary">
                    {stats?.dailyVisits || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Sites visités aujourd'hui</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.totalVisits || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Total des visites</div>
                </CardContent>
              </Card>
            </div>

            {/* Top Sites */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  🔥 Sites les plus visités
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.topDomains.slice(0, 3).map((site) => (
                  <div key={site.domain} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌐</span>
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
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune donnée disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Categories Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  📂 Répartition par catégories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats?.categoriesDistribution.slice(0, 4).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between">
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
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune donnée disponible
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'history' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Historique récent</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportHistory}
                  >
                    Export JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {historyData.map((entry, index) => (
                  <Card key={entry.id || index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(entry.category || 'general')}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{entry.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {entry.domain} • {formatDate(entry.timestamp)}
                          </div>
                          {entry.category && (
                            <Badge variant={getCategoryVariant(entry.category)} className="text-xs mt-1">
                              {entry.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun historique disponible
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contrôles de tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Suivi automatique</div>
                    <div className="text-xs text-muted-foreground">
                      Capturer automatiquement les navigations
                    </div>
                  </div>
                  <Switch 
                    checked={isTrackingEnabled}
                    onCheckedChange={handleTrackingToggle}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Gestion des données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleExportHistory}
                >
                  📄 Exporter l'historique (JSON)
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleResetHistory}
                >
                  🗑️ Effacer tout l'historique
                </Button>
              </CardContent>
            </Card>

            {/* Extension Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extension ID:</span>
                    <span className="font-mono text-xs">{extensionId.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dernière MAJ:</span>
                    <span>{stats?.lastUpdated ? formatDate(stats.lastUpdated) : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent1 Connection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  🤖 Connexion Agent1
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  L'API est prête pour la communication avec Agent1.
                  Utilisez l'ID d'extension ci-dessus pour les requêtes externes.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Montage de l'application
const container = document.getElementById('popup-root')
if (container) {
  const root = ReactDOM.createRoot(container)
  root.render(<PopupApp />)
} 