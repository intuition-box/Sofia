# Plan de Migration : localStorage vers IndexedDB

## Contexte

Migration du stockage de données de l'extension SofIA de localStorage et Plasmo Storage vers IndexedDB pour :
- Améliorer les performances
- Stocker des objets complexes
- Gérer de plus grandes quantités de données
- Séparer logiquement les différents types de données

## Analyse des Données Actuelles

### 🔍 **Données d'Eliza à migrer**
**Localisation :** `components/pages/graph-tabs/types.ts`
- **ParsedSofiaMessage** - Messages parsés d'Eliza avec triplets
  ```typescript
  {
    triplets: Triplet[]
    intention: string
    created_at: number
    rawObjectUrl?: string
    rawObjectDescription?: string
    extractedAt?: number
    sourceMessageId?: string
  }
  ```
- **Triplet** - Structure subject/predicate/object
  ```typescript
  {
    subject: string
    predicate: string  
    object: string
  }
  ```
- **Message** - Messages bruts reçus d'Eliza
  ```typescript
  {
    content: { text: string }
    created_at: number
  }
  ```

### 📊 **Données de navigation à migrer**
**Localisation :** `types/history.ts`, `hooks/useTracking.ts`
- **VisitData** - Données de visite avec sessions
- **DOMData** - Données DOM capturées (title, keywords, description, etc.)
- **SimplifiedHistoryEntry** - Historique simplifié Chrome
- **CompleteVisitData** - Données combinées DOM+History  
- **SessionData** - Sessions utilisateur (timestamp, duration, scrollEvents)
- **PageMetrics** - Métriques des pages visitées

### 👤 **Données de profil utilisateur à migrer**
**Localisation :** `components/pages/ProfilePage.tsx`, `components/pages/SettingsPage.tsx`, `types/storage.ts`

**Profil utilisateur :**
- `profilePhoto` - Photo de profil (blob/base64)
- `bio` - Biographie utilisateur  
- `profileUrl` - URL du profil personnalisé

**Paramètres utilisateur :**
- `isDataSharingEnabled` - Partage de données
- `isTrackingEnabled` - Tracking activé/désactivé
- **ExtensionSettings** - Paramètres complets :
  ```typescript
  {
    theme: 'light' | 'dark' | 'auto'
    language: string
    notifications: boolean
    autoBackup: boolean
    debugMode: boolean
    isTrackingEnabled: boolean
  }
  ```

### 🔍 **Données de recherche**
**Localisation :** `components/pages/SearchPage.tsx`, `components/pages/SearchResultPage.tsx`
- `searchQuery` (localStorage) - Requêtes de recherche utilisateur

### 🗑️ **Données à supprimer (stockage on-chain)**
**Localisation :** `hooks/useOnChainTriplets.ts`
- **OnChainTriplet** - Triplets stockés on-chain (à remplacer par API Intuition)
- Hooks associés : `useCreateTripleOnChain.ts`, `useCheckExistingTriple.ts`

### ✅ **Données à conserver dans Plasmo Storage**
- `"metamask-account"` - Connexion wallet (compatibilité)
- Autres cookies de connexion/authentification

## Schéma IndexedDB Proposé

### Base de données : `sofia-extension-db`
**Version :** 1

### Object Stores :

#### 1. **eliza_data**
```typescript
interface ElizaRecord {
  id?: number           // Auto-increment primary key
  messageId: string     // Unique message identifier
  content: ParsedSofiaMessage
  timestamp: number
  type: 'message' | 'triplet'
}
```
**Index :** `timestamp`, `messageId`, `type`

#### 2. **navigation_data**  
```typescript
interface NavigationRecord {
  id?: number           // Auto-increment primary key
  url: string          // Primary identifier
  visitData: VisitData
  lastUpdated: number
}
```
**Index :** `url`, `lastUpdated`, `visitData.visitCount`

#### 3. **user_profile**
```typescript
interface ProfileRecord {
  id: 'profile'        // Fixed key
  profilePhoto?: string // Base64 or blob URL
  bio: string
  profileUrl: string
  lastUpdated: number
}
```

#### 4. **user_settings**
```typescript
interface SettingsRecord {
  id: 'settings'       // Fixed key
  settings: ExtensionSettings
  lastUpdated: number
}
```

#### 5. **search_history**
```typescript
interface SearchRecord {
  id?: number          // Auto-increment primary key
  query: string
  timestamp: number
  results?: any[]      // Optional search results cache
}
```
**Index :** `timestamp`, `query`

## Plan d'Implémentation

### Phase 1 : Création du service IndexedDB
- [ ] Créer `lib/indexedDB.ts` avec les méthodes CRUD
- [ ] Implémenter l'initialisation de la base de données
- [ ] Gérer les migrations et versions

### Phase 2 : Migration des données
- [ ] Créer des utilitaires de migration depuis Plasmo Storage
- [ ] Migrer les données existantes vers IndexedDB
- [ ] Conserver une sauvegarde des données actuelles

### Phase 3 : Remplacement des hooks
- [ ] Remplacer `useOnChainTriplets` par `useElizaData`
- [ ] Adapter `useTracking` pour utiliser IndexedDB
- [ ] Créer de nouveaux hooks pour le profil utilisateur
- [ ] Vérification des nouveaux hooks

### Phase 4 : Suppression du stockage on-chain
 Suppression du Code Legacy
- [ ] Supprimer `useOnChainTriplets` (remplacé par API Intuition)
- [ ] Remplacer `useTracking` original par `useTrackingV2`
- [ ] Nettoyer références localStorage directes
- [ ] Supprimer imports Plasmo Storage obsolètes

Optimisations Finales
- [ ] Bundle size analysis et tree-shaking
- [ ] Performance profiling en production
- [ ] Cache strategies optimization
- [ ] Error reporting integration

Documentation et Formation
- [ ] Guide migration pour développeurs
- [ ] Documentation API complète des hooks
- [ ] Exemples d'usage pour cas complexes
- [ ] Formation équipe sur nouveaux patterns

---

### Phase 5 : Tests et validation
- [ ] Tester la migration des données existantes
- [ ] Vérifier les performances
- [ ] Tests de régression sur toutes les fonctionnalités

## Avantages de la Migration

1. **Performance** - Stockage plus rapide pour grandes quantités de données
2. **Structure** - Séparation logique des types de données
3. **Flexibilité** - Stockage d'objets complexes sans sérialisation
4. **Évolutivité** - Facile d'ajouter de nouveaux types de données
5. **Fiabilité** - Transactions atomiques et gestion d'erreurs robuste

## Notes Techniques

- Utiliser des transactions pour les opérations critiques
- Implémenter des index appropriés pour optimiser les requêtes
- Gérer les quotas de stockage IndexedDB
- Prévoir un système de nettoyage/archivage des anciennes données
- Maintenir une API compatible avec les composants existants