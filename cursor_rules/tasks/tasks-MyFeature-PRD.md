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

### 📋 Résumé du Progrès Actuel
- ✅ **Extension Chrome fonctionnelle** : Service worker, popup, capture d'historique
- ✅ **Communication robuste** : Fix critique du "message port closed" entre service worker et popup 
- ✅ **Capture de données optimisée** : Rectification complète pour capturer uniquement les données essentielles
- ✅ **Interface simplifiée** : Popup épuré avec RainbowKit + Settings, logs console pour contrôle
- ✅ **Calcul automatique durée** : Tracking intelligent des visites avec durée précise

### 🎯 NOUVELLE PRIORISATION (Chef de Projet)
**🔥 PRIORITÉ 1** : Authentification RainbowKit (BASE DE TOUT)
**🔥 PRIORITÉ 2** : Dashboard Web SOFIA (INTERFACE PRINCIPALE) 
**🔥 PRIORITÉ 3** : Communication Agent1 (DONNÉES HISTORIQUE)
**🔥 PRIORITÉ 4** : Fonctionnalités avancées (APRÈS MVP)
**🔥 PRIORITÉ 5** : Interface utilisateur Extension Chrome (FINALISATION)
**🔥 PRIORITÉ 6** : Fonctionnalités premium et intelligence (OPTIONNEL)
**🔥 PRIORITÉ 7** : Tests, documentation et déploiement (FINAL)

**MVP (Minimum Viable Product)** : Priorités 1-3 suffisent pour avoir un produit fonctionnel
**Validation à chaque étape** : ✅ avant passage à la priorité suivante

