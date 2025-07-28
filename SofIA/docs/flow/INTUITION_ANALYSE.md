# Analyse des dossiers SofIA Extension

## Vue d'ensemble
L'extension SofIA est une extension Chrome construite avec Plasmo qui fournit des fonctionnalités de tracking, de connexion wallet et d'interaction avec des smart contracts Intuition/MultiVault. L'architecture est organisée en trois dossiers principaux : `hooks/`, `lib/` et `const/`.

## 📁 Dossier `hooks/`

### Hooks Blockchain/Smart Contract
- **`useContractWriteAndWait.tsx`** : Hook générique pour l'écriture de contrats avec attente de confirmation
  - `useSimulatedContractWriteAndWait()` : Simule puis exécute une transaction
  - `useContractWriteAndWait()` : Exécute et attend la confirmation d'une transaction
  - Gère les états : idle, pending, error, success
  - Utilise wagmi pour l'interaction blockchain

- **`useCreateAtom.tsx`** : Hook spécialisé pour créer des atoms
  - Utilise `useMultivaultContract()` et `useContractWriteAndWait()`
  - Fonction : `createAtom`

- **`useCreateTriple.tsx`** : Hook spécialisé pour créer des triples
  - Utilise `useMultivaultContract()` et `useContractWriteAndWait()`
  - Fonction : `createTriple`

- **`useCreatePosition.ts`** : Hook pour créer des positions dans des vaults
  - Utilise directement le SDK Intuition (`@0xintuition/protocol`)
  - Gère le dépôt minimum et la vérification de balance
  - Simule puis exécute `depositTriple`

- **`useMultivaultContract.tsx`** : Hook pour obtenir une instance du contrat MultiVault
  - Retourne un contrat viem configuré
  - Adresse par défaut : `0xcA03acB834e2EA046189bD090A6005507A392341`

### Hooks Utilitaires
- **`useTracking.ts`** : Hook pour la gestion du tracking de navigation
  - Gestion d'état : activation/désactivation du tracking
  - Communication avec le background script Chrome
  - Fonctions : export de données, nettoyage, consultation console
  - Types : `TrackingStats` avec totalPages, totalVisits, etc.

## 📁 Dossier `lib/`

### Communication et Messages
- **`MessageBus.ts`** : Classe singleton pour gérer les messages Chrome runtime
  - Pattern Singleton avec `getInstance()`
  - Méthodes : `sendMessage()`, `sendMessageFireAndForget()`
  - Messages spécialisés : agent, MetaMask, tracking

### Configuration et Environnement
- **`config.ts`** : Configuration simple de l'environnement
  - Détection dev/production via `process.env.NODE_ENV`
  - Sélection de chaîne : baseSepolia (dev) / base (prod)
  - Adresses de contrats MultiVault

- **`environment.ts`** : Configuration avancée multi-environnement
  - Type `ChainEnv` : development, staging, production
  - Configuration par environnement : chainId, RPC URLs, adresses
  - Fonction `getChainEnvConfig()` avec fallback sur development

### Blockchain et Wallet
- **`metamask.ts`** : Utilitaires MetaMask
  - `getMetaProvider()` : Crée un provider MetaMask
  - `connectWallet()` : Connexion et récupération d'adresse
  - `disconnectWallet()` : Révocation des permissions

- **`viemClients.ts`** : Clients viem pour l'interaction blockchain
  - `getClients()` : Crée walletClient et publicClient
  - Gestion automatique du changement de chaîne
  - Utilise la chaîne sélectionnée depuis config

- **`multiVault.ts`** : ABI complet du contrat MultiVault
  - Interface complète avec 100+ fonctions
  - Fonctions principales : createAtom, createTriple, depositAtom/Triple, etc.
  - Events et erreurs définies

### Utilitaires
- **`formatters.ts`** : Fonctions de formatage
  - `formatTimestamp()`, `formatDuration()`, `formatUrl()`
  - `formatNumber()`, `formatFileSize()`
  - Utilitaires pour l'affichage des données

- **`logger.ts`** : Logger conditionnel
  - Active uniquement en développement
  - Wrapper autour de `console.log`

- **`umami.ts`** : Analytics avec Umami
  - Collecte d'événements et métriques
  - Récupération d'IP via ipify.org
  - Configuration via variables d'environnement

## 📁 Dossier `const/`

### Configuration Générale
- **`general.ts`** : Constantes globales de l'application
  - **Environnement** : CURRENT_ENV fixé à 'development'
  - **Blockchain** : Adresses de contrats (MultiVault, Relic) par environnement
  - **Validation** : Limites de formulaires, types MIME acceptés
  - **URLs** : Block explorers, IPFS gateway
  - **Routes API** : Endpoints pour resources et identities
  - **Atoms spéciaux** : IDs de vault prédéfinis (TAG_PREDICATE, etc.)
  - **Sentry** : DSN pour le monitoring d'erreurs

## 🔗 Liens et Dépendances

### Flux Principal d'Interaction Blockchain
```
useCreateAtom/useCreateTriple
    ↓
useMultivaultContract + useContractWriteAndWait
    ↓
viemClients + metamask + config/environment
    ↓
multiVault.ts (ABI)
```

### Système de Communication
```
Composants UI
    ↓
MessageBus.ts
    ↓
Background Script Chrome
    ↓
useTracking.ts (statistiques)
```

