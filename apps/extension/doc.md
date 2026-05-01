# Refacto navigation Sofia extension

> Status: **plan validé, audits E & F effectués, prêt à exécuter par phases**
> Branche cible : `ext/refacto-menu`
> Scope : `Sofia/apps/extension/` uniquement
> Contrainte forte (Maxime) : **NE PAS toucher au schéma IndexedDB**. Migrations
> au lancement avec scripts de déplacement de data, puis cleanup des volumes
> orphelins.

---

## 1. Objectif

Restructurer la navigation de l'extension pour aligner sur la mental map de
Sofia-explorer et clarifier les usages :

- Bottom nav : 5 onglets — Attest / My Profile / Circles / Score / Settings
- Migrer les icônes custom SVG vers lucide-react (cohérence avec l'explorer)
- Éclater l'ancien onglet Profile : Socials → My Profile, Community → Circles,
  Stats/Quests → nouveau menu **Score** (niveau 1)
- Renommer Home → **Attest** (vocabulaire natif Intuition Protocol)

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

### Sous-onglets

- **CorePage** (`components/pages/CorePage.tsx:11`) — `CoreTab = 'Echoes' | 'Bookmarks' | 'History'`
- **ResonancePage** (`components/pages/ResonancePage.tsx:14`) — `ResonanceTab = 'circle' | 'trending' | 'debate' | 'streak'` (la clé `'debate'` rend `DebateTab`)
- **ProfilePage** (`components/pages/ProfilePage.tsx:28-29`) — `ProfileTab = 'stats' | 'community' | 'socials'`, sous-tab `'stats' | 'quests'`
- **HomeConnectedPage** — composant unique `PageBlockchainCard`

### Routing

State machine via `RouterProvider.tsx` (Context API) + switch dans
`sidepanel.tsx:69-95`. Pas de React Router.

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

- **AttestPage** — `PageBlockchainCard` (inchangé sur le fond)
- **MyProfilePage** — `MyProfileTab = 'echoes' | 'bookmarks' | 'history' | 'socials'`
- **CirclesPage** — `CirclesTab = 'circle' | 'trending' | 'community'`
  - ⚠️ Suppression des sous-onglets `'debate'` (DebateTab) et `'streak'`
    (LeaderboardTab) — cf. décision G
- **ScorePage** *(nouveau, niveau 1)* — `ScoreTab = 'stats' | 'quests'`
  - Reprend l'ex-StatsTab (avec son sous-state) et l'AchievementsTab
  - Promotion de l'ancien sous-onglet Stats au rang d'onglet primaire

---

## 4. Décisions actées

| Réf | Décision |
|-----|----------|
| Settings | Conservé en 4ème onglet de la bottom nav |
| Icônes | lucide-react partout (cohérence avec `Sofia-explorer/src/components/Sidebar.tsx:5`) |
| Icône Circles | `Users` (validé via SVG fourni) |
| Icône My Profile | `User` |
| Icône Settings | `Settings` (déjà en place) |
| **Nom Attest** | Acté — vocabulaire natif Intuition Protocol |
| ~~Renommage `vote`~~ | **Annulé** — l'onglet vote/debate disparaît du menu Circles |
| **Icône Attest** | `Pencil` (lucide — crayon) |
| **`activeProfileTab`** | Renommé en `activeTab` (générique) |
| **Décision G** | **G.A : suppression complète** des composants `DebateTab` + `LeaderboardTab` |
| Hook orphelin | `useDebateClaims` supprimé en cascade (consommé uniquement par DebateTab) |
| Hook conservé | `useOnChainStreak` gardé (utilisé par `QuestProgressService`) |
| Stats | Reste niveau 1 dans My Profile, conserve sous-tabs `stats` + `quests` |
| Renommage interne | Composants, types, fichiers — tout |
| **Onglet Score (niveau 1)** | Nouvel onglet primaire dans la bottom nav. Promotion de l'ex-sous-onglet Stats. Regroupe Stats + Quests (sous-state `'stats' \| 'quests'` conservé) |
| **Icône Score** | `PieChart` (lucide) — validé via SVG fourni |
| **Bottom nav** | 5 onglets : Attest / My Profile / Circles / Score / Settings |
| Dossier | `resonance-tabs/` → `circles-tabs/` |
| Migration tabs | Stats/Socials → `my-profile-tabs/`, Community → `circles-tabs/`. `profile-tabs/` supprimé |
| Branche | `ext/refacto-menu` |
| **IndexedDB** | **Schéma intouchable** (constraint Maxime). Pas de bump de version. Pas de modif des stores |

---

## 5. Décision G — Sort des composants `DebateTab` et `LeaderboardTab`

**Décision actée : G.A — Suppression complète.**

Les sous-onglets `vote` (DebateTab) et `streak` (LeaderboardTab) disparaissent
du menu Circles (passage de 5 → 3 sous-onglets : `circle | trending |
community`).

### Effets de bord (audit en cascade)

```bash
rg "useDebateClaims|useOnChainStreak|LeaderboardTab|DebateTab" apps/extension/
```

| Élément | Statut | Raison |
|---------|--------|--------|
| `components/pages/resonance-tabs/DebateTab.tsx` | **À supprimer** | Décision G.A |
| `components/pages/resonance-tabs/LeaderboardTab.tsx` | **À supprimer** | Décision G.A |
| `hooks/useDebateClaims.ts` | **À supprimer en cascade** | Consommé uniquement par DebateTab |
| `hooks/index.ts:93-94` exports `useDebateClaims`, `DebateClaim`, `FeaturedList`, `UseDebateClaimsResult` | **À retirer du barrel** | Hook supprimé |
| `hooks/useOnChainStreak.ts` | **À conserver** | Utilisé aussi par `QuestProgressService.ts:35,167` |
| `hooks/index.ts:77-78` exports `useOnChainStreak` | **À conserver** | Hook conservé |
| Commentaire `useOnChainStreak.ts:4` "same source as LeaderboardTab" | **À mettre à jour** | Référence obsolète post-suppression |
| Commentaire `useQuestSystem.ts:63` "same source as LeaderboardTab" | **À mettre à jour** | Référence obsolète post-suppression |
| Call-site `LeaderboardTab.tsx:83` `navigateTo('profile')` | **Disparaît avec le fichier** | Plus à mapper dans audit F |
| Services GraphQL / queries spécifiques debate | **À auditer** | Vérifier si des queries dans `packages/graphql/` ne servent qu'à `useDebateClaims` |
| CSS spécifique | Aucun fichier `.css` dans `resonance-tabs/` (audit confirmé) | Pas d'action |

### Audit secondaire à faire en Phase 1

```bash
# Queries GraphQL spécifiques aux debates
rg "debate|Debate" apps/extension/packages/graphql/

# Composants/utils consommés uniquement par DebateTab/LeaderboardTab
# (revoir après suppression : tsc remontera les orphelins)
```

---

## 5b. Décisions tranchées sans input utilisateur

| Réf | Question | Choix | Justification |
|-----|----------|-------|---------------|
| A2 | Icône Attest | **`Pencil`** (lucide) | User a demandé "un crayon" |
| F-state | `activeProfileTab` → quoi ? | **`activeTab`** (générique) | Plus simple, suffisant pour les besoins identifiés (CircleFeedTab pré-sélectionne community). Évite la prolifération de states |

## 5c. Décision A3 — Icône de l'onglet Score

**Décision actée : `PieChart`** (lucide-react), validée via SVG fourni par
l'utilisateur (camembert avec quart filled).

---

## 6. Audit E — Persistance de l'état navigation

### Méthodologie

- `grep -rn "chrome\.storage\." apps/extension/` → 86 occurrences inventoriées
- `grep -rn "indexedDB|IDBDatabase|openDB" apps/extension/` → 18 occurrences
- Lecture ciblée `RouterProvider.tsx:1-122` pour comprendre la persistance des
  pages

### Résultats

#### chrome.storage.session (volatile, par session navigateur)

| Clé | Type valeur | Référence page name ? |
|-----|-------------|------------------------|
| `walletAddress` | string | ❌ |
| `walletType` | string | ❌ |
| `oauth_state_<state>` | object (PKCE) | ❌ |
| `pending_external_auth` | boolean | ❌ |
| `pending_profile_view` | `{walletAddress, termId, label}` | ❌ |
| `pending_first_claim` | `{url}` | ❌ |
| (`OAuthFlowManager`) `oauth_state_*` | flow state | ❌ |

#### chrome.storage.local (persistant)

| Clé | Service | Référence page name ? |
|-----|---------|------------------------|
| Tokens OAuth | `TokenManager` | ❌ |
| `syncInfo_*` | `SyncManager` | ❌ |
| `lastActiveWallet` | `messageHandlers` | ❌ |
| `discord_profile`, `<wallet>_discord_profile` | `PlatformDataFetcher` | ❌ |
| Gold keys (`discoveryKey`, `certKey`, `spentKey`) | `useGoldSystem` | ❌ |
| Quest keys, badge totals | `QuestBadgeService` | ❌ |
| Attestation keys | `useSocialVerifier` | ❌ |
| Onboarding claim flag | `useOnboardingClaim` | ❌ |
| Identity resolution cache | `useIdentityResolution` | ❌ |
| React Query cache (queryClient) | `lib/providers/queryClient` | ❌ |

#### IndexedDB (10 stores, db `sofia-extension-db` v8)

`TRIPLETS_DATA`, `NAVIGATION_DATA`, `USER_PROFILE`, `USER_SETTINGS`,
`SEARCH_HISTORY`, `BOOKMARK_LISTS`, `BOOKMARKED_TRIPLETS`, `RECOMMENDATIONS`,
`INTENTION_GROUPS`, `USER_XP`.

→ Aucun store n'a de schéma référencé par page name dans le code audité. Le
store `USER_SETTINGS` est à vérifier (pourrait stocker un `lastActiveTab`)
mais lecture du shape n'a pas révélé de tel champ. **À reverify en Phase 1
avant le go.**

#### Persistance de `currentPage`

`RouterProvider.tsx:56` — `currentPage` vit dans **un `useState` local
uniquement**. Aucune écriture vers chrome.storage ou IndexedDB. À chaque
ouverture du sidepanel, l'utilisateur repart de `initialPage` (par défaut
`'home'`, cf. ligne 54).

