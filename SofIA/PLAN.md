# Plan d'Implémentation - Système de Détection et Transfert d'Atoms

## 🔍 **Analyse Actuelle**

### **Système existant** :
- `EchoesTab` : Affiche triplets depuis l'agent SofIA (pre-blockchain)
- `SignalsTab` : Vide, destiné aux triplets on-chain
- `useCreateAtom` : Crée atoms via SDK Multivault + IPFS pinning

### **Fonctions disponibles** dans le contract :
- `atomsByHash(atomHash)` → `atomId` (ligne 72-76)
- `atoms(atomId)` → `atomData` (ligne 65-68)

---

## 📋 **Plan Proposé**

### **Phase 1 : Détection d'Atoms Existants**
- Pin to IPFS → Obtenir l'URI IPFS
- Utiliser SDK Multivault pour vérifier `atomsByHash(keccak256(uri))`
- Si `atomId > 0` → Atom existe, retourner `vaultId`
- Si `atomId = 0` → Créer nouvel atom

### **Phase 2 : Gestion des Triplets On-Chain**
- Nouveau storage : `onChainTriplets` séparé de `sofiaMessages`
- Structure : `{triplet, atomVaultId, txHash, timestamp, source: 'created'|'existing'}`

### **Phase 3 : SignalsTab Implementation**
- Interface similaire à `EchoesTab` mais pour triplets on-chain
- Indicateur visuel : Différencier atoms "créés" vs "existants"
- Actions : Voir sur explorateur blockchain, gestion des triplets

### **Phase 4 : Workflow Unifié**
- Modifier `AtomCreationModal` pour détecter atoms existants
- Auto-transfert vers `SignalsTab` après création/détection
- Notification : "Atom existant trouvé" vs "Nouvel atom créé"

---

## 🎨 **Différenciation Visuelle Proposée**

### **Atom créé** : 
- Badge vert "NEW" + icône blockchain
- Border verte sur la carte triplet

### **Atom existant** : 
- Badge bleu "FOUND" + icône lien
- Border bleue sur la carte triplet

### **Layout SignalsTab** :
- Couleurs distinctes dans les cardes de triplets
- Metadata supplémentaire : VaultID, Transaction Hash
- Actions : Explorer blockchain, partager triplet

---

## 🔧 **Implementation Details**

### **Storage Structure** :
```typescript
interface OnChainTriplet {
  triplet: {
    subject: string
    predicate: string
    object: string
  }
  atomVaultId: string
  txHash: string
  timestamp: number
  source: 'created' | 'existing'
  url: string
  ipfsUri?: string
}
```

### **New Hooks** :
- `useCheckExistingAtom()` - Pin IPFS puis vérifier atomsByHash via SDK
- `useOnChainTriplets()` - Gestion du storage on-chain
- `useTransferToSignals(triplet, atomData)` - Transfert vers SignalsTab

### **Workflow Simplifié** :
```
1. Pin to IPFS → URI IPFS
2. SDK.atomsByHash(keccak256(uri)) → Check si existe
3. Si existe → Récupérer vaultId + transférer triplet vers Signals
4. Si n'existe pas → Créer atom + transférer triplet vers Signals
```

---

**Date** : 2025-07-27  
**Statut** : 📋 Plan en attente d'implémentation