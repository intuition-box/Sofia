# Plan de Refactoring & Optimisation - Sofia Extension

## Contexte

La codebase Sofia Extension a grandi organiquement sans guardrails architecturaux formels. L'audit révèle : 833 console.log en production, 150+ interfaces inline hors du dossier `types/`, 32 casts `as any`, 6+ types dupliqués, des god components, de la logique métier dans les composants, et aucun barrel file pour simplifier les imports. Le package GraphQL (`@0xsofia/graphql`) est le seul élément bien structuré. Ce plan vise à professionnaliser la codebase en appliquant des principes OOP/Clean Architecture.

---

## Phase 1 : Nettoyage Dead Code & Console Logs (Priorité CRITIQUE)

### 1.1 - Supprimer le dead code identifié
- **`BlockchainService.checkProxyApproval()`** : Supprimer (retourne toujours `false`, jamais appelée). Les 2 autres fonctions approval (`requestProxyApproval`, `waitForApprovalConfirmation`) sont vivantes mais non appelées actuellement - les garder pour usage futur potentiel.
  - Fichier : `lib/services/blockchainService.ts:327-338`
- **Code commenté** dans `hooks/useCreateAtom.ts:40-47` : Supprimer les commentaires référençant `checkProxyApproval`
- **`hooks/useFollowAccount.ts:89`** : Le TODO "unfollow logic" est résolu via `useRedeemTriple.ts` - supprimer le commentaire TODO
- **`components/ui/FollowButton.tsx:31`** : Supprimer le TODO "Show connect wallet message"

