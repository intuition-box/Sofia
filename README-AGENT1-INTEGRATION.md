# 🤖 Agent1 ↔ Extension SOFIA - Guide d'Intégration

## 📋 Vue d'ensemble

L'extension Chrome SOFIA capture automatiquement l'historique de navigation et expose une **API complète** pour qu'Agent1 puisse récupérer et analyser ces données.

## 🎯 Fonctionnalités

### ✅ Extension Chrome (PRÊTE)
- ✅ **Tracking automatique** des navigations (tous les onglets)
- ✅ **Filtrage sites sensibles** (banques, paiements, etc.)
- ✅ **Catégorisation automatique** (11 catégories : dev, social, news, etc.)
- ✅ **API REST interne** via `chrome.runtime.sendMessage`
- ✅ **Stockage Chrome** avec structure complète
- ✅ **Interface utilisateur** (popup avec contrôles)
- ✅ **Export JSON** des données

### 🎯 API Disponible pour Agent1

#### 1. **Récupérer l'historique**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'GET_HISTORY_DATA',
  filters: {
    startDate: Date.now() - 24 * 60 * 60 * 1000, // 24h
    endDate: Date.now(),
    category: 'development',
    domain: 'github.com',
    searchQuery: 'API'
  }
}, (response) => {
  if (response.success) {
    console.log('📊 Données:', response.data)
  }
})
```

#### 2. **Visites récentes**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'GET_RECENT_VISITS',
  limit: 50
}, (response) => {
  console.log('🕐 Visites récentes:', response.data)
})
```

#### 3. **Recherche dans l'historique**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'SEARCH_HISTORY',
  query: 'React',
  filters: { category: 'development' }
}, (response) => {
  console.log('🔍 Résultats:', response.data)
})
```

#### 4. **Statistiques d'usage**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'GET_STATISTICS'
}, (response) => {
  console.log('📈 Stats:', response.data)
  // topDomains, categoriesDistribution, dailyVisits, etc.
})
```

#### 5. **Contrôler le tracking**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'TOGGLE_TRACKING',
  enabled: false // Pause le tracking
}, (response) => {
  console.log('⏸️ Tracking:', response.enabled)
})
```

## 🚀 Installation et Utilisation

### Étape 1: Installer l'extension
```bash
# Dans le dossier extension/
npm install
npm run build

# Charger dans Chrome:
# 1. Aller à chrome://extensions/
# 2. Activer "Mode développeur"
# 3. Cliquer "Charger l'extension non empaquetée"
# 4. Sélectionner le dossier dist/
```

### Étape 2: Récupérer l'ID de l'extension
1. Ouvrir le popup de l'extension
2. Aller dans l'onglet "Settings"
3. Copier l'Extension ID affiché

### Étape 3: Configuration Agent1

#### Option A: Agent1 dans le navigateur
```javascript
// Script Agent1 dans une page web
const EXTENSION_ID = 'abcdefghijklmnopqrstuvwxyz123456' // Votre ID

const client = new SofiaExtensionClient(EXTENSION_ID)
const analysis = await agent1Analysis()
console.log('🎯 Analyse complète:', analysis)
```

#### Option B: Agent1 en Node.js (via serveur proxy)
```javascript
// Serveur proxy Node.js
const express = require('express')
const { createProxyServer } = require('./agent1-example.js')

// Démarre serveur sur http://localhost:3001
createProxyServer()

