# Migration du système de tracking SOFIA vers Plasmo

## Contexte
- Migration du système de tracking de navigation de `migration/` vers `plasmo/extension/`
- Conserver le bouton wallet connection qui fonctionne actuellement
- Supprimer toute dépendance à Tailwind
- Utiliser metamask-extension-provider déjà installé

## Tâches de migration

### 1. Types et interfaces (priorité haute)
- [x] Créer `types/history.ts` avec DOMData, VisitData, SessionData
- [x] Créer `types/storage.ts` avec StorageData, ExtensionSettings
- [x] Créer `types/messaging.ts` pour la communication background/content
- [x] Créer `types/wallet.ts` pour l'intégration MetaMask
- [x] Créer `types/index.ts` pour centraliser les exports

### 2. Background service worker (priorité haute)
- [x] Créer `background/index.ts` avec le service worker principal
- [x] Migrer la logique de traitement des messages (PAGE_DATA, PAGE_DURATION, SCROLL_DATA)
- [x] Intégrer le système de storage avec @plasmohq/storage
- [x] Adapter l'intégration MetaMask pour fonctionner avec le bouton existant
- [x] Préserver la fonctionnalité sidepanel existante

### 3. Content script (priorité haute)
- [x] Créer `contents/tracking.ts` avec la logique de tracking DOM
- [x] Migrer l'extraction des données (title, keywords, description, h1)
- [x] Migrer le tracking des durées et scroll events
- [x] Implémenter le filtrage des iframes publicitaires
- [x] Configurer pour Plasmo avec PlasmoCSConfig

### 4. Gestionnaire de données (priorité haute)
- [x] Créer `lib/history.ts` avec le HistoryManager
- [x] Migrer les méthodes de storage vers @plasmohq/storage
- [x] Implémenter le nettoyage automatique (30 jours)
- [x] Créer les méthodes d'export/import JSON
- [x] Intégrer le HistoryManager dans le background script
- [x] Ajouter méthodes supplémentaires pour Plasmo (search, recent visits, etc.)

### 5. Composants UI avec CSS pur (priorité moyenne)
- [x] Créer TrackingStatus.tsx avec CSS inline
- [x] Créer TrackingStats.tsx pour les statistiques
- [x] Créer TrackingActions.tsx pour les actions (export, clear, console)
- [x] Créer RecentVisits.tsx pour les visites récentes
- [x] Créer index.ts pour l'export centralisé des composants

### 6. Intégration popup (priorité moyenne)
- [x] Créer useTracking hook pour gérer les données
- [x] Étendre le popup existant pour inclure le tracking
- [x] Ajouter système d'onglets (Wallet / Tracking)
- [x] Intégrer tous les composants de tracking
- [x] Conserver la fonctionnalité wallet existante
- [x] Ajouter styles CSS cohérents pour l'interface

### 7. Tests et compatibilité (priorité moyenne)
- [x] Créer script de test automatisé (run-compatibility-tests.js)
- [x] Créer guide de test manuel (compatibility-test.md)
- [x] Vérifier le build et la structure des fichiers
- [x] Vérifier les permissions du manifest
- [x] Vérifier les dépendances et la configuration
- [x] Tous les tests automatisés passent ✅
- [ ] Test manuel dans Chrome Extensions (à faire par l'utilisateur)

### 8. Configuration finale (priorité basse)
- [x] Mettre à jour package.json avec les nouvelles dépendances
- [x] Configurer les permissions manifest pour le tracking
- [x] Nettoyer toutes les classes Tailwind du projet
- [x] Convertir vers CSS pur (components/ui/button.tsx, THP_WalletConnectionButton.tsx)
- [x] Vérifier que le build fonctionne sans Tailwind
- [x] Documenter le nettoyage Tailwind

## Fichiers clés à migrer
- `migration/src/background/service-worker.ts` → `background/index.ts`
- `migration/src/content/content-script.ts` → `content.ts`
- `migration/src/lib/history.ts` → `lib/history.ts`
- `migration/src/types/` → `types/`
- Composants UI adaptés sans Tailwind

## Fichiers à conserver
- `components/THP_WalletConnectionButton.tsx` (adapter le style)
- `lib/metamask.ts` (conserver tel quel)
- `popup.tsx` (étendre avec tracking)

## Permissions nécessaires
```json
{
  "permissions": [
    "storage",
    "history", 
    "tabs",
    "activeTab",
    "alarms"
  ],
  "host_permissions": ["<all_urls>"]
}
```

## Dépendances à ajouter
- Aucune nouvelle dépendance nécessaire
- Utiliser les APIs Chrome natives et React/Plasmo existants