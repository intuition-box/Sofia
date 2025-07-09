# Tasks pour Extension Chrome SOFIA - Connexion Wallet & Suivi Historique

## Relevant Files

- `manifest.json` - Manifeste Chrome V3 avec permissions storage, history, tabs, activeTab
- `src/background/service-worker.ts` - Service worker principal pour capture navigation et communication
- `src/popup/App.tsx` - Interface popup principale avec connexion wallet et dashboard  
- `src/popup/components/WalletConnect.tsx` - Composant RainbowKit pour connexion wallet
- `src/popup/components/Dashboard.tsx` - Dashboard d'affichage de l'historique et stats
- `src/content/content-script.ts` - Script de contenu pour injection dans les pages web
- `src/lib/storage.ts` - Gestionnaire Chrome Storage API pour données JSON
- `src/lib/history.ts` - Gestionnaire Chrome History API et capture navigation
- `src/lib/eliza-integration.ts` - Interface de communication avec Eliza OS
- `src/types/index.ts` - Types TypeScript pour WalletState, NavigationEntry, HistoryData
- `src/popup/App.test.tsx` - Tests unitaires pour composant principal
- `src/lib/storage.test.ts` - Tests unitaires pour gestionnaire de stockage
- `src/lib/history.test.ts` - Tests unitaires pour capture d'historique
- `package.json` - Dépendances Vite, TypeScript, RainbowKit, Shadcn
- `vite.config.ts` - Configuration Vite pour build d'extension Chrome
- `README.md` - Documentation d'installation et utilisation
- `docs/integration-eliza.md` - Guide d'intégration avec Eliza OS

### Notes
- Les tests unitaires sont placés aux côtés des fichiers qu'ils testent
- Utiliser `npm test` pour exécuter tous les tests Jest
- L'extension suit le Manifest V3 de Chrome avec service workers

## Tasks

- [ ] 1.0 Configuration projet et infrastructure Extension Chrome
  - [x] 1.1 Initialiser projet Vite avec template TypeScript (`npm create vite@latest sofia-extension --template vanilla-ts`)
  - [x] 1.2 Configurer Vite pour build d'extension Chrome (vite.config.ts avec support Manifest V3)
  - [x] 1.3 Créer manifest.json avec permissions storage, history, tabs, activeTab et host_permissions
  - [x] 1.4 Installer dépendances principales : RainbowKit, Shadcn, Chrome Types
  - [ ] 1.5 Configurer structure de dossiers src/ avec popup/, background/, content/, lib/, types/
  - [ ] 1.6 Configurer Jest pour tests unitaires et setup @testing-library/react
  - [ ] 1.7 Configurer ESLint et Prettier pour code quality
  - [ ] 1.8 Créer scripts package.json pour build, dev, test et lint

- [ ] 2.0 Implémentation connexion Wallet avec RainbowKit
  - [ ] 2.1 Configurer RainbowKit dans src/lib/wallet-config.ts
  - [ ] 2.2 Créer WalletState interface et types dans src/types/wallet.ts
  - [ ] 2.3 Développer composant WalletConnect.tsx avec support MetaMask, WalletConnect, Coinbase
  - [ ] 2.4 Implémenter persistance session wallet avec Chrome Storage API
  - [ ] 2.5 Ajouter gestion d'erreurs de connexion avec messages utilisateur clairs
  - [ ] 2.6 Créer fonction de déconnexion avec nettoyage storage
  - [ ] 2.7 Afficher adresse wallet tronquée (0x1234...abcd) dans interface
  - [ ] 2.8 Écrire tests unitaires pour WalletConnect.test.tsx
  - [ ] 2.9 Tester connexion sur différents wallets et gérer les edge cases

- [ ] 3.0 Développement système de suivi historique navigation
  - [ ] 3.1 Créer NavigationEntry et HistoryData interfaces dans src/types/history.ts
  - [ ] 3.2 Développer service worker background pour capture d'événements tabs/history
  - [ ] 3.3 Implémenter Chrome History API wrapper dans src/lib/history.ts
  - [ ] 3.4 Créer système de filtrage pour sites sensibles (banking, private)
  - [ ] 3.5 Ajouter calcul durée de visite et détection de domaine
  - [ ] 3.6 Développer gestionnaire Chrome Storage pour données JSON structurées
  - [ ] 3.7 Implémenter toggle ON/OFF tracking avec settings persistants
  - [ ] 3.8 Ajouter fonction d'export JSON et reset/clear données
  - [ ] 3.9 Gérer compression données pour optimiser espace storage
  - [ ] 3.10 Écrire tests unitaires pour history.test.ts et storage.test.ts
  - [ ] 3.11 Tester capture en temps réel et performance sur navigation intensive

- [ ] 4.0 Création interface utilisateur et dashboard
  - [ ] 4.1 Développer popup principal App.tsx avec layout 400x600px optimisé
  - [ ] 4.2 Intégrer Shadcn provider et thème sombre/clair
  - [ ] 4.3 Créer Dashboard.tsx avec stats de navigation et graphiques simples
  - [ ] 4.4 Développer page Options pour configuration avancée
  - [ ] 4.5 Afficher sites les plus visités avec durées et catégories
  - [ ] 4.6 Ajouter status de connexion wallet visible en permanence
  - [ ] 4.7 Créer boutons d'export JSON et reset données avec confirmations
  - [ ] 4.8 Implémenter toggle de tracking avec indicateur visuel
  - [ ] 4.9 Optimiser interface responsive et UX pour popup extension
  - [ ] 4.10 Écrire tests unitaires pour composants App.test.tsx et Dashboard.test.tsx
  - [ ] 4.11 [Human] Tester interface utilisateur sur différentes résolutions d'écran

- [ ] 5.0 Intégration Eliza OS et agents IA
  - [ ] 5.1 [Human] Installer et configurer Eliza OS en local selon documentation
  - [ ] 5.2 Créer interface de communication src/lib/eliza-integration.ts
  - [ ] 5.3 Développer Agent1 (History Analysis) pour analyse sémantique historique
  - [ ] 5.4 Configurer pipeline données : Extension → Eliza OS → SQLite.db
  - [ ] 5.5 Développer Agent2 (Recommendations) avec intégration Gaianet
  - [ ] 5.6 Implémenter communication bidirectionnelle Extension ↔ Eliza OS
  - [ ] 5.7 Créer clustering automatique des recherches et intérêts
  - [ ] 5.8 Ajouter recommandations contextuelles en temps réel dans dashboard
  - [ ] 5.9 [Human] Configurer Gaianet pour LLM de recommandations
  - [ ] 5.10 Gérer fallback et mode offline quand Eliza OS indisponible
  - [ ] 5.11 Écrire tests d'intégration pour communication avec Eliza OS
  - [ ] 5.12 [Human] Documenter setup et configuration Eliza OS dans docs/integration-eliza.md 