### Conclusion E

**Le risque de perte de data est essentiellement nul** parce que :

1. Les noms de pages ne sont stockés nulle part dans `chrome.storage.*`
2. IndexedDB n'est pas touché (contrainte Maxime respectée par construction)
3. `currentPage` n'est pas persisté — l'utilisateur ne peut pas se retrouver
   sur une page avec un nom obsolète au reboot

**Migration storage minimaliste** (à valider avant Phase 1) :

```ts
// background/migrations/2026-05-nav-rename.ts
// Filet de sécurité : si jamais une key contenait 'debate' (ex. deeplink share)
// ou un autre legacy nav-related, on remappe.

const TAB_MIGRATIONS: Record<string, string> = {
  debate: "vote",
}

// Pas de PAGE_MIGRATIONS — aucune key storage ne contient de page name actuelle.
```

**Vérifications restantes en Phase 1 (avant exécution)** :

- Lire le shape réel du store `USER_SETTINGS` (`lib/database/indexedDB.ts` +
  `userSettingsService` méthodes get/set) pour confirmer absence de
  `lastActiveTab` ou `defaultPage`
- Grep sur les schemas TypeScript des stores IndexedDB : `rg "tab|page|nav"
  apps/extension/lib/database/`
- Si un champ persiste un nom de page → ajouter une migration *en lecture
  seule* (mapping à la lecture, pas réécriture du store) pour respecter la
  contrainte "ne pas toucher au schéma"

