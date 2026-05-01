# Refacto navigation Sofia extension

> Status : **plan finalisé, audits complets, prêt à exécuter**
> Branche : `ext/refacto-menu` (créée, commits `fd0a33f1`, `847dba11`, `d3d1f3a7`, `55b6f9a0`, `603ebf77`)
> Scope : `Sofia/apps/extension/` uniquement (monorepo — autres apps intouchées)
> Contrainte forte (Maxime) : **NE PAS toucher au schéma IndexedDB**

---

## 1. Objectif

Restructurer la navigation de l'extension :

- Bottom nav : 5 onglets — **Attest / My Profile / Circles / Score / Settings**
- Migrer toutes les icônes custom SVG vers lucide-react
- Éclater l'ancien onglet Profile : Socials → My Profile, Community → Circles,
  Stats/Quests → nouveau **Score** (niveau 1)
- Renommer Home → **Attest** (vocabulaire natif Intuition Protocol)
- Supprimer les onglets Vote/Streak (composants `DebateTab`, `LeaderboardTab`)

---

## 2. État actuel

### Bottom nav (`components/layout/BottomNavigation.tsx:31-58`)

| # | Label | Icône | Page key | Composant |
|---|-------|-------|----------|-----------|
| 1 | Home | lucide `Home` | `home-connected` | `HomeConnectedPage` |
| 2 | Sofia | `icons/Icon=Sofia.svg` | `Sofia` | `CorePage` |
| 3 | Resonance | `icons/ResonanceIcon.svg` | `resonance` | `ResonancePage` |
| 4 | Profile | `icons/Icon=person.svg` | `profile` | `ProfilePage` |
| 5 | Settings | `icons/Icon=Settings.svg` | `settings` | — |

### Sous-onglets actuels

- **CorePage** — `'Echoes' | 'Bookmarks' | 'History'`
- **ResonancePage** — `'circle' | 'trending' | 'debate' | 'streak'`
- **ProfilePage** — `'stats' | 'community' | 'socials'` (avec sous-state `'stats' | 'quests'`)
- **HomeConnectedPage** — composant unique `PageBlockchainCard`

### Routing

State machine via `RouterProvider.tsx` (Context API) + switch dans
`sidepanel.tsx:69-95`. Pas de React Router. `currentPage` n'est PAS persisté
(useState local).

---

## 3. État cible

### Bottom nav (5 onglets)

| # | Label | Icône (lucide) | Page key | Composant |
|---|-------|----------------|----------|-----------|
| 1 | **Attest** | `Pencil` | `attest` | `AttestPage` |
| 2 | **My Profile** | `User` | `my-profile` | `MyProfilePage` |
| 3 | **Circles** | `Users` | `circles` | `CirclesPage` |
| 4 | **Score** | `PieChart` | `score` | `ScorePage` |
| 5 | **Settings** | `Settings` | `settings` | — |

### Sous-onglets cibles

- **AttestPage** — `PageBlockchainCard` (inchangé)
- **MyProfilePage** — `MyProfileTab = 'echoes' | 'bookmarks' | 'history' | 'socials'` (4 onglets)
- **CirclesPage** — `CirclesTab = 'circle' | 'trending' | 'community'` (3 onglets)
  - ⚠️ Inclut une **logique de sync** `activeTab` du router → état interne
    (réplication du pattern `ProfilePage.tsx:84-90` pour que `circle-go-btn` continue de marcher)
- **ScorePage** *(nouveau, niveau 1)* — `ScoreTab = 'stats' | 'quests'` (2 onglets, sous-state interne préservé)

---

## 4. Décisions actées

### Structure & nommage

| Item | Décision |
|------|----------|
| Bottom nav | 5 onglets : Attest / My Profile / Circles / Score / Settings |
| Onglet Score | Promu au niveau 1 (ex-sous-onglet Stats de Profile) |
| Onglet Settings | Conservé en 5ème position |
| Renommage `vote/debate` | **Annulé** — l'onglet disparaît entièrement (cf. décision G) |
| Renommage interne | Composants, types, fichiers — tout |
| `activeProfileTab` | Renommé en `activeTab` (générique) |

### Icônes (toutes lucide-react)

