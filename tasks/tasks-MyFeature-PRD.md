# Tasks pour SOFIA - Your Personal AI Agent for the Web

## Relevant Files

- `manifest.json` - Manifeste Chrome V3 avec permissions storage, history, tabs, activeTab et host_permissions
- `src/background/service-worker.ts` - Service worker principal pour capture intelligente et communication avec Eliza OS
- `src/popup/App.tsx` - Interface popup principale avec authentification RainbowKit et dashboard SOFIA  
- `src/popup/components/RainbowKitConnect.tsx` - Composant RainbowKit pour authentification wallet
- `src/popup/components/Dashboard.tsx` - Dashboard principal pour visualiser historique et recommandations
- `src/popup/components/LandingPage.tsx` - Page d'accueil avec bouton "Get Button" pour onboarding
- `src/popup/components/ChromeHistory.tsx` - Composant d'affichage et gestion de l'historique Chrome
- `src/content/content-script.ts` - Script de contenu pour détection contextuelle et moments mémorables
- `src/lib/storage.ts` - Gestionnaire Chrome Storage API et envoi périodique vers Agent1
- `src/lib/chrome-history.ts` - Capture et gestion Chrome History API
- `src/lib/rainbowkit-config.ts` - Configuration RainbowKit avec providers wallet
- `src/lib/agent-client.ts` - Client HTTP pour envoi données vers Agent1 API REST locale
- `src/lib/eliza-agents.ts` - Interface communication avec Agent1 (History Analysis) et Agent2 (Recommendations)
- `src/lib/gaianet-integration.ts` - Interface Gaianet pour services LLM
- `src/lib/mcp-client.ts` - Client MCP pour communication avec Indexer Intuition
- `src/lib/intuition-integration.ts` - Interface Intuition.systems Smart Contract et Knowledge Graph
- `src/types/index.ts` - Types TypeScript pour DigitalIdentity, Atom, KnowledgeGraph
- `src/types/history.ts` - Types NavigationEntry et HistoryData pour historique Chrome
- `src/types/wallet.ts` - Types WalletState et authentification RainbowKit
- `src/popup/App.test.tsx` - Tests unitaires pour composant principal
- `src/lib/agent-client.test.ts` - Tests unitaires pour client HTTP Agent1
- `src/lib/chrome-history.test.ts` - Tests unitaires pour capture historique Chrome
- `src/popup/components/RainbowKitConnect.test.tsx` - Tests unitaires pour composant RainbowKit
- `src/lib/eliza-agents.test.ts` - Tests unitaires pour communication agents Eliza OS
- `src/lib/gaianet-integration.test.ts` - Tests unitaires pour intégration Gaianet
- `src/lib/mcp-client.test.ts` - Tests unitaires pour client MCP
- `src/lib/intuition-integration.test.ts` - Tests unitaires pour Intuition.systems
- `package.json` - Dépendances Vite, TypeScript, RainbowKit, Shadcn, Eliza OS, Gaianet
- `vite.config.ts` - Configuration Vite pour build d'extension Chrome avec intégrations
- `my-agent/package.json` - Configuration agent Eliza OS pour SOFIA avec SQLite local pour Agent1
- `my-agent/src/index.ts` - Point d'entrée Agent1 API REST locale et Agent2 avec Gaianet LLM
- `README.md` - Documentation d'installation et utilisation
- `docs/eliza-agents-setup.md` - Guide d'installation Agent1 et Agent2 Eliza OS
- `docs/gaianet-integration.md` - Guide intégration Gaianet LLM
- `docs/intuition-mcp-setup.md` - Guide MCP et Intuition.systems

### Notes
- Les tests unitaires sont placés aux côtés des fichiers qu'ils testent
- Utiliser `npm test` pour exécuter tous les tests Jest
- L'extension suit le Manifest V3 de Chrome avec service workers
- Agent1 et Agent2 Eliza OS fonctionnent en parallèle avec fetch/API pour intelligence contextuelle

## Tasks