### 1.2 - Remplacer 833 console.log par le Logger centralisé
- Le logger existe déjà : `lib/utils/logger.ts` - l'utiliser partout
- Supprimer les `console.log` de `config.ts:21-22` (s'exécutent au chargement du module)
- Migration systématique fichier par fichier (par ordre de priorité) :
  1. `lib/database/indexedDB-methods.ts` (48 occurrences)
  2. `background/messageHandlers.ts` (44)
  3. `lib/services/ai/RecommendationService.ts` (24)
  4. `background/oauth/core/PlatformDataFetcher.ts` (21)
  5. `background/oauth/core/OAuthFlowManager.ts` (17)
  6. `lib/services/blockchainService.ts` (10)
  7. Tous les autres fichiers restants

### 1.3 - Corriger le fallback walletBridge (BUG ACTIF)
Le `selectProviderByAddress()` dans `contents/walletBridge.ts` cause des problèmes réels :
- **Race condition** : requêtes async vers tous les wallets, le premier qui répond gagne
- **Prompts non désirés** : certains wallets montrent "Connect?" de manière inattendue
- **`window.ethereum` fallback** : imprévisible avec plusieurs wallets installés

**Actions :**
- Rendre `walletType` obligatoire lors de la connexion (ne plus tomber dans le fallback by-address)
- Supprimer ou marquer comme deprecated le fallback `selectProviderByAddress()`
- Supprimer le fallback `window.ethereum` dans `getProvider()` (lines 183-196)
- Ajouter du logging structured pour diagnostiquer les sélections de provider

### 1.4 - Supprimer le pipeline og:image (DEAD CODE complet)
Investigation approfondie : les og:images ne sont **jamais affichées** aux utilisateurs. Le hook `useResonanceService` n'est importé par **aucun composant**. L'UI utilise des favicons (Google Favicons API), pas les og:images. Tout le pipeline est du dead code.

**Fichiers à supprimer :**
- `hooks/useResonanceService.ts` - Hook jamais importé
- `lib/services/GlobalResonanceService.ts` - Service jamais consommé par l'UI
- `lib/database/StorageOgImage.ts` - Cache og:image inutilisé

**Code à supprimer dans des fichiers existants :**
- `lib/services/ai/RecommendationService.ts` : Supprimer `getOgImage()` et `getSuggestionsWithPreviews()`
- `lib/database/StorageRecommendation.ts` : Supprimer le cache `validItems` si plus rien ne le consomme
- `types/bento.ts` : Supprimer `ogImage` de `BentoItemWithImage` (ou supprimer le type entièrement si plus utilisé)

**Vérification avant suppression :** Grep final pour `GlobalResonanceService`, `useResonanceService`, `StorageOgImage`, `getOgImage`, `getSuggestionsWithPreviews` pour confirmer zéro import restant.

---

## Phase 2 : Centralisation des Types (Priorité HAUTE)

### 2.1 - Règle : Tous les types dans `@extension/types/`
**Exception professionnelle acceptée** : Les `Props` de composants React (ex: `ButtonProps`) peuvent rester co-localisés avec leur composant SI elles ne sont pas exportées/réutilisées ailleurs. C'est la convention React standard.

### 2.2 - Créer de nouveaux fichiers de types par domaine

| Nouveau fichier | Types à y déplacer | Depuis |
|---|---|---|
| `types/components.ts` | `CategoryCardProps`, `GroupBentoCardProps`, `WeightModalProps`, `StakeModalProps`, `FollowModalProps`, etc. (props exportées/partagées) | Composants divers |
| `types/hooks.ts` (enrichir) | `FollowResult`, `WeightResult`, `RedeemResult`, `AmplifyResult`, `LevelUpResult`, `LevelUpPreview`, `DiscoveryScoreResult`, `UseRecommendationsResult`, etc. | Hooks divers |
| `types/database.ts` | `TripletsRecord`, `NavigationRecord`, `ProfileRecord`, `SettingsRecord`, `SearchRecord`, `BookmarkListRecord`, `RecommendationRecord`, `IntentionGroupRecord`, `GroupUrlRecord`, `PredicateChangeRecord`, `UserXPRecord` | `lib/database/indexedDB.ts` |
| `types/services.ts` | `CertifyResult`, `GroupStats`, `LocalProgressData`, `TrackedUrl`, `DomainCluster`, `AgentIds`, `OgImageCache` | Services divers |
| `types/social.ts` | `SocialAttestation`, `VerificationStatus`, `SocialVerifierResult` | `hooks/useSocialVerifier.ts` |
| `types/follow.ts` (enrichir `follows.ts`) | `FollowStatus`, `GraphQLFollowingResponse`, `AtomDataResponse`, `FollowAccountCardProps`, `TopAccount` | Hooks follow |
| `types/groups.ts` | `IntentionGroupWithStats`, `OnChainUrl`, `OnChainGroup`, `UrlCertificationStatus`, `GroupCertificationStats` | Hooks intention groups |
| `types/router.ts` | `Page`, `UserProfileData`, `SearchContext`, `BookmarkData`, `RouterContextType` | `RouterProvider.tsx` |
| `types/ai.ts` | `BentoSuggestion`, `Recommendation`, `WalletData`, `RecommendationCache` | `lib/services/ai/types.ts` |
| `types/oauth.ts` | `PlatformConfig`, `UserToken`, `SyncInfo`, `TripletRule`, `UserData`, `IOAuthService` | `background/oauth/` |

### 2.3 - Résoudre les 6+ types dupliqués

| Type dupliqué | Occurrences | Action |
|---|---|---|
| `Triplet` | `types/messages.ts`, `oauth/types/interfaces.ts`, `WeightModal.tsx` | Garder `types/messages.ts` comme source unique |
| `EchoTriplet` | `types/blockchain.ts`, `types/hooks.ts`, `WeightModal.tsx` | Garder `types/blockchain.ts`, supprimer les autres |
| `BookmarkData` | `RouterProvider.tsx`, `messageSenders.ts` | Unifier dans `types/bookmarks.ts` |
| `BentoItem/BentoState` | `types/bento.ts`, `lib/services/ai/types.ts` | Garder `types/bento.ts`, importer dans ai/types |
| `LevelUpResult/Preview` | `hooks/useLevelUp.ts`, `lib/services/LevelUpService.ts` | Créer dans `types/hooks.ts`, importer des deux côtés |
| `AtomDataResponse` | `hooks/useFollowing.ts`, `hooks/useFollowers.ts` | Unifier dans `types/follow.ts` |
| `XPState` | `types/currencyTypes.ts`, `lib/services/XPService.ts` | Garder `types/currencyTypes.ts` |

### 2.4 - Éliminer les 32 casts `as any`
Pour chaque cast, créer le type approprié ou utiliser un générique :
- **Priorité haute** : `useCreateTripleOnChain.ts` (2x `as unknown as any[]` pour ABI) - Créer un type `ContractABI`
- **Priorité haute** : `blockchainService.ts` (6 casts) - Typer les retours viem
- **Priorité moyenne** : `indexedDB-methods.ts` (5 casts) - Typer les records IndexedDB
- **Priorité basse** : Types de messages Chrome (utiliser les types de `messages.ts` correctement)

---

## Phase 3 : Restructuration & Organisation du Code (Priorité HAUTE)

### 3.1 - Architecture cible en couches

```
Presentation Layer (React Components)
    |  Props uniquement, zéro logique métier
    v
Application Layer (Custom Hooks)
    |  Orchestration, composition de services
    v
Domain Layer (Services)
    |  Logique métier pure, classes OOP
    v
Infrastructure Layer (Database, API Clients, Chrome APIs)
```

### 3.2 - Éclater les God Components
**REPORTÉ** : `AccountTab.tsx` est en cours de modification par un collègue sur `dev`. Attendre son merge avant de toucher à ce composant pour éviter les conflits.

**`HomeConnectedPage.tsx`** (peut être fait maintenant) :
- Extraire la logique Chrome storage vers un service dédié
- Extraire la logique pulse vers le hook existant

### 3.3 - Créer des barrel files (index.ts)

Chaque barrel file ré-exporte les exports publics de son dossier. Avantages : imports simplifiés, point d'entrée unique, facilite les refactos futurs.

**`lib/services/index.ts`** :
```typescript
// Singleton instances
export { blockchainService } from './blockchainService'
export { questTrackingService } from './QuestTrackingService'
export { BadgeService } from './BadgeService'
export { XPService } from './XPService'
export { GoldService } from './GoldService'
export { GroupManager } from './GroupManager'
export { LevelUpService } from './LevelUpService'
export { MessageBus } from './MessageBus'
export { PageDataService } from './PageDataService'
export { PulseService } from './PulseService'
export { SessionTracker } from './SessionTracker'
export { UserSessionManager } from './UserSessionManager'
export { CurrencyMigrationService } from './CurrencyMigrationService'
export { QuestBadgeService } from './QuestBadgeService'
export { QuestProgressService } from './QuestProgressService'
// AI sub-package
export { RecommendationService } from './ai/RecommendationService'
```

**`hooks/index.ts`** :
```typescript
// Blockchain hooks
export { useCreateAtom } from './useCreateAtom'
export { useCreateTripleOnChain } from './useCreateTripleOnChain'
export { useWeightOnChain } from './useWeightOnChain'
export { useRedeemTriple } from './useRedeemTriple'
// ... tous les hooks publics
```

**`components/ui/index.ts`** :
```typescript
export { Avatar } from './Avatar'
export { AccountStats } from './AccountStats'
export { FollowButton } from './FollowButton'
export { BookmarkButton } from './BookmarkButton'
export { SofiaLoader } from './SofiaLoader'
export { FullScreenLoader } from './FullScreenLoader'
// ... tous les composants UI réutilisables
```

**`lib/utils/index.ts`** :
```typescript
export { createServiceLogger, createHookLogger } from './logger'
export { normalizeUrl } from './normalizeUrl'
export { cleanTitle } from './cleanTitle'
export { resolveAvatar } from './avatar'
export { resolveENS } from './ensUtils'
// ... toutes les utils
```

**`lib/database/index.ts`** :
```typescript
export { SofiaDB } from './indexedDB'
export * from './indexedDB-methods'
export { StorageRecommendation } from './StorageRecommendation'
```

### 3.4 - Organiser les utilitaires par domaine

Structure actuelle : 11 fichiers à plat dans `lib/utils/`
Structure cible :

```
lib/utils/
├── web3/
│   ├── ensUtils.ts        (résolution ENS)
│   ├── avatar.ts          (résolution avatars)
│   └── index.ts
├── quest/
│   ├── questStatusHelpers.ts  (calcul statuts quests)
│   ├── storageKeyUtils.ts     (NOUVEAU: getWalletKey() - actuellement dupliqué 3x)
│   └── index.ts
├── content/
│   ├── parseSofiaMessage.ts   (parsing messages Sofia)
│   ├── pageRestriction.ts     (pages restreintes)
│   ├── cleanTitle.ts          (nettoyage titres)
│   ├── normalizeUrl.ts        (normalisation URLs)
│   └── index.ts
├── cache/
│   ├── refetchUtils.ts        (logique de refetch)
│   ├── circleInterestUtils.ts (utils cercle/intérêts)
│   └── index.ts
├── common/
│   ├── logger.ts              (logger centralisé)
│   └── index.ts
└── index.ts                    (barrel principal)
```

**Action clé** : Créer `storageKeyUtils.ts` pour centraliser `getWalletKey()` actuellement dupliqué dans `QuestBadgeService`, `QuestProgressService`, et `useQuestSystem`.

### 3.5 - Quest System : architecture saine, améliorations mineures
L'audit confirme que les hooks quest (`useQuestSystem`, `useUserQuests`) ajoutent une vraie valeur (caching, orchestration, mode read-only). **Pas de découplage nécessaire.**

Seules améliorations :
- Extraire `getWalletKey()` vers `lib/utils/quest/storageKeyUtils.ts`
- Extraire les clés OAuth hardcodées vers `lib/config/oauthKeys.ts`

---

## Phase 4 : GraphQL - SKIP (déjà bien structuré)

---

## Phase 5 : Documentation

### 5.1 - `ARCHITECTURE.md`
Documenter les couches, conventions de types, et patterns utilisés (singletons, barrel files, etc.)

### 5.2 - ESLint (quand on aura le temps)
- `no-explicit-any` : error
- `no-console` : warn (avec override pour le logger)
- `no-unused-vars` : error

---

## Ordre d'exécution recommandé

| Étape | Phase | Effort | Risque | Notes |
|---|---|---|---|---|
| 1 | 1.1 Dead code | Faible | Très faible | Safe, aucun impact |
| 2 | 1.4 Pipeline og:image | Moyen | Faible | 3 fichiers à supprimer + nettoyage |
| 3 | 1.3 WalletBridge fix | Moyen | Moyen | Bug actif, prioritaire |
| 4 | 1.2 Logger migration | Moyen | Faible | Fichier par fichier |
| 5 | 2.3 Types dupliqués | Moyen | Moyen | Mettre à jour les imports |
| 6 | 2.2 Centraliser types | Élevé | Moyen | Beaucoup de fichiers touchés |
| 7 | 2.4 Éliminer `as any` | Moyen | Faible | |
| 8 | 3.3 Barrel files | Faible | Faible | |
| 9 | 3.4 Réorg utils | Faible | Faible | + storageKeyUtils.ts |
| 10 | 3.2 God components | Élevé | Élevé | **Attendre merge collègue** |
| 11 | 5.1 ARCHITECTURE.md | Faible | Aucun | |

## Fichiers critiques à modifier

- `lib/services/blockchainService.ts` - Dead code + `as any`
- `contents/walletBridge.ts` - Fix fallback provider (bug actif)
- `lib/services/walletProvider.ts` - Fix provider selection
- `hooks/useResonanceService.ts` - **SUPPRIMER** (dead code)
- `lib/services/GlobalResonanceService.ts` - **SUPPRIMER** (dead code)
- `lib/database/StorageOgImage.ts` - **SUPPRIMER** (dead code)
- `types/messages.ts` - Source de vérité pour `Triplet`
- `types/blockchain.ts` - Source de vérité pour `EchoTriplet`
- `lib/database/indexedDB.ts` - Extraire 13 types vers `types/database.ts`
- `components/modals/WeightModal.tsx` - 5 types inline + 2 dupliqués
- `hooks/useCreateTripleOnChain.ts` - 2x `as unknown as any[]`
- `config.ts` - Console.logs au chargement
- `lib/utils/logger.ts` - Base pour remplacer console.log

## Vérification

- Build Plasmo : `pnpm build` après chaque phase
- Tester l'extension dans Chrome après les phases 1.3 et 2
- Vérifier les imports cassés avec `tsc --noEmit`
- Grep pour `as any` après phase 2.4 (objectif : 0)
- Grep pour `console.log` après phase 1.2 (objectif : uniquement dans logger.ts)
- Tester connexion wallet avec plusieurs wallets installés après phase 1.3