| Onglet | Icône | Source |
|--------|-------|--------|
| Attest | `Pencil` | Demande user (« un crayon ») |
| My Profile | `User` | Cohérence Sofia-explorer |
| Circles | `Users` | Validé via SVG fourni |
| Score | `PieChart` | Validé via SVG fourni (camembert) |
| Settings | `Settings` | Inchangé |

### Décision G — Suppression DebateTab + LeaderboardTab

**G.A acté : suppression complète** des composants ET de leur cascade. Détail
dans la section Audits ci-dessous.

### Décision migration storage

**M.A acté : aucun script de migration nécessaire.** Justification dans
section Audits (E + M2 + N5 confirment qu'aucun page name n'est persisté ni
transmis).

### Contrainte BDD

**IndexedDB intouchable.** Pas de bump de version. Pas de modif des stores
(contrainte Maxime).

### Branche

`ext/refacto-menu` (créée).

---

## 5. Audits

### Phase 0 — IndexedDB ✅

`apps/extension/lib/database/indexedDB.ts:24` — `DB_VERSION = 10`. Le commit
v10 a déjà nettoyé 5 stores inutilisés (`navigation_data`, `user_profile`,
`search_history`, `recommendations`, `user_xp`).

**Stores actuels (6)** :

| Store | Type record | Réf. page name ? |
|-------|-------------|-------------------|
| `triplets_data` | `TripletsRecord` | ❌ |
| `user_settings` | `SettingsRecord` → `ExtensionSettings` | ❌ |
| `bookmark_lists` | `BookmarkListRecord` | ❌ |
| `bookmarked_triplets` | `BookmarkedTripletRecord` | ❌ |
| `intention_groups` | `IntentionGroupRecord` | ❌ |
| `cart_items` | `CartItemRecord` | ❌ |

`ExtensionSettings` (`types/storage.ts:6-16`) ne contient aucun champ
nav-related (`theme/language/notifications/autoBackup/debugMode/isTrackingEnabled/autoCleanup/...`).

→ **GO** — pas de migration IDB nécessaire.

### Audit E — chrome.storage ✅

86 occurrences `chrome.storage.*` inventoriées.

**chrome.storage.session** : 7 clés (`walletAddress`, `walletType`,
`oauth_state_*`, `pending_external_auth`, `pending_profile_view`,
`pending_first_claim`) — **aucune ne référence un page name**.

**chrome.storage.local** : tokens, syncInfo, lastActiveWallet, discord_profile,
gold keys, quest keys, attestation keys, query cache, identity cache —
**aucune ne référence un page name**.

`currentPage` (`RouterProvider.tsx:56`) vit en `useState` local — non persisté.

→ **Risque de perte de data ≈ zéro**.

### Audit M2 — chrome.runtime messages ✅

