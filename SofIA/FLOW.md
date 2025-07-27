# Flow de Données - Système SofIA

## 📊 Vue d'ensemble du flux complet

Ce document décrit le parcours des données dans l'écosystème SofIA, de la navigation utilisateur jusqu'à la blockchain et le stockage IPFS.

---

## 🔄 Flow Complet - Étapes du Processus

### 1. **Background Service** 
📍 `SofIA/extension/background/index.ts`

- **Rôle** : Point d'entrée du service worker
- **Actions** :
  - Initialise les connexions WebSocket (SofIA + Chatbot)
  - Configure les handlers de messages
  - Gère l'ouverture du sidepanel

### 2. **WebSocket Connection**
📍 `SofIA/extension/background/websocket.ts`

- **Connexions multiples** :
  - `socketSofia` → `http://localhost:3000` (Agent SofIA)
  - `socketBot` → `http://localhost:3000` (Chatbot)
- **Communication bidirectionnelle** :
  - **→ Envoi** : Données de navigation via `sendMessageToSofia()`
  - **← Réception** : JSON parsé avec triplets sémantiques
- **Storage** : Messages stockés via `@plasmohq/storage`

### 3. **Agent SofIA** 
📍 `SofIA/agent/SofIA.json`

- **Traitement IA** :
  - Analyse les données de navigation reçues
  - Génère des triplets sémantiques (sujet, prédicat, objet)
  - Produit du JSON strictement valide
- **Format de sortie** :
```json
{
  "atoms": [{"name": "...", "description": "..."}],
  "triplets": [{"subject": "...", "predicate": "...", "object": "..."}]
}
```

### 4. **Socket Response → App**
📍 `SofIA/extension/background/websocket.ts:46-63`

- **Réception** : Agent répond via `messageBroadcast`
- **Stockage** : Messages sauvés dans le storage extension
- **Propagation** : Données disponibles pour l'interface utilisateur

### 5. **Extension App Interface**
📍 `SofIA/extension/components/ui/AtomCreationModal.tsx`

- **Affichage** : Triplets parsés dans l'interface
- **Interaction** : Utilisateur peut créer des atoms
- **Validation** : Vérification des données avant blockchain

### 6. **IPFS Pinning**
📍 `SofIA/extension/hooks/useCreateAtom.ts:29-42`

- **Service** : `@0xintuition/graphql` - `usePinThingMutation`
- **Données épinglées** :
  - `name` : Nom de l'atom
  - `description` : Description générée
  - `url` : URL de la page visitée
  - `image` : Image associée (optionnel)
- **Résultat** : URI IPFS généré

### 7. **Smart Contract Interaction**
📍 `SofIA/extension/hooks/useCreateAtom.ts:44-51`

- **SDK** : `@0xintuition/protocol` - Multivault SDK
- **Réseau** : Base Sepolia (testnet - Chain ID: 84532)
- **Contrat** : `0x1A6950807E33d5bC9975067e6D6b5Ea4cD661665`
- **Transaction** :
  - Calcul du coût via `getAtomCost()`
  - Création atom via `createAtom({ uri, initialDeposit })`
  - Attente de confirmation avec `wait: true`

### 8. **Blockchain Finalization**
📍 `SofIA/extension/lib/config.ts`

- **Réseau** : Base Sepolia (84532)
- **Résultat** :
  - `vaultId` : ID unique de l'atom sur la blockchain
  - `txHash` : Hash de transaction pour traçabilité
- **Stockage** : Données atom liées au vault ID sur la chain

---

## 🌊 Schéma de Flow Visuel

```
[Navigation] → [Background Service] → [WebSocket] → [Agent SofIA]
                                                         ↓
[Interface App] ← [Storage Extension] ← [Socket Response] ←
         ↓
[Atom Creation Modal] → [IPFS Pinning] → [Smart Contract] → [Blockchain]
                            ↓               ↓                   ↓
                       [URI Stocké]    [Transaction]      [VaultID Final]
```

---

## 🎯 Points Clés du Système

### **Données Transitant**
- **Input** : URL + métadonnées de navigation
- **Traitement** : Triplets sémantiques + métadonnées atom
- **Output** : VaultID blockchain + URI IPFS

### **Technologies Utilisées**
- **Communication** : Socket.IO (WebSocket)
- **Storage** : Plasmohq Storage + IPFS
- **Blockchain** : Viem + Multivault SDK
- **Réseau** : Base Sepolia (testnet)

### **Sécurité & Validation**
- JSON strictement validé côté agent
- Données encodées en bytes hexadécimales
- Transactions avec gas limit et valeur ETH
- Confirmation blockchain obligatoire

---

**Date** : 2025-07-27  
**Statut** : ✅ Système opérationnel et fonctionnel