- [ ] 1.0 Configuration projet et infrastructure SOFIA Extension Chrome
  - [x] 1.1 Initialiser projet Vite avec template TypeScript (`npm create vite@latest sofia-extension --template vanilla-ts`)
  - [x] 1.2 Configurer Vite pour build d'extension Chrome (vite.config.ts avec support Manifest V3)
  - [x] 1.3 Créer manifest.json avec permissions storage, history, tabs, activeTab et host_permissions
  - [ ] 1.4 Compléter installation dépendances : RainbowKit, Shadcn, Chrome Types déjà installés
  - [x] 1.5 Configurer structure de dossiers src/ avec popup/, background/, content/, lib/, types/
  - [ ] 1.6 Configurer Jest pour tests unitaires et setup @testing-library/react
  - [ ] 1.7 Configurer ESLint et Prettier pour code quality avec règles AI-friendly
  - [ ] 1.8 Créer scripts package.json pour build, dev, test, lint et agent Eliza OS

- [ ] 2.0 Implémentation authentification RainbowKit et identité numérique
  - [ ] 2.1 Configurer RainbowKit dans src/lib/rainbowkit-config.ts avec providers
  - [ ] 2.2 Créer WalletState interface et types dans src/types/wallet.ts  
  - [ ] 2.3 Développer LandingPage.tsx avec bouton "Get Button" pour onboarding
  - [ ] 2.4 Développer composant RainbowKitConnect.tsx avec support multi-wallets
  - [ ] 2.5 Implémenter persistance session avec Chrome Storage API
  - [ ] 2.6 Ajouter gestion d'erreurs de connexion avec messages utilisateur clairs
  - [ ] 2.7 Afficher adresse wallet tronquée (0x1234...abcd) dans interface
  - [ ] 2.8 Implémenter déconnexion avec nettoyage storage
  - [ ] 2.9 Écrire tests unitaires pour RainbowKitConnect.test.tsx
  - [ ] 2.10 Tester authentification sur différents wallets (MetaMask, WalletConnect, Coinbase)

- [ ] 3.0 Développement système de capture Chrome History et communication Eliza OS
  - [ ] 3.1 Créer NavigationEntry et HistoryData interfaces dans src/types/history.ts
  - [ ] 3.2 [Human] Configurer Agent1 (History Analysis) et Agent2 (Recommendations) dans my-agent/
  - [ ] 3.3 Développer composant ChromeHistory.tsx pour affichage historique Chrome
  - [ ] 3.4 Implémenter capture Chrome History API dans src/lib/chrome-history.ts
  - [ ] 3.5 Créer API REST endpoint dans extension pour exposer données historique  
  - [ ] 3.6 Implémenter Agent1 fetch vers API extension pour récupération données
  - [ ] 3.7 Configurer CORS et authentification pour sécuriser communication Agent1 ↔ Extension
  - [ ] 3.8 Ajouter système de filtrage pour sites sensibles avant exposition via API
  - [ ] 3.9 Créer toggle ON/OFF capture historique avec indicateur visuel
  - [ ] 3.10 Développer Dashboard.tsx pour affichage clusters de recherche d'Agent1
  - [ ] 3.11 Implémenter communication Agent1 → Dashboard pour "show cluster of past research"
  - [ ] 3.12 Écrire tests unitaires pour api-server.test.ts et eliza-agents.test.ts
  - [ ] 3.13 [Human] Tester pipeline complet Extension API ← Agent1 (fetch) → Analyse

- [ ] 4.0 Intégration Agent2 (Recommendations), Gaianet et Intuition.systems
  - [ ] 4.1 [Human] Configurer Gaianet pour services LLM et obtenir clés API
  - [ ] 4.2 Installer et configurer Gaianet SDK dans src/lib/gaianet-integration.ts
  - [ ] 4.3 [Human] Configurer Agent2 (Recommendations) avec connexion Gaianet LLM
  - [ ] 4.4 Implémenter communication Agent2 → Dashboard pour "Give Recommendations"
  - [ ] 4.5 [Human] Configurer compte Intuition.systems et Smart Contract
  - [ ] 4.6 Installer intuition-ts SDK et MCP client dans src/lib/mcp-client.ts
  - [ ] 4.7 Développer communication MCP Agent2 → Indexer pour "request user graph"
  - [ ] 4.8 Implémenter Agent1 → Smart Contract pour "invite to add data to knowledge graph"
  - [ ] 4.9 Créer interface Smart Contract → Knowledge Graph pour "create read update"
  - [ ] 4.10 Développer dashboard affichage recommandations contextuelles d'Agent2
  - [ ] 4.11 Écrire tests unitaires pour gaianet-integration.test.ts et mcp-client.test.ts
  - [ ] 4.12 [Human] Tester pipeline complet Agent2 ↔ Gaianet ↔ Indexer ↔ Knowledge Graph