Grep `Sofia|resonance|profile|home-connected|debate|streak` dans
`types/messages.ts` + `background/messageHandlers.ts` :
- 6 matches dans `types/messages.ts`, **tous false positives** (commentaires +
  noms de types `ParsedSofiaMessage`/`SofiaMessage` qui désignent les messages
  de l'agent IA, pas la nav)
- 0 match dans `background/messageHandlers.ts`

→ **Aucun page name transmis dans les messages** → migration M.A confirmée.

### Audit F — call-sites `navigateTo`

**Renommages 1:1 (mécaniques)** :

| Fichier:ligne | Avant | Après |
|---|---|---|
| `sidepanel.tsx:47,56,60` | `navigateTo('home-connected')` x3 | `navigateTo('attest')` |
| `sidepanel.tsx:74` | `case 'home-connected':` | `case 'attest':` |
| `sidepanel.tsx:78` | `case 'profile':` | **supprimer** |
| `sidepanel.tsx:80` | `case 'Sofia':` | `case 'my-profile':` |
| `sidepanel.tsx:82` | `case 'resonance':` | `case 'circles':` |
| `BottomNavigation.tsx:35` | `navigateTo('home-connected')` | `navigateTo('attest')` |
| `BottomNavigation.tsx:40` | `navigateTo('Sofia')` | `navigateTo('my-profile')` |
| `BottomNavigation.tsx:45` | `navigateTo('resonance')` | `navigateTo('circles')` |
| `BottomNavigation.tsx:50` | `navigateTo('profile')` | **supprimer item** |
| `RouterProvider.tsx:7` | `Page` type | Cf. glossaire |
| `AppLayout.tsx:21` | `'home-connected'` | `'attest'` |
| `OnboardingImportPage.tsx:32` | `navigateTo('home-connected')` | `navigateTo('attest')` |
| `OnboardingTutorialPage.tsx:117` | `navigateTo('home-connected')` | `navigateTo('attest')` |
| `OnboardingBookmarkSelectPage.tsx:99` | `navigateTo('Sofia')` | `navigateTo('my-profile')` |
| `SettingsPage.tsx:47` | `navigateTo('Sofia')` | `navigateTo('my-profile')` |

**Call-sites `'profile'` (qualification)** :

- `LeaderboardTab.tsx:83` — **moot** : LeaderboardTab supprimé en G.A
- `CircleFeedTab.tsx:551-552` — `setActiveProfileTab('community')` puis `navigateTo('profile')` → **devient** `setActiveTab('community')` puis `navigateTo('circles')` (la sync logic de CirclesPage prend le relais)

### Audit N4 — Contenu exhaustif `profile-tabs/`

| Fichier | Consommateur principal | Destination |
|---------|------------------------|-------------|
| `StatsTab.tsx` | `ProfilePage` (supprimé) | `score-tabs/ScoreTab.tsx` (renommage) |
| `AchievementsTab.tsx` | `StatsTab` (sous-onglet quests) | `score-tabs/AchievementsTab.tsx` |
| `SocialsTab.tsx` | `ProfilePage` | `my-profile-tabs/SocialsTab.tsx` |
| `CommunityTab.tsx` | `ProfilePage` | `circles-tabs/CommunityTab.tsx` |
| `UserBookmarksTab.tsx` | `UserProfilePage` (route `'user-profile'` — vue d'un autre user) | `user-profile-tabs/UserBookmarksTab.tsx` |
| `UserStatsTab.tsx` | `UserProfilePage` | `user-profile-tabs/UserStatsTab.tsx` |
| `follow/` (5 fichiers) | divers panels (Following, Followers, TrustCircle, Explorer, FollowSearchBox) | `my-profile-tabs/follow/` (sous-dossier intact) |

### Audit N5 — Consommateurs `activeProfileTab`

| Fichier | Usage | Action |
|---------|-------|--------|
| `RouterProvider.tsx:37,38,60,159,160` | définition + exposition | Renommer en `activeTab`/`setActiveTab` |
| `ProfilePage.tsx:32,34,35,73,84-90` | lecture + sync vers state interne | Disparaît (fichier supprimé) |
| `CircleFeedTab.tsx:87,551` | `setActiveProfileTab('community')` | Renommer en `setActiveTab('community')` |

⚠️ **Logique sync importante** (`ProfilePage.tsx:84-90`) :

```tsx
useEffect(() => {
  if (activeProfileTab === 'stats' || ... === 'community' || ... === 'socials') {
    setActiveTab(activeProfileTab)
  }
}, [activeProfileTab])
```

→ **À répliquer dans `CirclesPage`** (filtré sur `'circle' | 'trending' | 'community'`) pour que le bouton `circle-go-btn` continue de fonctionner après refacto.

### Phase 1 — Cascade G.A (effets de bord DebateTab) ✅

| Fichier | Statut |
|---------|--------|
| `resonance-tabs/DebateTab.tsx` | À supprimer (G.A) |
| `resonance-tabs/LeaderboardTab.tsx` | À supprimer (G.A) |
| `resonance-tabs/ClaimCard.tsx` | À supprimer (cascade — consommé uniquement par DebateTab) |
| `resonance-tabs/ListModal.tsx` | À supprimer (cascade) |
| `resonance-tabs/ListCard.tsx` | À supprimer (cascade) |
| `hooks/useDebateClaims.ts` | À supprimer (cascade) |
| `hooks/index.ts:93-94` exports | Retirer `useDebateClaims`, `DebateClaim`, `FeaturedList`, `UseDebateClaimsResult` |
| `hooks/useOnChainStreak.ts` | **Conserver** (utilisé par `QuestProgressService.ts:35,167`) |
| Commentaire `useOnChainStreak.ts:4` | Mettre à jour ("same source as LeaderboardTab" → obsolète) |
| Commentaire `useQuestSystem.ts:63` | Mettre à jour (idem) |
| `Sofia/packages/graphql/.../debate.graphql` | **Inchangée** (utilisée par 7 fichiers de l'explorer — hors scope) |

### Phase 1 — SVG orphelins après refacto ✅

| Asset | Importé par | Statut post-refacto |
|-------|-------------|---------------------|
| `components/ui/icons/Icon=Sofia.svg` | `BottomNavigation.tsx:7` | Suppression |
| `components/ui/icons/ResonanceIcon.svg` | `BottomNavigation.tsx:8` | Suppression |
| `components/ui/icons/Icon=person.svg` | `BottomNavigation.tsx:9` | Suppression |
| `components/ui/icons/Icon=Settings.svg` | `BottomNavigation.tsx:10` | Suppression (remplacé par lucide `Settings`) |

### Phase 1 — Tests / snapshots ✅

Aucun fichier `*.test.*`, `*.spec.*` ni `__snapshots__` impacté dans
`apps/extension/`. Sofia utilise des "manual integration tests"
(`bun run test:all` — hors scope refacto UI).

---

## 6. Plan d'exécution

### Pré-requis

- Branche `ext/refacto-menu` créée ✅
- Audits Phase 0 + Phase 1 ✅

⚠️ **Scope monorepo** : à chaque commit, vérifier que `git diff --stat` ne
contient que `apps/extension/`.

⚠️ **Build green à la fin de chaque phase** (intermédiaire OK pendant le
travail, validation `tsc --noEmit` avant chaque commit).

### Phase 2 — Setup additif (création folders + ScorePage)

Phase strictement additive, ne modifie aucun fichier existant à part les
imports impactés par les `git mv`.

2.1. Créer `components/pages/score-tabs/`
2.2. `git mv profile-tabs/StatsTab.tsx score-tabs/StatsTab.tsx` (rename composant fait en Phase 4)
2.3. `git mv profile-tabs/AchievementsTab.tsx score-tabs/AchievementsTab.tsx`
2.4. Mettre à jour les imports dans `ProfilePage.tsx` (chemins seulement)
2.5. Créer `components/pages/user-profile-tabs/`
2.6. `git mv profile-tabs/UserStatsTab.tsx user-profile-tabs/UserStatsTab.tsx`
2.7. `git mv profile-tabs/UserBookmarksTab.tsx user-profile-tabs/UserBookmarksTab.tsx`
2.8. Mettre à jour les imports dans `UserProfilePage.tsx` (chemins seulement)
2.9. **Créer `components/pages/ScorePage.tsx`** (importe StatsTab depuis `score-tabs/`)

→ Build green attendu. ProfilePage continue de fonctionner (StatsTab et
AchievementsTab importés depuis nouveau chemin).

**Commit** : `refactor(extension): add ScorePage + score-tabs/ + user-profile-tabs/ scaffolding`

### Phase 3 — Réorganisation `resonance-tabs/` → `circles-tabs/` + suppressions G.A

3.1. Modifier `ResonancePage.tsx` : retirer les branches `activeTab === 'debate'` et `activeTab === 'streak'`, supprimer les imports correspondants. Le composant garde son nom et son emplacement pour l'instant (renommage Phase 4).

3.2. **Supprimer les 5 fichiers G.A + cascade** dans `resonance-tabs/` :
- `DebateTab.tsx`
- `LeaderboardTab.tsx`
- `ClaimCard.tsx`
- `ListModal.tsx`
- `ListCard.tsx`

3.3. **Supprimer `hooks/useDebateClaims.ts`**
3.4. Retirer les exports `useDebateClaims`, `DebateClaim`, `FeaturedList`, `UseDebateClaimsResult` de `hooks/index.ts:93-94`
3.5. Mettre à jour les commentaires obsolètes dans `useOnChainStreak.ts:4` et `useQuestSystem.ts:63`

3.6. `git mv components/pages/resonance-tabs/ components/pages/circles-tabs/` (folder rename — il ne reste que `CircleFeedTab.tsx` + `TrendingTab.tsx`)

3.7. Créer `components/pages/my-profile-tabs/`
3.8. `git mv profile-tabs/SocialsTab.tsx my-profile-tabs/SocialsTab.tsx`
3.9. `git mv profile-tabs/follow/ my-profile-tabs/follow/`
3.10. `git mv profile-tabs/CommunityTab.tsx circles-tabs/CommunityTab.tsx`
3.11. Mettre à jour tous les imports impactés (`ProfilePage` et autres consommateurs des fichiers déplacés)

→ Build green attendu. ProfilePage existe encore (importe `SocialsTab` et `CommunityTab` depuis nouveaux chemins).

**Commit** : `refactor(extension): reorganize folders, drop debate/streak tabs and cascade`

### Phase 4 — Renommage composants + sync logic

4.1. `git mv components/pages/HomeConnectedPage.tsx components/pages/AttestPage.tsx`
- Renommer composant `HomeConnectedPage` → `AttestPage`

4.2. `git mv components/pages/CorePage.tsx components/pages/MyProfilePage.tsx`
- Renommer composant `CorePage` → `MyProfilePage`
- Renommer type `CoreTab` → `MyProfileTab`
- Type final : `'echoes' | 'bookmarks' | 'history' | 'socials'`
- Importer `SocialsTab` depuis `my-profile-tabs/SocialsTab`

4.3. `git mv components/pages/ResonancePage.tsx components/pages/CirclesPage.tsx`
- Renommer composant `ResonancePage` → `CirclesPage`
- Renommer type `ResonanceTab` → `CirclesTab`
- Type final : `'circle' | 'trending' | 'community'`
- Importer `CommunityTab` depuis `circles-tabs/CommunityTab`
- **Ajouter sync logic activeTab** (réplication de `ProfilePage.tsx:84-90`, filtrée sur les valeurs valides de `CirclesTab`)

4.4. Renommage `StatsTab` → `ScoreTab` :
- `git mv components/pages/score-tabs/StatsTab.tsx components/pages/score-tabs/ScoreTab.tsx`
- Renommer composant `StatsTab` → `ScoreTab`
- Mettre à jour l'import dans `ScorePage.tsx`
- Mettre à jour l'import dans `ProfilePage.tsx` (qui existe encore — sera supprimé Phase 5)

→ Build green attendu. ProfilePage peut référencer ScoreTab le temps de la transition.

**Commit** : `refactor(extension): rename pages (Attest/MyProfile/Circles) + add CirclesPage sync logic`

### Phase 5 — Routing + suppression ProfilePage + icônes lucide

5.1. `components/layout/RouterProvider.tsx` :
- Type `Page` : retirer `'profile'`, `'home-connected'`, `'Sofia'`, `'resonance'` ; ajouter `'attest'`, `'my-profile'`, `'circles'`, `'score'` ; conserver `'home'`, `'settings'`, `'user-profile'`, `'discovery-profile'`, `'recommendations'`, `'onboarding-*'`
- Renommer `activeProfileTab` → `activeTab` (état + setter + interface)
- Renommer `setActiveProfileTab` → `setActiveTab`

5.2. `sidepanel.tsx` :
- Imports : `<AttestPage />`, `<MyProfilePage />`, `<CirclesPage />`, `<ScorePage />`
- Switch : `case 'attest'`, `case 'my-profile'`, `case 'circles'`, `case 'score'`
- Supprimer `case 'profile'`
- 3 `navigateTo('home-connected')` → `navigateTo('attest')`

5.3. `components/layout/BottomNavigation.tsx` :
- Imports lucide : `Pencil, User, Users, PieChart, Settings`
- Supprimer les 4 imports SVG
- 5 items dans l'ordre : Attest / My Profile / Circles / Score / Settings
- Suppression de l'item Profile

5.4. `components/layout/AppLayout.tsx:21` :
- `currentPage !== 'home-connected'` → `currentPage !== 'attest'`

5.5. Mettre à jour les call-sites navigateTo restants :
- `OnboardingImportPage.tsx:32`, `OnboardingTutorialPage.tsx:117` : `'home-connected'` → `'attest'`
- `OnboardingBookmarkSelectPage.tsx:99`, `SettingsPage.tsx:47` : `'Sofia'` → `'my-profile'`
- `CircleFeedTab.tsx:551-552` : `setActiveProfileTab('community')` → `setActiveTab('community')` ; `navigateTo('profile')` → `navigateTo('circles')`

5.6. **Supprimer `components/pages/ProfilePage.tsx`** (plus d'importeur après 5.2)

5.7. **Supprimer le dossier `components/pages/profile-tabs/`** (vide après Phase 3)

5.8. Supprimer les 4 SVG orphelins :
- `components/ui/icons/Icon=Sofia.svg`
- `components/ui/icons/ResonanceIcon.svg`
- `components/ui/icons/Icon=person.svg`
- `components/ui/icons/Icon=Settings.svg`

→ Build green attendu. La nouvelle nav est complète et fonctionnelle.

**Commit** : `refactor(extension): wire new routing + lucide icons + delete ProfilePage`

### Phase 6 — Nettoyage CSS dead code

6.1. Identifier les classes CSS utilisées par les composants supprimés :

```bash
# Lecture pré-suppression des composants pour lister les classes
# (déjà fait pour ListCard / ListModal en Phase 1)
rg "list-card|list-modal|list-chip|claim-card|debate-" \
   apps/extension/ --type css -l

rg "list-card|list-modal|list-chip|claim-card|debate-" \
   apps/extension/ --include="*.tsx" --include="*.ts"
```

6.2. Pour chaque classe sans match dans `*.tsx`/`*.ts`, supprimer la règle CSS correspondante.

Classes pré-identifiées (depuis lecture Phase 1 de `ListCard.tsx` + `ListModal.tsx`) :
- `list-card`, `list-card-header`, `list-card-image`, `list-card-title`,
  `list-card-content-visible`, `list-card-description`
- `list-chip`, `list-chip-image`, `list-chips-scroll`
- `list-modal`, `list-modal-overlay`, `list-modal-header`, `list-modal-back`,
  `list-modal-title-wrap`, `list-modal-title`, `list-modal-meta`,
  `list-modal-tvl`, `list-modal-loader`, `list-modal-table`
- À compléter avec une lecture de `DebateTab.tsx` et `ClaimCard.tsx` AVANT
  Phase 3 pour ne pas perdre la liste

**Commit** : `refactor(extension): remove dead CSS rules from deleted debate components`

### Phase 7 — Vérifications finales + PR

7.1. `bun run build` (extension uniquement)
7.2. `tsc --noEmit` sur l'extension
7.3. Skill `arch-check` — détecter violations introduites
7.4. Test manuel mode dev :
- Bottom nav : 5 onglets (Attest / My Profile / Circles / Score / Settings), icônes correctes
- Navigation entre les 5 onglets fonctionnelle
- Sous-onglets My Profile : Echoes, Bookmark, History, Socials
- Sous-onglets Circles : Circle, Trending, Community
- Sous-onglets Score : Stats, Quests
- Bouton `circle-go-btn` dans CircleFeedTab → atterrit sur Circles/Community
- Onboarding flow complet → fin sur Attest

7.5. Push branche + ouvrir PR avec :
- Avant/après visuel de la bottom nav
- Tableau des renommages (cf. glossaire section 9)
- Confirmation : IndexedDB intouché, pas de migration storage, pas de page name persisté
- Liste des suppressions (5 composants + 1 hook + 4 SVG + N règles CSS)

---

## 7. Risques & garde-fous

| Risque | Mitigation |
|--------|-----------|
| Modif accidentelle du schéma IndexedDB | Phase 0 ✅ confirme zéro action sur IDB. Vérification `git diff apps/extension/lib/database/` doit être vide à chaque commit |
| Régression sur autres apps du monorepo | Vérification `git diff --stat | grep -v apps/extension/` doit être vide après chaque commit |
| Imports cassés entre commits | Phases ordonnées pour build green à la fin de chaque phase. `tsc --noEmit` avant chaque commit |
| Perte de la sync logic Community | Phase 4.3 réplique explicitement le pattern `ProfilePage.tsx:84-90` dans `CirclesPage` |
| SVG orphelins encore référencés ailleurs | Phase 1 ✅ confirme zéro autre référence (grep tsx/ts/css/html/md) |
| Règles CSS mortes laissées en place | Phase 6 dédiée + grep avant chaque suppression |
| Composant `ScorePage` créé mais pas routé | Phase 5.2 explicite l'ajout du `case 'score':` |
| `circle-go-btn` cassé après refacto | Phase 4.3 + Phase 5.5 (renommage `setActiveTab` + `navigateTo('circles')`) — testé manuellement Phase 7.4 |

---

## 8. Hors-scope (à ne PAS toucher)

- Logique métier des sous-tabs (Echoes, Bookmark, etc.) — uniquement leur emplacement
- Composant `PageBlockchainCard` — inchangé, juste sous nouveau parent
- Design system / CSS modules — pas de refonte visuelle au-delà des icônes
- GraphQL queries (`apps/extension/packages/graphql/` et `Sofia/packages/graphql/`)
- Background services hors mapping nav : `oauth/`, `walletBridge`, `realtime`, etc.
- **Schéma IndexedDB** (toutes versions, tous stores)
- Autres apps du monorepo (`apps/explorer`, `apps/landing`, `apps/og`)
- Packages partagés (`Sofia/packages/`)
- Services backend (`Sofia/services/`, `Sofia/sofia-mastra/`, `intuition-mcp-server/`)

---

## 9. Checklist avant exécution

- [x] Décision A : nom Attest acté
- [x] Décision A2 : icône `Pencil`
- [x] Décision A3 : icône `PieChart`
- [x] Décision E : audit storage (risque ≈ zéro)
- [x] Décision F : audit `navigateTo` (renommages + qualifications)
- [x] Décision F-state : `activeTab` (générique)
- [x] Décision G : G.A — suppression complète DebateTab + LeaderboardTab + cascade (5 composants + 1 hook)
- [x] Décision M.A : pas de script de migration
- [x] Bottom nav : 5 onglets (Score promu au niveau 1)
- [x] Branche `ext/refacto-menu` créée
- [x] Phase 0 : audit IndexedDB → GO
- [x] Phase 1 : audits SVG + cascade G.A + tests/snapshots → GO
- [x] Audit M2 : messages chrome.runtime → 0 page name
- [x] Audit N4 : `profile-tabs/` exhaustif → 7 fichiers + sous-dossier `follow/` mappés
- [x] Audit N5 : 3 consommateurs `activeProfileTab` identifiés + sync logic à répliquer
- [x] BDD intouchée (contrainte Maxime)

---

## 10. Glossaire des renommages

```
Bottom nav        4 items (Home/Sofia/Resonance/Profile/Settings)
                  →  5 items (Attest / My Profile / Circles / Score / Settings)

Page keys         home-connected   →  attest
                  Sofia            →  my-profile
                  resonance        →  circles
                  profile          →  (supprimé)
                  (nouveau)        →  score   (page niveau 1)

Components        HomeConnectedPage →  AttestPage
                  CorePage          →  MyProfilePage
                  ResonancePage     →  CirclesPage
                  StatsTab          →  ScoreTab
                  (nouveau)         →  ScorePage (page niveau 1)
                  ProfilePage       →  (supprimé)
                  DebateTab         →  (supprimé — G.A)
                  LeaderboardTab    →  (supprimé — G.A)
                  ClaimCard         →  (supprimé — cascade)
                  ListModal         →  (supprimé — cascade)
                  ListCard          →  (supprimé — cascade)

Hooks             useDebateClaims  →  (supprimé — cascade)
                  useOnChainStreak →  (conservé — utilisé par QuestProgressService)

Types             CoreTab          →  MyProfileTab ('echoes'|'bookmarks'|'history'|'socials')
                  ResonanceTab     →  CirclesTab ('circle'|'trending'|'community')
                  (nouveau)        →  ScoreTab ('stats'|'quests')
                  ProfileTab       →  (supprimé — réparti dans MyProfileTab + CirclesTab + ScorePage)
                  DebateClaim, FeaturedList, UseDebateClaimsResult → (supprimés)

Tab keys          'debate', 'streak'              →  (supprimés)
                  'stats' (sous-onglet Profile)   →  'score' (page niveau 1)
                  Sous-state interne de Score : 'stats' | 'quests' conservé
                  (autres tabs gardent leur nom)

Folders           components/pages/resonance-tabs/   →  circles-tabs/
                  components/pages/profile-tabs/     →  (supprimé — contenu réparti)
                  (nouveau)                          →  components/pages/my-profile-tabs/
                  (nouveau)                          →  components/pages/score-tabs/
                  (nouveau)                          →  components/pages/user-profile-tabs/

Router state      activeProfileTab    →  activeTab (générique)
                  setActiveProfileTab →  setActiveTab

Branch            ext/refacto-menu (créée)
```