**Cleanup volumes orphelins** (post-migration, cf. Maxime) :

- Aucun volume IndexedDB à supprimer (schéma intouché)
- Si une key `chrome.storage.local` devenait orpheline (ex. cache préfixé par
  un nom de page), `chrome.storage.local.remove()` ciblé
- À identifier en fin de Phase 5

---

## 7. Audit F — Call-sites `navigateTo('profile')` orphelins

### Méthodologie

`grep -rn "navigateTo(" apps/extension/` → 28 occurrences. Filtré sur les
arguments `'profile'`, `'Sofia'`, `'resonance'`, `'home-connected'`.

### Inventaire complet `navigateTo` à modifier

| Fichier:ligne | Appel | Mapping cible | Justification |
|---|---|---|---|
| `sidepanel.tsx:47` | `navigateTo('home-connected')` | `'attest'` | Renommage 1:1 |
| `sidepanel.tsx:56` | `navigateTo('home-connected')` | `'attest'` | Renommage 1:1 |
| `sidepanel.tsx:60` | `navigateTo('home-connected')` | `'attest'` | Renommage 1:1 |
| `sidepanel.tsx:74` | `case 'home-connected':` (switch) | `case 'attest':` | Renommage 1:1 |
| `sidepanel.tsx:78` | `case 'profile':` (switch) | **supprimer** | Page ProfilePage supprimée |
| `sidepanel.tsx:80` | `case 'Sofia':` (switch) | `case 'my-profile':` | Renommage 1:1 |
| `sidepanel.tsx:82` | `case 'resonance':` (switch) | `case 'circles':` | Renommage 1:1 |
| `BottomNavigation.tsx:35` | `navigateTo('home-connected')` | `'attest'` | Renommage 1:1 |
| `BottomNavigation.tsx:40` | `navigateTo('Sofia')` | `'my-profile'` | Renommage 1:1 |
| `BottomNavigation.tsx:45` | `navigateTo('resonance')` | `'circles'` | Renommage 1:1 |
| `BottomNavigation.tsx:50` | `navigateTo('profile')` | **supprimer item** | Item Profile retiré de la nav |
| `RouterProvider.tsx:7` | `type Page = 'home' \| 'settings' \| 'profile' \| 'home-connected' \| 'Sofia' \| ... \| 'resonance' \| ...` | `'home' \| 'settings' \| 'attest' \| 'my-profile' \| 'circles' \| 'user-profile' \| 'discovery-profile' \| 'recommendations' \| 'onboarding-*'` | Suppression `'profile'`, renommages |
| `AppLayout.tsx:21` | `currentPage !== 'home-connected'` | `currentPage !== 'attest'` | Renommage 1:1 |
| `OnboardingImportPage.tsx:32` | `navigateTo('home-connected')` | `'attest'` | Renommage 1:1 |
| `OnboardingTutorialPage.tsx:117` | `navigateTo('home-connected')` | `'attest'` | Renommage 1:1 |
| `OnboardingBookmarkSelectPage.tsx:99` | `navigateTo('Sofia')` | `'my-profile'` | Renommage 1:1 |
| `SettingsPage.tsx:47` | `navigateTo('Sofia')` | `'my-profile'` | Renommage 1:1 |