- [ ] 1.0 Configuration projet et infrastructure SOFIA Extension Chrome
  - [x] 1.1 Initialiser projet Vite avec template TypeScript (`npm create vite@latest sofia-extension --template vanilla-ts`)
  - [x] 1.2 Configurer Vite pour build d'extension Chrome (vite.config.ts avec support Manifest V3)
  - [x] 1.3 Créer manifest.json avec permissions storage, history, tabs, activeTab et host_permissions
  - [x] 1.4 Compléter installation dépendances : RainbowKit, Shadcn, Chrome Types déjà installés
  - [x] 1.5 Configurer structure de dossiers src/ avec popup/, background/, content/, lib/, types/
  - [x] 1.6 Configurer ESLint et Prettier pour code quality avec règles AI-friendly
  - [x] 1.7 Rectifier le traitement des données pour capture optimisée
    - [x] 1.7.1 Modifier content-script.ts pour capturer uniquement les données DOM requises :
      - document.title (titre de la page)
      - <meta name="keywords"> (mots-clés SEO)
      - <meta name="description"> (description SEO)
      - <meta property="og:type"> (type de contenu)
      - <h1> (titre principal visible)
    - [x] 1.7.2 Modifier chrome-history.ts pour capturer uniquement les données historique requises :
      - url (adresse complète visitée)
      - lastVisitTime (dernière date de visite)
      - visitCount (nombre total de visites)
      - timestamp (date/heure de l'événement au moment de la capture)
      - duration (temps passé sur la page - calculé automatiquement)
    - [x] 1.7.3 Mettre à jour les types dans src/types/history.ts pour refléter les nouvelles données
    - [x] 1.7.4 Implémenter calcul automatique de la durée (duration) entre navigation et fermeture/changement d'onglet
    - [x] 1.7.5 Ajouter système de logs console pour contrôle et debugging des données capturées
    - [x] 1.7.6 Supprimer complètement les composants Dashboard.tsx et ChromeHistory.tsx de l'interface popup
    - [x] 1.7.7 Simplifier App.tsx pour retirer les onglets dashboard et history
    - [x] 1.7.8 Garder uniquement l'interface d'authentification RainbowKit et les settings dans le popup
    - [x] 1.7.9 Rediriger toutes les données capturées vers les logs console pour visualisation
    - [x] 1.7.10 Tester la capture optimisée et vérifier les logs console
  - [ ] 1.8 Intégration des logs de navigation avec Agent Eliza OS (PRIORITÉ)
    - [ ] 1.8.1 Créer service de réception des données dans my-agent/src/services/navigation-receiver.ts
    - [ ] 1.8.2 Définir endpoint API REST /api/navigation-data dans l'agent Eliza OS
    - [ ] 1.8.3 Configurer schéma de données NavigationLog avec validation Zod
    - [ ] 1.8.4 Modifier service-worker.ts pour ajouter fonction sendToEliza() 
    - [ ] 1.8.5 Implémenter envoi HTTP POST vers agent local (http://localhost:3000/api/navigation-data)
    - [ ] 1.8.6 Ajouter http://localhost:3000 aux permissions manifest.json
    - [ ] 1.8.7 Configurer CORS dans l'agent pour accepter requêtes extension Chrome
    - [ ] 1.8.8 Implémenter système de retry et gestion d'erreurs réseau
    - [ ] 1.8.9 Ajouter toggle ON/OFF envoi vers Eliza dans les settings popup
    - [ ] 1.8.10 Créer logs de debug pour traçage communication Extension ↔ Agent
    - [ ] 1.8.11 Implémenter stockage local temporaire si agent indisponible
    - [ ] 1.8.12 Ajouter indicateur visuel connexion agent dans popup (vert/rouge)
    - [ ] 1.8.13 Tester pipeline complet: Extension → Service Worker → Agent Eliza OS
    - [ ] 1.8.14 Documenter format données et API dans docs/eliza-integration.md

- [ ] 2.0 🔥 PRIORITÉ 1 : Authentification RainbowKit (BASE DE TOUT) 
  - [ ] 2.1 Configurer RainbowKit dans src/lib/rainbowkit-config.ts avec providers
  - [ ] 2.2 Créer WalletState interface et types dans src/types/wallet.ts
  - [ ] 2.3 Développer composant RainbowKitConnect.tsx avec support multi-wallets
  - [ ] 2.4 Implémenter persistance session avec Chrome Storage API
  - [ ] 2.5 Intégrer authentification dans popup App.tsx (remplacer LandingPage)
  - [ ] 2.6 Ajouter gestion d'erreurs de connexion avec messages utilisateur clairs
  - [ ] 2.7 Afficher adresse wallet tronquée (0x1234...abcd) dans interface
  - [ ] 2.8 Implémenter déconnexion avec nettoyage storage
  - [ ] 2.9 Écrire tests unitaires pour RainbowKitConnect.test.tsx
  - [ ] 2.10 ✅ VALIDATION : Tester authentification sur différents wallets avant passage PRIORITÉ 2

- [ ] 3.0 🔥 PRIORITÉ 2 : Dashboard Web SOFIA (INTERFACE PRINCIPALE)
  - [ ] 3.1 Configuration infrastructure dashboard web
    - [ ] 3.1.1 Créer nouveau projet Vite React dans dashboard/ séparé de l'extension
    - [ ] 3.1.2 Installer dépendances : React, TypeScript, Tailwind CSS, Framer Motion, Lucide React
    - [ ] 3.1.3 Configurer Tailwind CSS avec configuration personnalisée SOFIA
    - [ ] 3.1.4 Implémenter composant SofIADashboard basé sur dashboard.md fourni (avec données mockées)
    - [ ] 3.1.5 Configurer serveur de développement local (port 3001)
    - [ ] 3.1.6 Ajouter CORS pour communication avec extension Chrome
  
  - [ ] 3.2 Intégration bouton dashboard dans extension Chrome
    - [ ] 3.2.1 Ajouter bouton "Open Dashboard" dans popup principal App.tsx
    - [ ] 3.2.2 Implémenter fonction openDashboard() dans service-worker.ts
    - [ ] 3.2.3 Configurer ouverture nouvel onglet vers dashboard web (http://localhost:3001)
    - [ ] 3.2.4 Synchroniser état wallet entre extension et dashboard
    - [ ] 3.2.5 Créer indicateur visuel statut dashboard (disponible/indisponible)
    - [ ] 3.2.6 ✅ VALIDATION : Dashboard fonctionnel avec wallet sync avant passage PRIORITÉ 3

- [ ] 4.0 🔥 PRIORITÉ 3 : Communication Agent1 (DONNÉES HISTORIQUE)
  - [ ] 4.1 [Human] Configurer Agent1 (History Analysis) dans my-agent/
  - [ ] 4.2 Créer endpoint /api/navigation-data dans Agent1 Eliza OS
  - [ ] 4.3 Implémenter envoi données depuis service-worker vers Agent1
  - [ ] 4.4 Créer API REST endpoint dans dashboard pour recevoir données extension
  - [ ] 4.5 Configurer authentification par token entre extension et dashboard
  - [ ] 4.6 Remplacer données mockées par vraies données historique Chrome
  - [ ] 4.7 Adapter métriques : Visites totales, durée moyenne, sites les plus visités
  - [ ] 4.8 Implémenter graphique radial avec vraies catégories de sites web
  - [ ] 4.9 Créer système de catégorisation automatique des sites (dev, social, news, etc.)
  - [ ] 4.10 Adapter composant History avec vraies données Chrome History
  - [ ] 4.11 Écrire tests unitaires pour communication Extension ↔ Agent1 ↔ Dashboard
  - [ ] 4.12 ✅ VALIDATION : Pipeline complet Extension → Agent1 → Dashboard avec vraies données

- [ ] 5.0 🔥 PRIORITÉ 4 : Fonctionnalités avancées (APRÈS MVP)
  - [ ] 5.1 Intégration Chatbot avec Agent2 (Recommendations)
    - [ ] 5.1.1 [Human] Configurer Agent2 (Recommendations) dans my-agent/
    - [ ] 5.1.2 Adapter composant ChatBot pour communication avec Agent2
    - [ ] 5.1.3 Configurer endpoint WebSocket ou API REST vers Agent2
    - [ ] 5.1.4 Implémenter queries chatbot : "Analyze my browsing patterns", "Give recommendations"
    - [ ] 5.1.5 Créer interface pour afficher analyses d'Agent1 (clusters de recherche)
    - [ ] 5.1.6 Ajouter commandes chatbot spéciales : /history, /categories, /recommendations

  - [ ] 5.2 Intégration Gaianet LLM et services avancés
    - [ ] 5.2.1 [Human] Configurer Gaianet pour services LLM et obtenir clés API
    - [ ] 5.2.2 Installer et configurer Gaianet SDK dans src/lib/gaianet-integration.ts
    - [ ] 5.2.3 [Human] Configurer Agent2 (Recommendations) avec connexion Gaianet LLM
    - [ ] 5.2.4 Implémenter communication Agent2 → Dashboard pour "Give Recommendations"
    - [ ] 5.2.5 Développer dashboard affichage recommandations contextuelles d'Agent2

  - [ ] 5.3 Intégration Intuition.systems Knowledge Graph
    - [ ] 5.3.1 [Human] Configurer compte Intuition.systems et Smart Contract
    - [ ] 5.3.2 Installer intuition-ts SDK et MCP client dans src/lib/mcp-client.ts
    - [ ] 5.3.3 Développer communication MCP Agent2 → Indexer pour "request user graph"
    - [ ] 5.3.4 Implémenter Agent1 → Smart Contract pour "invite to add data to knowledge graph"
    - [ ] 5.3.5 Créer interface Smart Contract → Knowledge Graph pour "create read update"
    - [ ] 5.3.6 Ajouter section "Digital Identity" avec données Intuition.systems
    - [ ] 5.3.7 Implémenter visualisation Knowledge Graph personnel

  - [ ] 5.4 Fonctionnalités dashboard avancées
    - [ ] 5.4.1 Implémenter graphiques temporels d'activité (par heure/jour/semaine)
    - [ ] 5.4.2 Créer heatmap de navigation par domaines et temps
    - [ ] 5.4.3 Ajouter détection automatique habitudes et patterns
    - [ ] 5.4.4 Implémenter alertes personnalisées (temps excessif sur certains sites)
    - [ ] 5.4.5 Créer système de goals et tracking objectifs de navigation
    - [ ] 5.4.6 Ajouter comparaisons période (cette semaine vs semaine précédente)
    - [ ] 5.4.7 Implémenter mode dark/light avec persistance préférences
    - [ ] 5.4.8 Ajouter filtres temporels : Aujourd'hui, Cette semaine, Ce mois
    - [ ] 5.4.9 Implémenter recherche et filtrage dans historique

  - [ ] 5.5 ✅ VALIDATION : Tests d'intégration pour fonctionnalités avancées

- [ ] 6.0 🔥 PRIORITÉ 5 : Interface utilisateur Extension Chrome (FINALISATION)
  - [ ] 6.1 Optimiser popup principal App.tsx avec layout 400x600px
  - [ ] 6.2 Intégrer Shadcn provider et thème cohérent SOFIA
  - [ ] 6.3 Ajouter contrôles toggle pour capture historique
  - [ ] 6.4 Créer page Options pour configuration agents et filtres
  - [ ] 6.5 Développer indicateurs visuels connexion Eliza OS / Gaianet / Intuition
  - [ ] 6.6 Optimiser interface responsive et UX pour extension Chrome
  - [ ] 6.7 Écrire tests unitaires pour tous composants UI
  - [ ] 6.8 [Human] Tester expérience utilisateur complète selon architecture

- [ ] 7.0 🔥 PRIORITÉ 6 : Fonctionnalités premium et intelligence (OPTIONNEL)
  - [ ] 7.1 Développer journal assisté avec classification automatique
  - [ ] 7.2 Implémenter planificateur intelligent basé sur patterns
  - [ ] 7.3 Créer système de bookmarks décentralisés cross-device
  - [ ] 7.4 Ajouter détection automatique moments mémorables via IA
  - [ ] 7.5 Développer interface Web3 pour staking ETH sur signaux
  - [ ] 7.6 Implémenter système de récompenses pour contribution knowledge graph
  - [ ] 7.7 Créer filtres cognitifs personnalisés pour l'information
  - [ ] 7.8 Ajouter suggestions de connexions avec autres utilisateurs SOFIA
  - [ ] 7.9 [Human] Optimiser prompts IA et personnalité agent avec feedback utilisateurs
  - [ ] 7.10 Écrire tests d'intégration pour fonctionnalités avancées

- [ ] 8.0 🔥 PRIORITÉ 7 : Tests, documentation et déploiement (FINAL)
  - [ ] 8.1 Développer suite de tests d'intégration complète (Extension ↔ Dashboard ↔ Agent1 ↔ Agent2 ↔ Gaianet ↔ Intuition)
  - [ ] 8.2 Créer tests de performance et optimisation mémoire/CPU pour tous composants
  - [ ] 8.3 [Human] Tester architecture complète sur différents environnements (Windows, Mac, Linux)
  - [ ] 8.4 Rédiger documentation complète dans README.md avec diagramme architecture
  - [ ] 8.5 Créer guide d'installation Agent1 et Agent2 Eliza OS dans docs/eliza-agents-setup.md
  - [ ] 8.6 Documenter intégration Gaianet LLM dans docs/gaianet-integration.md
  - [ ] 8.7 Documenter MCP et Intuition.systems dans docs/intuition-mcp-setup.md
  - [ ] 8.8 Documenter architecture dashboard dans docs/dashboard-architecture.md
  - [ ] 8.9 Préparer assets et descriptions pour Chrome Web Store
  - [ ] 8.10 Créer demo script montrant flux Extension → Dashboard → Agents → Intuition
  - [ ] 8.11 [Human] Configurer environnement production (Dashboard + Eliza OS + Agent1 + Agent2 + Gaianet + Intuition)
  - [ ] 8.12 [Human] Déployer beta version et tests avec early adopters
  - [ ] 8.13 [Human] Publier sur Chrome Web Store après validation complète architecture
    - [ ] 8.14 [Human] Documenter métriques de succès et monitoring pipeline complet 