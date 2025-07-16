# 📋 PRD - SOFIA : Your Personal AI Agent for the Web

## 🎯 Vue d'ensemble du produit

### Description
**SOFIA** est une extension Chrome alimentée par l'IA, conçue comme un agent personnel intelligent qui vous assiste pendant votre navigation web. SOFIA capture vos centres d'intérêt et les transforme en une **mémoire digitale vivante**, **sécurisée** et **vérifiable via blockchain**.

Plus qu'un simple assistant, SOFIA **structure, contextualise et certifie** votre identité numérique. Grâce à l'infrastructure décentralisée d'[Intuition.systems](https://www.intuition.systems/), chaque interaction peut devenir un **atom**, une unité de connaissance. Vous décidez si ces données restent **privées**, **partagées** ou **ancrées on-chain**.

### Objectifs
- Créer un **journal assisté** intelligent de votre activité web
- Développer un **graphe personnel vivant** de vos connaissances
- Fournir un **planificateur intelligent** basé sur vos patterns
- Agir comme un **filtre cognitif** pour l'information
- Être un **complice éthique** de votre mémoire digitale
- Transformer vos interactions en **atoms** vérifiables via Intuition.systems

---

## 👥 Utilisateurs cibles

### Personas principaux
- **Étudiants & Apprenants** : Personnes en formation continue qui veulent transformer leur navigation en apprentissage structuré
- **Early adopters Web3** : Utilisateurs intéressés par la décentralisation et la propriété de leurs données personnelles