### Call-sites `'profile'` à qualifier (les "orphelins" de F)

#### F.1 — `LeaderboardTab.tsx:83`

```tsx
const navigateToUser = (entry: (typeof entries)[0]) => {
  if (entry.isCurrentUser) {
    navigateTo("profile")
    return
  }
  navigateTo("user-profile", { ...entry... })
}
```

**Contexte** : utilisateur clique sur sa propre entrée dans le leaderboard →
on l'envoie sur **sa** page profile (vue self).

**Mapping cible** : `navigateTo('my-profile')` (sans préciser de tab — le
défaut de MyProfilePage sera Stats, ce qui colle).

#### F.2 — `CircleFeedTab.tsx:552`

```tsx
<button
  className="circle-go-btn"
  onClick={() => {
    setActiveProfileTab('community')
    navigateTo('profile')
  }}
>
```

**Contexte** : bouton "circle-go-btn" qui force `activeProfileTab='community'`
puis navigue vers Profile. C'est l'usage **explicite Community**.

**Mapping cible** : `navigateTo('circles')` + `setActiveProfileTab('community')`
(la state `activeProfileTab` du RouterProvider doit aussi être renommée en
`activeCirclesTab` ou rester polymorphe — cf. point ouvert ci-dessous).

### Point ouvert post-audit F

`RouterProvider.tsx:37,60` expose `activeProfileTab: string | null`. Cette
state est utilisée par `CircleFeedTab` pour pré-sélectionner un sous-onglet
avant navigation. Après refacto :

