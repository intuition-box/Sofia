# TODO: Cache Optimization pour éviter le reprocessing au redémarrage navigateur

## 🎯 PROBLÈME ACTUEL
Quand on redémarre le navigateur et qu'on va sur ResonancePage :
- ✅ Recommendations viennent du cache IndexedDB (pas de LLM call)
- ✅ og:images viennent du cache IndexedDB (pas de fetch réseau)  
- ❌ MAIS le processing est refait (transformation + lecture cache) car GlobalResonanceService perd son état mémoire

## 💡 SOLUTION RECOMMANDÉE : Option 1 - Cache IndexedDB du résultat final

### Concept
Sauvegarder les `validItems` finaux dans IndexedDB au lieu de juste en mémoire.

### Implémentation

#### 1. Créer StorageValidItems.ts
```typescript
// Similaire à StorageOgImage.ts
export interface ValidItemsCache {
  hash: string
  validItems: BentoItemWithImage[]
  timestamp: number
}

export class StorageValidItems {
  private static readonly DB_NAME = 'sofia-extension'
  private static readonly STORE_NAME = 'valid-items'
  private static readonly VERSION = 1

  static async save(hash: string, validItems: BentoItemWithImage[]): Promise<void>
  static async load(hash: string): Promise<BentoItemWithImage[] | null>
  static async isValid(hash: string, expiryHours: number): Promise<boolean>
  static async clear(hash: string): Promise<void>
}
```

#### 2. Modifier GlobalResonanceService.ts
```typescript
// Dans updateRecommendations()
async updateRecommendations(recommendations: Recommendation[]) {
  const quickHash = this.generateHash(recommendations)
  
  // D'ABORD checker IndexedDB cache complet
  const cachedValidItems = await StorageValidItems.load(quickHash)
  const isValid = await StorageValidItems.isValid(quickHash, 24 * 7) // 7 jours
  
  if (isValid && cachedValidItems) {
    console.log('🎯 [GlobalResonanceService] IndexedDB cache hit - instant display')
    this.setState({ 
      validItems: cachedValidItems, 
      lastProcessedHash: quickHash 
    })
    return
  }
  
  // Processing normal si pas de cache...
  const validItems = await this.processRecommendations(recommendations)
  
  // Sauvegarder le résultat final
  await StorageValidItems.save(quickHash, validItems)
}

private async processRecommendations(...) {
  // Logique actuelle inchangée
}
```

#### 3. Mettre à jour le Clear Storage
```typescript
// Dans SettingsPage.tsx handleClearStorage()
await StorageValidItems.clearAll() // Nettoyer le nouveau cache
```

## 🎁 RÉSULTAT ATTENDU

**Après redémarrage navigateur + navigation ResonancePage :**
- ✅ Recommendations depuis cache IndexedDB (0ms)
- ✅ ValidItems complets depuis cache IndexedDB (0ms)  
- ✅ **AFFICHAGE INSTANTANÉ** - pas de reprocessing !

**Performance :**
- Premier chargement : Normal (LLM + fetch + processing + cache)
- Navigation : Instantané (mémoire)
- Redémarrage navigateur : Instantané (IndexedDB)

## 📁 FICHIERS À MODIFIER

1. **Créer** : `/extension/lib/database/StorageValidItems.ts`
2. **Modifier** : `/extension/lib/services/GlobalResonanceService.ts`
3. **Modifier** : `/extension/components/pages/SettingsPage.tsx` (clear storage)

## ⏱️ ESTIMATION
- **Temps** : 30-45 minutes
- **Difficulté** : Facile (copier-coller de StorageOgImage.ts et modifier)
- **Risque** : Minimal (garde l'architecture existante)

---
*Note: Cette optimisation rendra l'affichage instantané même après redémarrage du navigateur, comme si l'utilisateur n'avait jamais fermé l'extension.*