// Agent1 fait des requêtes HTTP vers le proxy
const response = await fetch('http://localhost:3001/api/extension/history', {
  method: 'POST',
  body: JSON.stringify({ extensionId: EXTENSION_ID, filters: {} })
})
```

## 📊 Structure des Données

### NavigationEntry
```typescript
{
  id: string                    // Identifiant unique
  url: string                   // URL complète
  title: string                 // Titre de la page
  domain: string                // Domaine (ex: github.com)
  timestamp: number             // Timestamp de visite
  category?: string             // Catégorie auto-détectée
  visitDuration?: number        // Durée de visite (ms)
  tabId?: number                // ID de l'onglet Chrome
}
```

### Catégories Automatiques
- **development**: GitHub, Stack Overflow, documentation
- **social**: Facebook, Twitter, LinkedIn, Reddit
- **news**: Sites d'actualité, médias
- **shopping**: E-commerce, Amazon, etc.
- **entertainment**: YouTube, Netflix, gaming
- **productivity**: Google Docs, Notion, Slack
- **education**: Cours en ligne, tutoriels
- **search**: Moteurs de recherche
- **finance**: Banques, crypto, trading
- **blog**: Articles de blog
- **documentation**: Docs techniques
- **general**: Autres sites

### Statistiques
```typescript
{
  totalVisits: number           // Total des visites
  dailyVisits: number           // Visites aujourd'hui
  weeklyVisits: number          // Visites cette semaine
  topDomains: Array<{           // Top des domaines
    domain: string
    visits: number
    percentage: number
  }>
  categoriesDistribution: Array<{  // Répartition par catégorie
    category: string
    visits: number
    percentage: number
  }>
  trackingEnabled: boolean      // État du tracking
  lastUpdated: number           // Dernière mise à jour
}
```

## 🔒 Sécurité et Filtrage

### Sites Sensibles Automatiquement Filtrés
- Domaines bancaires (`*.bank.*`, `*banking*`)
- Sites de paiement (`*paypal*`, `*payment*`)
- Sites privés (`*private*`)
- Crédit (`*.credit.*`)

### Configuration CORS
L'extension accepte les communications depuis:
- `localhost:*`
- `127.0.0.1:*`

## 🎯 Exemples d'Analyses Agent1

### 1. Détection de Patterns de Travail
```javascript
function analyzeWorkPatterns(entries) {
  const devSites = entries.filter(e => e.category === 'development')
  const workHours = devSites.filter(e => {
    const hour = new Date(e.timestamp).getHours()
    return hour >= 9 && hour <= 17
  })
  
  return {
    workIntensity: workHours.length / devSites.length,
    topDevDomains: getTopDomains(devSites),
    recommendedBreaks: workHours.length > 50
  }
}
```

### 2. Analyse de Concentration
```javascript
function analyzeConcentration(entries) {
  const sessions = groupByTimeGaps(entries, 10 * 60 * 1000) // 10min gaps
  
  return {
    averageSessionLength: calculateAverageSessionLength(sessions),
    focusScore: calculateFocusScore(sessions),
    distractionDomains: findDistractionDomains(sessions)
  }
}
```

### 3. Recommandations Intelligentes
```javascript
function generateSmartRecommendations(patterns) {
  const recommendations = []
  
  if (patterns.workIntensity > 0.8) {
    recommendations.push({
      type: 'BREAK_REMINDER',
      message: 'Vous travaillez intensivement. Prenez une pause !',
      action: 'Schedule 15min break'
    })
  }
  
  if (patterns.topDevDomains.includes('stackoverflow.com')) {
    recommendations.push({
      type: 'LEARNING_PATH',
      message: 'Beaucoup de recherches détectées. Voici des ressources:',
      resources: ['Documentation officielle', 'Tutoriels structurés']
    })
  }
  
  return recommendations
}
```

## 🔧 Débogage

### Vérifier la communication
```javascript
// Test de connexion simple
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'GET_STATISTICS'
}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Erreur:', chrome.runtime.lastError.message)
  } else if (response.success) {
    console.log('✅ Extension connectée:', response.data)
  } else {
    console.error('❌ Erreur extension:', response.error)
  }
})
```

### Logs de l'extension
- Ouvrir DevTools de l'extension: `chrome://extensions/` → Détails → Vues inspectées → Service Worker
- Console popup: Clic droit sur popup → Inspecter

## 📈 Métriques pour Agent1

### KPIs Disponibles
- **Productivité**: Ratio sites travail vs divertissement
- **Focus**: Durée moyenne des sessions sur un domaine
- **Patterns temporels**: Heures de pic d'activité
- **Diversité**: Nombre de domaines uniques visités
- **Efficacité**: Ratio recherches vs résultats (docs, tutoriels)

### Alertes Possibles
- Sessions trop longues sans pause
- Trop de distractions détectées
- Recherches répétitives (problème non résolu)
- Navigation hors horaires normaux

## 🎯 Prochaines Étapes

1. **Lancer l'extension** et la tester
2. **Récupérer l'Extension ID** depuis le popup
3. **Tester la communication** avec l'exemple `agent1-example.js`
4. **Implémenter les analyses** spécifiques à Agent1
5. **Créer le serveur proxy** si nécessaire pour Node.js

---

🚀 **L'extension est prête pour Agent1 !** Toutes les APIs sont fonctionnelles et documentées. 