- [ ] 5.0 Interface utilisateur Extension Chrome
  - [ ] 5.1 Développer popup principal App.tsx avec layout 400x600px optimisé
  - [ ] 5.2 Intégrer Shadcn provider et thème cohérent SOFIA
  - [ ] 5.3 Finaliser LandingPage.tsx avec onboarding et "Get Button"
  - [ ] 5.4 Perfectionner Dashboard.tsx pour historique et recommandations
  - [ ] 5.5 Optimiser ChromeHistory.tsx pour visualisation navigation
  - [ ] 5.6 Intégrer RainbowKit dans interface avec état wallet visible
  - [ ] 5.7 Implémenter affichage recommandations temps réel d'Agent2
  - [ ] 5.8 Ajouter contrôles toggle pour capture historique
  - [ ] 5.9 Créer page Options pour configuration agents et filtres
  - [ ] 5.10 Développer indicateurs visuels connexion Eliza OS / Gaianet / Intuition
  - [ ] 5.11 Optimiser interface responsive et UX pour extension Chrome
  - [ ] 5.12 Écrire tests unitaires pour tous composants UI
  - [ ] 5.13 [Human] Tester expérience utilisateur complète selon architecture

- [ ] 6.0 Fonctionnalités avancées et intelligence
  - [ ] 6.1 Développer journal assisté avec classification automatique
  - [ ] 6.2 Implémenter planificateur intelligent basé sur patterns
  - [ ] 6.3 Créer système de bookmarks décentralisés cross-device
  - [ ] 6.4 Ajouter détection automatique moments mémorables via IA
  - [ ] 6.5 Développer interface Web3 pour staking ETH sur signaux
  - [ ] 6.6 Implémenter système de récompenses pour contribution knowledge graph
  - [ ] 6.7 Créer filtres cognitifs personnalisés pour l'information
  - [ ] 6.8 Ajouter suggestions de connexions avec autres utilisateurs SOFIA
  - [ ] 6.9 [Human] Optimiser prompts IA et personnalité agent avec feedback utilisateurs
  - [ ] 6.10 Écrire tests d'intégration pour fonctionnalités avancées

- [ ] 7.0 Tests, documentation et déploiement
  - [ ] 7.1 Développer suite de tests d'intégration complète (Extension ↔ Agent1 ↔ Agent2 ↔ Gaianet ↔ Intuition)
  - [ ] 7.2 Créer tests de performance et optimisation mémoire/CPU pour tous composants
  - [ ] 7.3 [Human] Tester architecture complète sur différents environnements (Windows, Mac, Linux)
  - [ ] 7.4 Rédiger documentation complète dans README.md avec diagramme architecture
  - [ ] 7.5 Créer guide d'installation Agent1 et Agent2 Eliza OS dans docs/eliza-agents-setup.md
  - [ ] 7.6 Documenter intégration Gaianet LLM dans docs/gaianet-integration.md
  - [ ] 7.7 Documenter MCP et Intuition.systems dans docs/intuition-mcp-setup.md
  - [ ] 7.8 Préparer assets et descriptions pour Chrome Web Store
  - [ ] 7.9 Créer demo script montrant flux Extension → Agents → Intuition
  - [ ] 7.10 [Human] Configurer environnement production (Hébergeur: Eliza OS + Agent1 + Agent2 + Gaianet + Intuition)
  - [ ] 7.11 [Human] Déployer beta version et tests avec early adopters
  - [ ] 7.12 [Human] Publier sur Chrome Web Store après validation complète architecture
  - [ ] 7.13 [Human] Documenter métriques de succès et monitoring pipeline complet 