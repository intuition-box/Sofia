# Plan: Storage par Wallet (Per-Wallet Identity)

## Le Problème

Actuellement, quand tu changes de wallet dans l'extension :
- **Wallet A** (MetaMask) → tu lies Discord, tu fais des quêtes
- **Wallet B** (Rabby) → tu vois ENCORE les données de Wallet A (Discord, quêtes, etc.)

C'est parce que les données locales sont stockées **sans** être liées à l'adresse wallet.

---

## La Solution

Stocker chaque donnée avec l'adresse wallet comme clé :

```
AVANT (partagé entre tous les wallets):
  oauth_token_discord
  completed_quests
  discord_profile

APRÈS (isolé par wallet):
  oauth_token_discord_0x78e8...6962   ← Wallet A
  oauth_token_discord_0xc634...d551   ← Wallet B
  completed_quests_0x78e8...6962      ← Wallet A
  completed_quests_0xc634...d551      ← Wallet B
```

---

## Ce qui est DÉJÀ par wallet ✅

Ces données viennent de la **blockchain** via GraphQL et utilisent déjà `walletAddress` :

| Donnée | Source |
|--------|--------|
| Signals créés | GraphQL → `triples` avec positions du wallet |
| Follows/Trusts | GraphQL → `triples` avec positions du wallet |
| Quest badges | On-chain → `checkOnChainQuestBadges()` sync auto |
| Social links vérifiés | On-chain → triples créés par le bot verifier |

**Pas besoin de modifier** - ça marche déjà !

---

## Ce qui doit être modifié ❌ → ✅

### 1. OAuth Tokens (TokenManager.ts)

```typescript
// AVANT
oauth_token_discord
oauth_token_youtube
oauth_token_spotify
oauth_token_twitch
oauth_token_twitter

// APRÈS
oauth_token_discord_0x78e8...
oauth_token_youtube_0x78e8...
// etc.
```

**Fichier:** `background/oauth/core/TokenManager.ts`

---

### 2. Discord Profile (AccountTab.tsx)

```typescript
// AVANT
discord_profile

// APRÈS
discord_profile_0x78e8...
```

**Fichier:** `components/pages/profile-tabs/AccountTab.tsx`

---

### 3. Quest Progress (useQuestSystem.ts)

```typescript
// AVANT
completed_quests
claimed_quests
claimed_discovery_xp
group_certification_xp
spent_xp
quest_progress_cache

// APRÈS
completed_quests_0x78e8...
claimed_quests_0x78e8...
claimed_discovery_xp_0x78e8...
group_certification_xp_0x78e8...
spent_xp_0x78e8...
quest_progress_cache_0x78e8...
```

**Fichier:** `hooks/useQuestSystem.ts`

---

### 4. Streaks & Pulse (QuestTrackingService.ts)

```typescript
// AVANT
signal_activity_dates
certification_activity_dates
pulse_launches
weekly_pulse_uses

// APRÈS
signal_activity_dates_0x78e8...
certification_activity_dates_0x78e8...
pulse_launches_0x78e8...
weekly_pulse_uses_0x78e8...
```

**Fichier:** `lib/services/QuestTrackingService.ts`

---

### 5. Bookmarks (IndexedDB)

```typescript
// AVANT
interface BookmarkList {
  id: string
  name: string
  // ...
}

// APRÈS
interface BookmarkList {
  walletAddress: string  // NEW - pour filtrer par wallet
  id: string
  name: string
  // ...
}
```

**Fichiers:**
- `lib/database/indexedDB.ts`
- `lib/database/indexedDB-methods.ts`
- `hooks/useBookmarks.ts`

---

## Fichiers à modifier (6 fichiers)

| # | Fichier | Changement |
|---|---------|------------|
| 1 | `background/oauth/core/TokenManager.ts` | Ajouter wallet aux clés de tokens |
| 2 | `lib/services/QuestTrackingService.ts` | Ajouter wallet aux clés de tracking |
| 3 | `hooks/useQuestSystem.ts` | Ajouter wallet aux clés de quêtes/XP |
| 4 | `components/pages/profile-tabs/AccountTab.tsx` | Lire OAuth/Discord avec wallet |
| 5 | `hooks/useSocialVerifier.ts` | Lire OAuth avec wallet |
| 6 | `lib/database/indexedDB-methods.ts` | Ajouter wallet aux bookmarks |

---

## Migration des données existantes

**Choix : Ne pas migrer**

- Les anciennes données restent orphelines (sans wallet dans la clé)
- Les données importantes (badges, social links) sont on-chain et seront auto-sync
- Plus simple et plus propre

---

## Résultat attendu

1. **Connexion Wallet A** → voit ses données A (Discord lié, quêtes complétées)
2. **Déconnexion → Connexion Wallet B** → voit ses données B (vide si nouveau)
3. **Retour à Wallet A** → retrouve ses données A intactes

---

## Test de vérification

1. `pnpm dev` pour rebuild
2. Se connecter avec Wallet A (MetaMask)
3. Lier Discord → vérifier dans DevTools que la clé est `oauth_token_discord_0x78e8...`
4. Se déconnecter
5. Se connecter avec Wallet B (Rabby, autre adresse)
6. Vérifier que Discord n'est PAS lié (nouvelle identité vierge)
7. Revenir à Wallet A → Discord est toujours lié

---

## Commit message

```
feat: implement per-wallet storage for user identity isolation

- Store OAuth tokens per wallet address
- Store Discord profile per wallet address
- Store quest progress and XP per wallet address
- Store streak/pulse tracking per wallet address
- Add walletAddress to bookmark records
- Each wallet now has isolated identity and progress
```
