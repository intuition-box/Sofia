# 📋 PRD - Extension Chrome SOFIA : Connexion Wallet & Suivi Historique

## 🎯 Vue d'ensemble du produit

### Description
Développement d'une extension Chrome permettant aux utilisateurs de connecter leur portefeuille crypto via RainbowKit et de suivre automatiquement leur historique de navigation web pour créer un profil d'intérêts personnalisé.

### Objectifs
- Simplifier l'onboarding Web3 via une connexion wallet intuitive
- Capturer automatiquement l'activité de navigation de l'utilisateur
- Créer une base de données locale JSON pour l'analyse comportementale
- Préparer l'intégration future avec l'écosystème Intuition.systems

---

## 👥 Utilisateurs cibles

### Persona principal
- **Crypto-curieux** : Utilisateurs familiers avec les wallets mais nouveaux aux extensions Web3
- **Chercheurs/Étudiants** : Personnes voulant structurer leurs recherches web
- **Early adopters** : Utilisateurs intéressés par la décentralisation des données personnelles

### Besoins utilisateurs
- Connexion wallet simple et sécurisée
- Contrôle sur les données collectées
- Interface claire pour visualiser l'activité

---

## 🔧 Spécifications techniques

### Architecture
```
Extension Chrome (Manifest V3)
├── Background Script (Service Worker)
├── Content Scripts (Injection pages web)
├── Popup Interface (Shadcn UI)
├── Options Page (Configuration)
└── Local Storage (Chrome API)
```

### Stack technique
- **Framework** : Vite + TypeScript
- **UI** : Chakra UI / Shadcn UI
- **Auth Web3** : RainbowKit + Wagmi
- **Storage** : Chrome Storage API
- **APIs** : Chrome History API, Chrome Tabs API

---

## 📋 Fonctionnalités détaillées

### 🔐 F1 - Connexion Wallet (Priorité 1)
**Description** : Interface de connexion via RainbowKit

**User Stories :**
- En tant qu'utilisateur, je veux connecter mon wallet MetaMask facilement
- En tant qu'utilisateur, je veux voir mon adresse de wallet
- En tant qu'utilisateur, je veux pouvoir me déconnecter à tout moment


**Critères d'acceptation :**
- ✅ Support MetaMask, WalletConnect, Coinbase Wallet
- ✅ Affichage adresse tronquée (0x1234...abcd)
- ✅ Gestion des erreurs de connexion
- ✅ Persistance de la session (local storage)
- ✅ Button de déconnexion visible



**Spécifications techniques :**
```typescript
interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number;
}
```

### 📊 F2 - Suivi Historique Navigation (Priorité 1)
**Description** : Capture automatique de l'historique de navigation

**User Stories :**
- En tant qu'utilisateur, je veux que l'extension suive mes visites de sites automatiquement
- En tant qu'utilisateur, je veux pouvoir activer/désactiver le suivi
- En tant qu'utilisateur, je veux voir un résumé de mon activité dans un dashboard (page web)

**Critères d'acceptation :**
- ✅ Capture URL, titre, timestamp, durée de visite
- ✅ Filtrage des sites sensibles (ex: banking, private)
- ✅ Toggle ON/OFF dans l'interface d'extension
- ✅ Respect des permissions Chrome


**Spécifications techniques :**
```typescript
interface NavigationEntry {
  id: string;
  url: string;
  title: string;
  domain: string;
  timestamp: number;
  duration?: number; // en secondes
  category?: string; // auto-détectée
}

interface HistoryData {
  entries: NavigationEntry[];
  settings: {
    trackingEnabled: boolean;
    excludedDomains: string[];
    retentionDays: number;
  };
}
```

### 📁 F3 - Stockage JSON Local (Priorité 1)
**Description** : Gestion des données en local avec structure JSON

**User Stories :**
- En tant qu'utilisateur, je veux que mes données soient stockées localement
- En tant qu'utilisateur, je veux que mes données soit exportés vers Eliza OS


**Critères d'acceptation :**
- ✅ Stockage via Chrome Storage API
- ✅ Structure JSON lisible et extensible
- ✅ Fonction d'export (téléchargement .json)
- ✅ Fonction de reset/clear
- ✅ Compression pour optimiser l'espace

### 🎨 F4 - Interface Utilisateur (Priorité 2)
**Description** : Dashboard simple dans le popup de l'extension

**User Stories :**
- En tant qu'utilisateur, je veux voir un résumé de mon activité
- En tant qu'utilisateur, je veux accéder aux paramètres facilement
- En tant qu'utilisateur, je veux une interface moderne et responsive
- En tant qu'utilisateur, je veux qu'Eliza OS me fasse des recommandations par rapport à mes dernières activités

**Critères d'acceptation :**
- ✅ Popup 400x600px optimisé
- ✅ Page d'options complète
- ✅ Thème sombre/clair
- ✅ Graphiques simples (sites les plus visités)
- ✅ Status de connexion wallet visible

---

## 🔒 Sécurité & Conformité