### Configuration Multi-Niveau
```
environment.ts (config avancée)
    ↑
config.ts (config simple)
    ↑  
general.ts (constantes)
```

## 🎯 Fonctionnalités Principales

1. **Création d'Atoms/Triples** : Interface pour créer des entités dans le protocole Intuition
2. **Gestion de Positions** : Dépôt dans des vaults avec gestion des frais
3. **Tracking de Navigation** : Collecte et export de données de navigation
4. **Connexion Wallet** : Intégration MetaMask avec changement automatique de chaîne
5. **Analytics** : Suivi d'événements via Umami
6. **Communication Extension** : Bus de messages pour coordination entre scripts

## 📊 Métriques et Monitoring

- **Tracking** : Pages visitées, temps passé, URLs favorites
- **Analytics** : Événements Umami avec métadonnées complètes
- **Erreurs** : Monitoring Sentry intégré
- **Logs** : Logger conditionnel pour développement

---

# 🚀 Plan d'Implémentation : Création d'Atoms

## Vue d'ensemble de la Feature
Implémenter un système complet de création d'atoms sur la blockchain Intuition, déclenché depuis les boutons "Add" dans EchoesTab.

## 📋 Liste des Tâches

### Phase 1 : Préparation et Architecture
1. **Analyser les données disponibles dans EchoesTab**
   - Étudier la structure des triplets parsés par SofIA
   - Identifier les champs nécessaires pour créer un atom (name, description, url)
   - Vérifier les données disponibles dans `ParsedSofiaMessage`

2. **Concevoir l'interface utilisateur**
   - Créer un modal/dialog pour la création d'atom
   - Design selon le système SofIA (couleurs 950: #372118, effet liquid glass)
   - Formulaire avec champs : nom, description, URI/URL
   - États de chargement et de confirmation

### Phase 2 : Composants UI
3. **Créer le composant AtomCreationModal**
   - Modal réutilisable avec formulaire de création
   - Validation des champs (longueur max, format URI)
   - Gestion des états : idle, loading, success, error
   - Intégration du design system SofIA

4. **Modifier EchoesTab pour déclencher la création**
   - Remplacer les `console.log` par l'ouverture du modal
   - Passer les données du triplet/intention au modal
   - Gérer l'état d'ouverture/fermeture du modal

### Phase 3 : Intégration Blockchain
5. **Configurer la connexion wallet**
   - Vérifier la connexion MetaMask avant création
   - Afficher le statut de connexion dans l'UI
   - Gérer les erreurs de connexion/réseau

6. **Implémenter la logique de création d'atom**
   - Utiliser le hook `useCreateAtom()` existant
   - Conversion des données UI en format blockchain (bytes)
   - Gestion des frais de transaction et validation

7. **Intégrer useContractWriteAndWait**
   - Surveiller les états de transaction (wallet confirmation, on-chain confirmation)
   - Afficher les indicateurs de progression
   - Gérer les callbacks `onReceipt`

### Phase 4 : UX et Feedback
8. **Implémenter les retours visuels**
   - Loading states pendant les transactions
   - Messages de succès avec lien vers block explorer
   - Gestion d'erreurs avec messages explicites
   - Toast notifications pour les actions

9. **Ajouter la persistance locale**
   - Sauvegarder les atoms créés dans le storage local
   - Historique des créations avec statuts
   - Cache des transactions en cours

### Phase 5 : Finalisation MVP
10. **Validation finale**
    - Tests manuels du flux complet
    - Vérification sur testnet (baseSepolia)
    - Correction des bugs critiques

11. **Polish UX**
    - Ajustements finaux de l'interface
    - Optimisation des messages d'erreur
    - Validation de l'expérience utilisateur

## 🔧 Hooks et Utilitaires à Utiliser

### Hooks Blockchain
- `useCreateAtom()` : Hook principal pour la création
- `useContractWriteAndWait()` : Gestion des transactions
- `useMultivaultContract()` : Instance du contrat

### Utilitaires
- `viemClients.ts` : Clients blockchain
- `metamask.ts` : Gestion wallet
- `formatters.ts` : Formatage des données
- `MessageBus.ts` : Communication extension

### Configuration
- `general.ts` : Constantes (MIN_DEPOSIT, MULTIVAULT_CONTRACT_ADDRESS)
- `environment.ts` : Configuration réseau

## 📊 Flux de Données Prévu

```
EchoesTab (bouton Add)
    ↓
AtomCreationModal (formulaire)
    ↓
useCreateAtom() (validation + transaction)
    ↓
useContractWriteAndWait() (confirmation)
    ↓
Storage local + Analytics (persistance)
    ↓
Feedback utilisateur (succès/erreur)
```

## 🎯 Critères de Réussite MVP

1. **Fonctionnel** : Création d'atoms réussie sur testnet avec hooks existants
2. **UX** : Interface simple et claire avec feedback de base
3. **Intégration** : Flux fonctionnel depuis EchoesTab vers blockchain
4. **Robustesse** : Gestion d'erreurs essentielles

## ⚠️ Points d'Attention pour les Hooks

- **Respecter exactement** les hooks existants (`useCreateAtom`, `useContractWriteAndWait`)
- **Ne pas modifier** la logique blockchain déjà implémentée
- **Utiliser** les configurations existantes (environnement, contrats)
- **Suivre** le flux: EchoesTab → Modal → Hook existant → Confirmation