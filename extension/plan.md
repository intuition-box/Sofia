# Plan: Per-Wallet Storage + OAuth Predicates

## Statut Global

| Tâche | Fichier | Statut |
|-------|---------|--------|
| TokenManager per-wallet | `background/oauth/core/TokenManager.ts` | ✅ Done |
| SyncManager per-wallet | `background/oauth/core/SyncManager.ts` | ✅ Done |
| PlatformDataFetcher per-wallet | `background/oauth/core/PlatformDataFetcher.ts` | ✅ Done |
| QuestTrackingService per-wallet | `lib/services/QuestTrackingService.ts` | ✅ Done |
| useQuestSystem per-wallet | `hooks/useQuestSystem.ts` | ✅ Done |
| AccountTab per-wallet | `components/pages/profile-tabs/AccountTab.tsx` | ✅ Done |
| useSocialVerifier per-wallet | `hooks/useSocialVerifier.ts` | ✅ Done |
| WalletBridge provider selection | `contents/walletBridge.ts` | ✅ Done |
| useIntentionGroups fix useMemo | `hooks/useIntentionGroups.ts` | ✅ Done |
| **OAuth predicates → level** | `hooks/useOnChainIntentionGroups.ts` | ✅ Done |
| **Clear IntentionGroups on wallet change** | `background/index.ts` | ✅ Done |

---

## Tâches Complétées ✅

### 1. TokenManager.ts
- `getWalletAddress()` helper avec checksummed address
- Clés: `oauth_token_${platform}_${walletAddress}`

### 2. SyncManager.ts
- `getWalletAddress()` helper
- Clés: `sync_info_${platform}_${walletAddress}`

### 3. PlatformDataFetcher.ts
- Discord profile: `discord_profile_${checksumAddr}`

### 4. QuestTrackingService.ts
- `signal_activity_dates_${wallet}`
- `certification_activity_dates_${wallet}`
- `pulse_launches_${wallet}`
- `weekly_pulse_uses_${wallet}`
- `weekly_pulse_start_${wallet}`

### 5. useQuestSystem.ts
- `completed_quests_${checksumAddress}`
- `claimed_quests_${checksumAddress}`
- `claimed_discovery_xp_${checksumAddress}`
- `group_certification_xp_${checksumAddress}`
- `spent_xp_${checksumAddress}`
- `quest_progress_cache_${checksumAddress}`
- Reset `onChainSyncDone` quand wallet change

### 6. AccountTab.tsx
- Lecture OAuth tokens avec clé wallet
- Lecture Discord profile avec clé wallet

### 7. useSocialVerifier.ts
- Lecture OAuth tokens avec clé wallet

### 8. WalletBridge (walletBridge.ts)
- `normalizeWalletType()` : "rabby_wallet" → "rabby"
- `selectProviderByName()` amélioré
- `clearProviderSelection()` au disconnect

### 9. useIntentionGroups.ts
- `chrome.runtime.sendMessage` déplacé de `useMemo` → `useEffect`
- Debug logging pour tracer le merge local/on-chain

---

### 10. OAuth predicates → level (useOnChainIntentionGroups.ts)

**IDs ajoutés à `chainConfig.prod.ts`:**
```typescript
MEMBER_OF: "0x928694ed3c5b9f2e119618524ab777177a74e657f09fc488fca98d2790242fd0"
OWNER_OF: "0x1c83db8148bee049fb7ba383924762f4d0cc2d686e8bdd57dd9fabde05b8bb4a"
TOP_ARTIST: "0x97c6389ca484e835e8c1d9221ad5ae2a6fdd927c5cfa255bae6a2467b8753ece"
TOP_TRACK: "0x504301d33841aaebbdc1300d1e4ca8db3eb8763078a4d38addb7176e653aac5e"
```

**NAMES ajoutés:** `MEMBER_OF`, `OWNER_OF`, `TOP_ARTIST`, `TOP_TRACK`, `CREATED_PLAYLIST`

**Fichiers mis à jour:**
- `useOnChainIntentionGroups.ts` - Query avec `ALL_PREDICATE_IDS`
- `PlatformRegistry.ts` - Utilise `PREDICATE_NAMES.*`
- `useUserCertifications.ts` - Utilise `PREDICATE_NAMES.*`

**Note:** `CREATED_PLAYLIST` n'a pas d'ID on-chain (créé dynamiquement)

---

## Vérification

1. `pnpm dev` pour rebuild
2. Wallet A: Lier Discord → vérifier stockage per-wallet
3. Wallet B: Vérifier que Discord n'est pas lié
4. **Spotify avec 4 OAuth certs → Level 2** (pas Level 1)
5. Retour Wallet A → Discord toujours lié