- Renommer `activeProfileTab` → `activeTab` (générique) ?
- Ou créer `activeCirclesTab` + `activeMyProfileTab` séparés ?

**Reco** : renommer en `activeTab: string | null` (générique, simple). À
trancher en Phase 2.

---

## 8. Plan d'exécution

### Pré-requis

```bash
cd /home/chauche/Sofia
git status                              # base propre
git checkout -b ext/refacto-menu
```

⚠️ **Scope monorepo** : ne toucher qu'à `apps/extension/`. Vérifier après
chaque phase :

```bash
git diff --stat | grep -v "apps/extension/"
# doit être vide
```

### Phase 0 — Pré-vérifs IndexedDB (✅ EXÉCUTÉE — GO)

**Résultats audit IndexedDB** (effectué sur `ext/refacto-menu` après commit
initial du plan) :

#### Version DB

`apps/extension/lib/database/indexedDB.ts:24` — `DB_VERSION = 10`. Le commit
v10 a déjà nettoyé 5 stores inutilisés (`navigation_data`, `user_profile`,
`search_history`, `recommendations`, `user_xp`). La doc CLAUDE.md projet
mentionne "10 stores" — info obsolète à corriger ultérieurement.

#### Stores actuels (6)

| Store | Type record | Référence page name ? |
|-------|-------------|------------------------|
| `TRIPLETS_DATA` (`triplets_data`) | `TripletsRecord` (messages, triplets, parsed_message…) | ❌ |
| `USER_SETTINGS` (`user_settings`) | `SettingsRecord` → `ExtensionSettings` | ❌ |
| `BOOKMARK_LISTS` (`bookmark_lists`) | `BookmarkListRecord` | ❌ |
| `BOOKMARKED_TRIPLETS` (`bookmarked_triplets`) | `BookmarkedTripletRecord` | ❌ |
| `INTENTION_GROUPS` (`intention_groups`) | `IntentionGroupRecord` (domaines, predicates) | ❌ |
| `CART_ITEMS` (`cart_items`) | `CartItemRecord` | ❌ |

#### Shape `ExtensionSettings` (`types/storage.ts:6-16`)

```ts
export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: boolean
  autoBackup: boolean
  debugMode: boolean
  isTrackingEnabled: boolean
  autoCleanup: boolean
  autoCleanupInactiveDays: number
  autoCleanupMinLevel: number
}
```

Aucun champ `lastActiveTab` / `defaultPage` / `lastPage` / `currentPage` /
`activeTab`. Le store **n'a strictement rien à migrer**.

#### Conclusion Phase 0

**GO** — le refacto peut procéder sans modif du schéma IndexedDB.

- Pas de bump de version DB nécessaire (`DB_VERSION` reste à 10)
- Pas de migration en lecture des records existants
- Contrainte Maxime "ne pas toucher à IndexedDB" respectée par construction
- Aucune perte de data possible côté IDB

### Phase 1 — Audit final (read-only, déjà ~80% fait dans ce doc)

1.1. Compléter Phase 0 (USER_SETTINGS shape)
1.2. Inventaire des assets SVG à supprimer :
- `components/ui/icons/Icon=Sofia.svg`
- `components/ui/icons/ResonanceIcon.svg`
- `components/ui/icons/Icon=person.svg`

Vérifier qu'aucun import résiduel ne les utilise après refacto :

```bash
rg "Icon=Sofia\.svg|ResonanceIcon\.svg|Icon=person\.svg" apps/extension/
```

1.3. Lancer skill `arch-check` — baseline avant refacto

### Phase 2 — Charpente nav + routing