### Besoins utilisateurs
- **Mémoire digitale intelligente** : Retrouver et connecter ses découvertes passées
- Connexion wallet simple et sécurisée
- **Confidentialité et contrôle** : Décider ce qui reste privé ou devient public
- **Intelligence contextuelle** : Recommandations pertinentes basées sur l'historique
- **Certification des connaissances** : Prouver et valoriser son expertise via blockchain

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
- **Framework** : Vite v6.0.1 + TypeScript v5.6.3
- **UI Framework** : [Shadcn UI](https://ui.shadcn.com/) + Tailwind CSS v4.1.10
- **Auth Web3** : MetaMask (integration avec Intuition.systems)
- **Storage** : Chrome Storage API (local extension)
- **APIs** : Chrome History API, Chrome Tabs API, Google Maps, Intuition.systems
- **AI Agent** : Eliza OS pour l'intelligence contextuelle
- **Runtime** : Node.js v20.19.3 + pnpm v10.8.2

---

## 📋 Fonctionnalités détaillées

### 🔐 F1 - Authentification & Identité Numérique (Priorité 1)
**Description** : Interface de connexion MetaMask pour créer une identité numérique vérifiable

**User Stories :**
- En tant qu'utilisateur, je veux connecter mon wallet MetaMask pour créer mon identité SOFIA
- En tant qu'utilisateur, je veux que mon adresse soit liée à mes atoms de connaissance
- En tant qu'utilisateur, je veux contrôler la visibilité de mon identité (privé/public)
- En tant qu'utilisateur, je veux pouvoir désactivé ma collecte de données
- En tant qu'utilisateur, je veux pouvoir me déconnecter tout en préservant mes données locales

**Critères d'acceptation :**
- ✅ Support MetaMask natif (pas de RainbowKit nécessaire)
- ✅ Affichage adresse tronquée (0x1234...abcd)
- ✅ Gestion des erreurs de connexion avec feedback utilisateur
- ✅ Persistance de la session et sync avec Intuition.systems
- ✅ Contrôle granulaire de la visibilité des données



**Spécifications techniques :**
```typescript
interface DigitalIdentity {
  address: string | null;
  isConnected: boolean;
  chainId: number;
  sofiaProfile: {
    onboardingComplete: boolean;
    privacySettings: 'private' | 'public' | 'selective';
    reputationScore: number;
  };
}
```

### 🧠 F2 - Intelligence Contextuelle & Capture d'Atoms (Priorité 1)
**Description** : Transformation intelligente de l'activité de navigation en unités de connaissance (atoms)

**User Stories :**
- En tant qu'utilisateur, je veux que SOFIA comprenne et contextualise mes intérêts automatiquement
- En tant qu'utilisateur, je veux que mes découvertes soient transformées en atoms vérifiables
- En tant qu'utilisateur, je veux contrôler quels atoms restent privés ou deviennent publics

**Critères d'acceptation :**
- ✅ Transformation automatique en atoms (URL, contexte, catégorie, timestamp)
- ✅ Classification automatique des contenus (recherche, apprentissage, travail)
- ✅ Toggle ON/OFF dans l'interface d'extension
- ✅ Interface pour marquer et annoter les moments importants
- ✅ Filtrage éthique des sites sensibles (banking, medical, private)


**Spécifications techniques :**
```typescript
interface Atom {
  id: string;
  type: 'knowledge' | 'interest' | 'action' | 'moment';
  content: {
    url: string;
    title: string;
    domain: string;
    context: string; // AI-generated summary
    embedding?: number[]; // semantic embedding
  };
  metadata: {
    timestamp: number;
    duration?: number;
    category: string; // AI-classified
    confidence: number;
    isMemorableMoment: boolean;
  };
  privacy: 'private' | 'public' | 'shared';
  blockchainHash?: string; // if anchored on-chain
}

interface KnowledgeGraph {
  atoms: Atom[];
  triplets: Array<{
    subject: string; // atom ID
    predicate: string; // relationship type
    object: string; // atom ID or external entity
    confidence: number;
  }>;
  settings: {
    intelligenceEnabled: boolean;
    excludedDomains: string[];
    autoAnchorThreshold: number;
  };
}
```

### 🔗 F3 - Knowledge Graph & Blockchain Integration (Priorité 1)
**Description** : Transformation des données en graphe de connaissance vérifiable via Intuition.systems

**User Stories :**
- En tant qu'utilisateur, je veux que mes atoms forment un graphe de connaissance personnel
- En tant qu'utilisateur, je veux pouvoir ancrer mes découvertes importantes on-chain
- En tant qu'utilisateur, je veux explorer les connections entre mes différents centres d'intérêt
- En tant qu'utilisateur, je veux avoir accès aux signaux et triplets d'autres utilisateurs

**Critères d'acceptation :**
- ✅ Stockage local (Chrome Storage) avec exposition API pour Agent1
- ✅ Synchronisation sélective avec Intuition.systems
- ✅ Visualisation du graphe personnel de connaissances
- ✅ Interface pour créer et voter sur des triplets
- ✅ Export/import des données avec métadonnées blockchain

### 🎨 F4 - Interface Agent Personnel (Priorité 2)
**Description** : Dashboard intelligent avec recommandations contextuelles et visualisation du knowledge graph

**User Stories :**
- En tant qu'utilisateur, je veux converser avec SOFIA pour explorer mes intérêts
- En tant qu'utilisateur, je veux des recommandations intelligentes basées sur mes patterns
- En tant qu'utilisateur, je veux visualiser mon graphe de connaissance personnel
- En tant qu'utilisateur, je veux une interface moderne qui reflète ma personnalité numérique
- En tant qu'utilisateur, je veux accéder facilement aux triplets et signaux pertinents

**Critères d'acceptation :**
- ✅ Interface conversationnelle avec SOFIA (chat intelligent)
- ✅ Visualisation interactive du knowledge graph personnel
- ✅ Recommandations contextuelles basées sur l'activité récente
- ✅ Dashboard des atoms créés et signaux reçus
- ✅ Contrôles de confidentialité granulaires (privé/public par atom)
- ✅ Integration Google Maps pour les insights de géolocalisation

### 🆕 F5 - Fonctionnalités Avancées (Roadmap)
**Description** : Fonctionnalités d'intelligence et d'interaction avancées pour l'agent SOFIA

**Fonctionnalités prévues :**
- **Journal assisté** : Classification automatique et suggestions de tags
- **Détection de moments mémorables** : IA qui identifie les découvertes importantes
- **Planificateur intelligent** : Recommandations basées sur les patterns d'activité
- **Integration Google Maps** : Insights géolocalisés de l'activité locale
- **Système de voting** : Mécanisme de réaction sur les triplets via signals
- **Interface Web3** : Staking ETH sur les signaux pour valoriser les connaissances
- **Bookmarks décentralisés** : Sauvegarde cross-device via blockchain
- **Onboarding personnalisé** : Setup de l'agent avec personnalité adaptée

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
- Interface popup minimale avec Shadcn 
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
Chrome Extension (Chrome Storage) ← Agent1 (fetch) → Dashboard
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

---

## 🔗 Ressources Externes & Écosystème

**Intégrations principales :**
- [Intuition.systems](https://www.intuition.systems/) : Infrastructure blockchain pour atoms et triplets
- [Eliza OS](https://github.com/elizaos/eliza) : Framework d'agent IA pour l'intelligence contextuelle
- [Intuition Extension](https://chromewebstore.google.com/detail/intuition/example) : Extension Chrome existante
- [MetaMask](https://metamask.io/) : Wallet pour l'authentification Web3

**Documentation technique :**
- [Intuition-ts SDK](https://github.com/intuition-systems/intuition-ts) : Librairie TypeScript
- [Shadcn UI](https://ui.shadcn.com/) : Composants UI modernes
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/) : Spécifications techniques