### Permissions Chrome requises
```json
{
  "permissions": [
    "storage",
    "history", 
    "tabs",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

### Considérations RGPD
- ✅ Consentement explicite pour le tracking
- ✅ Droit à l'effacement (bouton reset)
- ✅ Droit à la portabilité (export JSON)
- ✅ Transparence sur les données collectées

### Sécurité Web3
- ✅ Pas de stockage de clés privées
- ✅ Validation des signatures
- ✅ Protection contre les attaques XSS
- ✅ Isolation des domaines

---

## 📈 Métriques de succès

### KPIs techniques
- Temps de connexion wallet < 3 secondes
- Taux d'erreur de connexion < 2%
- Performance : < 1MB RAM utilisé
- Collecte : 95% des navigation capturées

### KPIs utilisateur
- Taux d'adoption : 70% des utilisateurs connectent leur wallet
- Rétention 7 jours : 40%
- Données collectées : Moyenne 50 entrées/utilisateur/jour

---

# 🗓️ Roadmap SOFIA - Intégration complète avec Eliza OS

## Sprint 1 (Semaines 1-2) - Fondations & Connexion
- Setup projet Vite + Chrome Extension (Manifest V3)
- Intégration RainbowKit pour connexion wallet
- Interface popup minimale avec Chakra UI
- **Setup infrastructure Eliza OS locale**
- **Configuration agents de base (Agent1 + Agent2)**
- Capture basique de l'historique Chrome (JSON local)

## Sprint 2 (Semaines 3-4) - Agent 1 : Analyse Historique
- Implémentation Chrome History API complète
- **Intégration Agent1 (History Analysis) avec Eliza OS**
- **Pipeline de données : Extension → Eliza OS → SQLite.db**
- Background script pour capture automatique
- **Première analyse sémantique de l'historique via Agent1**
- Interface de visualisation des clusters de recherche

## Sprint 3 (Semaines 5-6) - Agent 2 : Recommandations
- **Intégration Agent2 (Recommendations) avec Eliza OS**
- **Connexion Gaianet pour le LLM de recommandations**
- Algorithme de recommandations basé sur l'analyse Agent1
- Dashboard affichant les recommandations personnalisées
- **Communication bidirectionnelle Extension ↔ Eliza OS**

## Sprint 4 (Semaines 7-8) - Intuition.systems MVP
- **Intégration Smart Contract Intuition**
- **Setup Indexer pour lecture des données on-chain**
- Transformation des données locales en "atoms" de connaissance
- Interface utilisateur pour mode privé/public par entrée
- **Pipeline complet : Chrome → Eliza → Intuition → Knowledge Graph**

## Sprint 5 (Semaines 9-10) - Intelligence Avancée
- **Optimisation des prompts agents avec Gaianet**
- Détection automatique de "moments mémorables"
- Classification automatique des intérêts (catégories)
- **Agent1 : Clustering avancé des recherches passées**
- **Agent2 : Recommandations contextuelles en temps réel**

## Sprint 6 (Semaines 11-12) - Knowledge Graph
- **Visualisation du Knowledge Graph personnel**
- Interface pour explorer les triplets de connaissances
- **Système de signaux (voting) sur les atoms via Intuition**
- Export/import du graphe personnel
- **Synchronisation cross-device via blockchain**

## Sprint 7 (Semaines 13-14) - Polish & Production
- **Optimisation performance Eliza OS (memory, CPU)**
- Interface utilisateur finale (UX/UI)
- **Gestion d'erreurs réseau (Eliza ↔ Gaianet ↔ Intuition)**
- Tests de charge et optimisation
- Documentation complète pour déploiement

## Sprint 8 (Semaines 15-16) - Déploiement
- **Configuration production Eliza OS + Gaianet**
- Préparation Chrome Web Store
- **Tests d'intégration complète (End-to-End)**
- Monitoring et analytics
- Launch beta avec early adopters

---

## 🔄 Phases d'intégration technique

### Phase A : Local Processing (Sprints 1-2)
```
Chrome Extension → Eliza OS (local) → SQLite → Dashboard
```

### Phase B : AI Processing (Sprints 3-4)
```
Extension → Eliza OS → Gaianet LLM → Recommendations → Dashboard
```

### Phase C : Blockchain Integration (Sprints 5-6)
```
Extension → Eliza → Gaianet → Intuition Smart Contract → Knowledge Graph
```

### Phase D : Full Ecosystem (Sprints 7-8)
```
Extension ↔ Eliza OS ↔ Gaianet ↔ Intuition (Indexer + Smart Contract + Knowledge Graph)
```

---

## 🎯 Jalons critiques

- **Semaine 2** : Eliza OS opérationnel avec Agent1 basique
- **Semaine 4** : Pipeline complet Chrome → Eliza → Analyse fonctionnel
- **Semaine 6** : Recommandations intelligentes via Agent2 + Gaianet
- **Semaine 8** : Intégration Intuition.systems MVP
- **Semaine 12** : Knowledge Graph personnel visualisable
- **Semaine 16** : Déploiement production complet

## 🎯 Définition de "Done"

Une fonctionnalité est considérée comme terminée quand :
- ✅ Code reviewé et approuvé
- ✅ Tests unitaires passent (>80% coverage)
- ✅ Tests manuels validés
- ✅ Documentation à jour
- ✅ Compatible Chrome Manifest V3
- ✅ Performance validée (< 1MB RAM)
- ✅ Sécurité auditée (Web3 + Chrome)

---

## 📞 Contacts & Validation

**Product Owner** : Équipe SOFIA  
**Tech Lead** : À définir  
**Design** : À définir  

**Validation requise de :**
- [ ] Équipe sécurité (Web3)
- [ ] Équipe design (UX/UI)
- [ ] Équipe légale (RGPD)
- [ ] Beta testeurs (5 utilisateurs minimum)