2.1. `components/layout/BottomNavigation.tsx`
- Imports lucide : `Pencil`, `User`, `Users`, `PieChart`, `Settings`
- 5 items dans l'ordre : Attest / My Profile / Circles / Score / Settings
- Suppression item Profile (la nav ne contient plus d'onglet "Profile" autonome)
- Suppression imports SVG

2.2. `components/layout/RouterProvider.tsx`
- Type `Page` : `'home-connected'` → `'attest'`, `'Sofia'` → `'my-profile'`,
  `'resonance'` → `'circles'`, **ajout `'score'`**, suppression `'profile'`
- Renommer `activeProfileTab` → `activeTab` (cf. point ouvert F)
- Garder `'home'`, `'user-profile'`, `'discovery-profile'`, `'recommendations'`,
  `'onboarding-*'` intacts
- `initialPage` par défaut : conserver `'home'`

2.3. `sidepanel.tsx`
- Switch case keys mises à jour (lignes 74-82)
- Suppression case `'profile'`
- **Ajout case `'score'` → `<ScorePage />`**
- 3 `navigateTo('home-connected')` → `'attest'`

2.4. `components/layout/AppLayout.tsx:21`
- `currentPage !== 'home-connected'` → `currentPage !== 'attest'`

2.5. Migration `chrome.storage` (filet de sécurité tabs)
- `background/migrations/2026-05-nav-rename.ts` créé
- Branché au boot du service worker (`background/index.ts`)
- Idempotent via flag `nav-migration-2026-05-applied` dans
  `chrome.storage.local`
- Log discret pour debug

### Phase 3 — Renommage fichiers/composants

3.1. `HomeConnectedPage.tsx` → `AttestPage.tsx`
- Composant `HomeConnectedPage` → `AttestPage`
- Re-export depuis le barrel si applicable

3.2. `CorePage.tsx` → `MyProfilePage.tsx`
- Composant `CorePage` → `MyProfilePage`
- Type `CoreTab` → `MyProfileTab = 'echoes' | 'bookmarks' | 'history' | 'socials'`
- Imports `SocialsTab` (chemin post-Phase 4)
- ⚠️ My Profile ne contient **pas** Score (qui devient une page niveau 1)

3.2bis. **Création `components/pages/ScorePage.tsx`** (nouveau fichier)
- Composant `ScorePage` (page niveau 1, pattern aligné sur MyProfilePage/CirclesPage)
- Type `ScoreTab = 'stats' | 'quests'` (sous-state interne)
- Reprend la logique de l'ex-StatsTab (incl. son sous-toggle stats/quests)
- Utilise `ScoreTab.tsx` (renommage de l'ex-StatsTab) + `AchievementsTab.tsx`

3.3. `ResonancePage.tsx` → `CirclesPage.tsx`
- Composant `ResonancePage` → `CirclesPage`
- Type `ResonanceTab = 'circle' | 'trending' | 'debate' | 'streak'` → `CirclesTab = 'circle' | 'trending' | 'community'`
- Suppression des branches `activeTab === 'debate'` et `activeTab === 'streak'`
- Import `CommunityTab` (chemin post-Phase 4)

3.4. `resonance-tabs/` → `circles-tabs/`
- `git mv` du dossier
- **Suppression** `DebateTab.tsx` + `LeaderboardTab.tsx` (décision G.A actée)
- **Suppression** `hooks/useDebateClaims.ts` (orphelin post-G.A)
- Retrait des exports correspondants dans `hooks/index.ts:93-94`
- Mise à jour des commentaires obsolètes dans `useOnChainStreak.ts:4` et
  `useQuestSystem.ts:63`
- Mettre à jour les imports restants

### Phase 4 — Migration tabs ex-Profile

4.1. Créer dossiers cibles :
- `components/pages/my-profile-tabs/`
- `components/pages/score-tabs/`

4.2. Migration **vers `score-tabs/`** :
- `git mv profile-tabs/StatsTab.tsx score-tabs/ScoreTab.tsx` (renommage simultané)
- `git mv profile-tabs/AchievementsTab.tsx score-tabs/AchievementsTab.tsx`
  *(à vérifier en Phase 1 si AchievementsTab est consommé seulement par
  Stats/Quests — sinon ajuster destination)*

4.3. Migration **vers `my-profile-tabs/`** :
- `git mv profile-tabs/SocialsTab.tsx my-profile-tabs/SocialsTab.tsx`
- `git mv profile-tabs/follow/ my-profile-tabs/follow/` (sous-dossier intact, à
  vérifier en Phase 1 que follow est bien lié à Socials et non à Community)

4.4. Migration **vers `circles-tabs/`** :
- `git mv profile-tabs/CommunityTab.tsx circles-tabs/CommunityTab.tsx`

4.5. Supprimer `ProfilePage.tsx`
4.6. Supprimer dossier `profile-tabs/` (vérifier vide)
4.7. Mettre à jour tous les imports impactés (`StatsTab` → `ScoreTab` partout,
     plus les changements de chemin)

### Phase 5 — Nettoyage transverse

5.1. Mapping de remplacement final (issu Phase 1 + audit F) :

| Avant | Après | Fichiers |
|-------|-------|----------|
| `navigateTo('home-connected')` | `navigateTo('attest')` | sidepanel x3, BottomNav, OnboardingImport, OnboardingTutorial |
| `navigateTo('Sofia')` | `navigateTo('my-profile')` | BottomNav, OnboardingBookmarkSelect, SettingsPage |
| `navigateTo('resonance')` | `navigateTo('circles')` | BottomNav |
| `LeaderboardTab.tsx:83` `navigateTo('profile')` | `navigateTo('my-profile')` | LeaderboardTab (sauf si suppression — cf. décision G) |
| `CircleFeedTab.tsx:552` `navigateTo('profile')` | `navigateTo('circles')` (Community pré-sélectionné via `setActiveTab('community')`) | CircleFeedTab |
| `'home-connected'` (string literal) | `'attest'` | sidepanel switch, AppLayout |
| `'Sofia'` (switch case) | `'my-profile'` | sidepanel switch |
| `'resonance'` (switch case) | `'circles'` | sidepanel switch |
| `setActiveProfileTab(...)` | `setActiveTab(...)` | CircleFeedTab + RouterProvider |

5.2. Suppression des SVG orphelins (vérifier zéro match avant)
5.3. `bun run build` (extension uniquement)
5.4. `tsc --noEmit` sur l'extension
5.5. Skill `arch-check` — comparer baseline Phase 1
5.6. Test manuel mode dev :
- Bottom nav : **5 onglets** (Attest / My Profile / Circles / Score / Settings), icônes correctes
- Navigation entre les 5 onglets fonctionnelle
- Sous-onglets My Profile : Echoes, Bookmark, History, Socials (4 onglets)
- Sous-onglets Circles : Circle, Trending, Community (3 onglets, plus de Streak ni Vote)
- **Sous-onglets Score** : Stats, Quests (2 onglets — promotion ex-sous-onglet de Profile au rang d'onglet primaire)
- Bouton "circle-go-btn" depuis CircleFeedTab → atterrit bien sur
  Circles/Community
- Click sur soi-même dans Leaderboard → atterrit bien sur My Profile/Stats
- Onboarding flow complet → fin sur Attest (ex-Home Connected)

### Phase 6 — PR

6.1. Commit atomique par phase (Phase 2 / 3 / 4 / 5 séparément)
6.2. PR description :
- Avant/après visuel de la bottom nav
- Tableau de mapping page keys (cf. Phase 5.1)
- Stratégie migration storage explicitée (rappel : risque ~zéro confirmé
  par audit E)
- Confirmation IndexedDB intouché
- Liste des call-sites `navigateTo('profile')` redirigés (audit F.1, F.2)

---

## 9. Risques & garde-fous

| Risque | Mitigation |
|--------|-----------|
| Perte de data utilisateur post-MAJ | Audit E confirme : aucun storage ne référence de page name. Filet de sécurité `TAB_MIGRATIONS` pour `'debate'` → `'vote'` |
| Modif accidentelle du schéma IndexedDB | Phase 0 explicite + check `git diff apps/extension/lib/database/` doit être vide ou ne contenir que des renommages cosmétiques (commentaires) |
| Régression sur autres apps du monorepo | Vérification `git diff --stat` après chaque phase doit ne montrer que `apps/extension/` |
| Imports cassés après renommage massif | `tsc --noEmit` + `arch-check` post-Phase 5 |
| SVG orphelins encore référencés (tests, snapshots, README, manifest) | Grep large avant suppression : `rg "Icon=Sofia|ResonanceIcon|Icon=person" apps/extension/` |
| Sous-tab `'debate'` référencé en deeplink externe (URL share) | `TAB_MIGRATIONS['debate'] = 'vote'` dans la migration storage |
| Tests E2E ou snapshots qui hardcodent les anciens labels | Phase 1 grep aussi dans `**/*.test.{ts,tsx}` et `**/__snapshots__/` |
| `USER_SETTINGS` IndexedDB stocke un `lastActiveTab` non détecté | Phase 0 GO/NO-GO bloquant. Si trouvé → mapping read-only, schéma intact |

---

## 10. Hors-scope (à ne PAS toucher)

- Logique métier des sous-tabs (Echoes, Bookmark, etc.) — uniquement leur emplacement
- Composant `PageBlockchainCard` — reste inchangé, juste sous nouveau parent
- Design system / CSS modules — pas de refonte visuelle au-delà des icônes
- GraphQL queries (`apps/extension/packages/graphql/`)
- Background services hors migration : `oauth/`, `walletBridge`, `realtime`, etc.
- **Schéma IndexedDB** (toutes versions, tous stores)
- Autres apps du monorepo (`apps/explorer`, `apps/landing`, `apps/og`)
- Packages partagés (`Sofia/packages/`)
- Services backend (`Sofia/services/`, `Sofia/sofia-mastra/`)

---

## 11. Checklist avant exécution

- [x] Décision A : nom Attest acté
- [x] Décision A2 : icône `Pencil` actée
- [x] Décision A3 : icône Score `PieChart` actée
- [x] Décision E : audit fait, risque ~zéro confirmé, stratégie migration acté
- [x] Décision F : audit fait, mappings F.1 + F.2 documentés
- [x] Décision F-state : `activeTab` (générique) tranché
- [x] Décision G : G.A — suppression complète de DebateTab + LeaderboardTab + useDebateClaims
- [x] Bottom nav : 5 onglets (Score promu au niveau 1)
- [x] Branche cible : `ext/refacto-menu` (créée, premier commit `fd0a33f1` posé)
- [x] Phase 0 (USER_SETTINGS shape) exécutée et **GO** validé
- [x] BDD intouchée (contrainte Maxime respectée par construction — aucune migration nécessaire)

---

## 12. Glossaire des renommages

```
Bottom nav        4 items          →  5 items (Attest / My Profile / Circles / Score / Settings)

Page keys         home-connected   →  attest
                  Sofia            →  my-profile
                  resonance        →  circles
                  profile          →  (supprimé)
                  (nouveau)        →  score   (page niveau 1)

Components        HomeConnectedPage →  AttestPage
                  CorePage          →  MyProfilePage
                  ResonancePage     →  CirclesPage
                  StatsTab          →  ScoreTab (composant feuille)
                  (nouveau)         →  ScorePage (page niveau 1)
                  ProfilePage       →  (supprimé)
                  DebateTab         →  (supprimé — décision G.A)
                  LeaderboardTab    →  (supprimé — décision G.A)

Hooks             useDebateClaims  →  (supprimé — orphelin post-G.A)
                  useOnChainStreak →  (conservé — utilisé par QuestProgressService)

Types             CoreTab          →  MyProfileTab ('echoes'|'bookmarks'|'history'|'socials')
                  ResonanceTab     →  CirclesTab ('circle'|'trending'|'community')
                  (nouveau)        →  ScoreTab ('stats'|'quests')
                  ProfileTab       →  (supprimé, fusionné dans MyProfileTab + CirclesTab + ScorePage)
                  DebateClaim, FeaturedList, UseDebateClaimsResult → (supprimés)

Tab keys          'debate', 'streak'              →  (supprimés)
                  'stats' (sous-onglet de Profile) →  'score' (page niveau 1)
                  Sous-state interne de Score : 'stats' | 'quests' conservé
                  (autres tabs gardent leur nom)

Folders           components/pages/resonance-tabs/   →  circles-tabs/
                  components/pages/profile-tabs/     →  (supprimé, contenu réparti)
                  (nouveau)                          →  components/pages/my-profile-tabs/
                  (nouveau)                          →  components/pages/score-tabs/

Router state      activeProfileTab →  activeTab (générique)

Branch            (à créer)        →  ext/refacto-menu
```
