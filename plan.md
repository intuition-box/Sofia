# 🎯 Plan d'Action - Système de Salons Dynamiques par Wallet

## 📋 Résumé du Problème

**Situation actuelle** :
- Tous les utilisateurs de l'extension partagent les mêmes `ROOM_ID` et `AUTHOR_ID` fixes
- Les conversations de tous les users se mélangent dans le même salon ElizaOS
- Impossible de différencier les utilisateurs

**Objectif** :
- Chaque utilisateur (identifié par son wallet) doit avoir ses propres salons uniques pour chaque agent
- Les conversations doivent être isolées et persistantes
- Format compatible avec ElizaOS (UUIDs standards)

---

## 🏗️ Architecture de la Solution

### Mapping Wallet → UUID

```
Wallet Address                    →  User UUID (AUTHOR_ID)
"0xabc123..."                    →  "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

User UUID + Agent ID (existant)   →  Room UUID (ROOM_ID)
"a1b2c3d4..." + "582f4e58..."    →  "f1e2d3c4-b5a6-9807-1234-567890abcdef"
```

### Principe Clé

✅ **Déterministe** : Même wallet = même UUID à chaque fois
✅ **Persistant** : L'utilisateur retrouve ses conversations sur n'importe quel navigateur
✅ **Compatible** : Format UUID v4 standard pour ElizaOS
✅ **Isolé** : Chaque user a ses propres salons
✅ **Utilise les AGENT_ID existants** : Les AGENT_ID dans constants.ts ne changent JAMAIS

---

## 📝 Étapes d'Implémentation

### **ÉTAPE 1 : Créer le UserSessionManager**

**Fichier** : `extension/lib/services/UserSessionManager.ts`

**Fonctionnalités** :

1. **`getUserId()`** - Génère UUID à partir du wallet (REQUIS)
   ```typescript
   Input: Wallet "0xabc123..." (depuis storage "metamask-account")
   Output: UUID "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

   Si pas de wallet → throw Error("Wallet non connecté")
   ```

2. **`createUserAgentRoomId(userId, agentId)`** - Génère room UUID
   ```typescript
   Input: userId + agentId (depuis constants.ts)
   Exemple: "a1b2c3d4-..." + "582f4e58-1285-004d-8ef6-1e6301f3d646"
   Output: UUID "f1e2d3c4-b5a6-9807-1234-567890abcdef"
   ```

3. **`getUserAgentIds(agentName, baseAgentId)`** - Retourne objet complet
   ```typescript
   Input:
     agentName: "SofIA" (pour logs seulement)
     baseAgentId: "582f4e58-..." (AGENT_ID depuis constants.ts)

   Output: {
     AUTHOR_ID: "a1b2c3d4-...",  // User UUID (depuis wallet)
     ROOM_ID: "f1e2d3c4-...",    // Room UUID (hash de User UUID + AGENT_ID)
     CHANNEL_ID: "f1e2d3c4-...", // Same as ROOM_ID
     AGENT_ID: "582f4e58-...",   // ✅ AGENT_ID existant (INCHANGÉ)
     SERVER_ID: "00000000-...",  // Global
     AGENT_NAME: "SofIA"          // Pour logs
   }
   ```

4. **`generateDeterministicUUID(input)`** - Fonction de hashing
   - Prend une string quelconque
   - Retourne toujours le même UUID pour le même input
   - Format UUID v4 valide : `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

4. **Fonctions utilitaires** :
   - `getWalletAddress()` - Récupère l'adresse du wallet (throw si absent)
   - `getUserMapping()` - Récupère le mapping wallet → UUID
   - `isWalletConnected()` - Vérifie si wallet est connecté
   - `resetUserSession()` - Reset pour testing
   - `debugUserSession()` - Affiche les infos de session

**Points importants** :
- ✅ **Wallet REQUIS** : Tous les utilisateurs doivent avoir un wallet connecté
- UUID déterministe TOUJOURS généré depuis l'adresse wallet
- Si wallet non connecté → Erreur explicite (pas de fallback)
- Stockage dans `chrome.storage.local` via `@plasmohq/storage`

---

### **ÉTAPE 2 : Modifier constants.ts**

**Fichier** : `extension/background/constants.ts`

**⚠️ IMPORTANT : Les AGENT_ID ne changent JAMAIS !**

**Changements** :

```typescript
// AVANT - IDs fixes pour tous les utilisateurs
export const SOFIA_IDS = {
  CHANNEL_ID: "8662b344-f045-4f8e-ad38-aabae151bccd",  // ❌ À supprimer
  ROOM_ID: "8662b344-f045-4f8e-ad38-aabae151bccd",    // ❌ À supprimer
  AUTHOR_ID: "6cc290c3-862d-4bba-8353-879ffe6232ab",  // ❌ À supprimer
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",   // ✅ À GARDER
  AGENT_NAME: "SofIA1"                                 // ✅ À GARDER
}

// APRÈS - Seulement les IDs des agents (INCHANGÉS)
export const SOFIA_BASE_IDS = {
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",   // ✅ MÊME ID qu'avant
  AGENT_NAME: "SofIA1"
}

// Les CHANNEL_ID, ROOM_ID, AUTHOR_ID seront générés dynamiquement
// via getUserAgentIds() en utilisant le AGENT_ID ci-dessus
```

**Faire pareil pour les 4 autres agents** :
- `CHATBOT_BASE_IDS` → Garde `AGENT_ID: "79c0c83b-2bd2-042f-a534-952c58a1024d"`
- `THEMEEXTRACTOR_BASE_IDS` → Garde `AGENT_ID: "7dad3d3a-db1a-08a2-9dda-182d98b6cf2b"`
- `PULSEAGENT_BASE_IDS` → Garde `AGENT_ID: "8afb486a-3c96-0569-b112-4a7f465862b2"`
- `RECOMMENDATION_BASE_IDS` → Garde `AGENT_ID: "92a956b2-ec82-0d31-8fc1-31c9e13836a3"`

**Garder** : Toutes les autres constantes (patterns, timeouts, etc.)

**🔒 Garantie** : Les AGENT_ID restent exactement les mêmes qu'actuellement !

---

### **ÉTAPE 3 : Modifier websocket.ts**

**Fichier** : `extension/background/websocket.ts`

**Changements pour chaque fonction d'initialisation** :

#### 3.1 - Importer le UserSessionManager

```typescript
import { getUserAgentIds } from "../lib/services/UserSessionManager"
import {
  SOFIA_BASE_IDS,
  CHATBOT_BASE_IDS,
  THEMEEXTRACTOR_BASE_IDS,
  PULSEAGENT_BASE_IDS,
  RECOMMENDATION_BASE_IDS
} from "./constants"
```

#### 3.2 - Créer un cache global pour les IDs

```typescript
// Cache des IDs utilisateur (généré une fois au démarrage)
let userAgentIds: {
  sofia: any
  chatbot: any
  themeExtractor: any
  pulse: any
  recommendation: any
} | null = null

/**
 * Initialize user agent IDs (called once at extension startup)
 */
async function initializeUserAgentIds() {
  userAgentIds = {
    sofia: await getUserAgentIds("SofIA", SOFIA_BASE_IDS.AGENT_ID),
    chatbot: await getUserAgentIds("ChatBot", CHATBOT_BASE_IDS.AGENT_ID),
    themeExtractor: await getUserAgentIds("ThemeExtractor", THEMEEXTRACTOR_BASE_IDS.AGENT_ID),
    pulse: await getUserAgentIds("PulseAgent", PULSEAGENT_BASE_IDS.AGENT_ID),
    recommendation: await getUserAgentIds("RecommendationAgent", RECOMMENDATION_BASE_IDS.AGENT_ID)
  }

  console.log("✅ User agent IDs initialized:", userAgentIds)
}

// Export pour utilisation dans d'autres fichiers
export function getUserAgentIdsCache() {
  return userAgentIds
}
```

#### 3.3 - Modifier initializeSofiaSocket()

```typescript
export async function initializeSofiaSocket(): Promise<void> {
  // 🆕 S'assurer que les IDs sont initialisés
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  const sofiaIds = userAgentIds.sofia

  socketSofia = io(SOFIA_SERVER_URL, commonSocketConfig)

  socketSofia.on("connect", () => {
    console.log("✅ Connected to Eliza (SofIA), socket ID:", socketSofia.id)
    console.log("🔑 Using user-specific IDs:", sofiaIds)

    // 🆕 Utiliser les IDs dynamiques
    socketSofia.emit("message", {
      type: 1,
      payload: {
        roomId: sofiaIds.ROOM_ID,      // ✅ Dynamique
        entityId: sofiaIds.AUTHOR_ID   // ✅ Dynamique
      }
    })

    console.log("📨 Sent room join for SofIA:", sofiaIds.ROOM_ID)
  })

  socketSofia.on("messageBroadcast", async (data) => {
    // 🆕 Utiliser les IDs dynamiques pour filtrer
    if (
      (data.roomId === sofiaIds.ROOM_ID || data.channelId === sofiaIds.CHANNEL_ID) &&
      data.senderId === sofiaIds.AGENT_ID
    ) {
      console.log("📩 Message SofIA:", data)
      // ... reste du code inchangé
    }
  })

  socketSofia.on("disconnect", (reason) => {
    console.warn("🔌 SofIA socket disconnected:", reason)
    setTimeout(initializeSofiaSocket, 5000)
  })
}
```

#### 3.4 - Répéter pour les 4 autres agents

Faire les mêmes modifications pour :
- `initializeChatbotSocket()` → utilise `userAgentIds.chatbot`
- `initializeThemeExtractorSocket()` → utilise `userAgentIds.themeExtractor`
- `initializePulseSocket()` → utilise `userAgentIds.pulse`
- `initializeRecommendationSocket()` → utilise `userAgentIds.recommendation`

#### 3.5 - Exporter la fonction d'initialisation

```typescript
// À la fin du fichier
export { initializeUserAgentIds }
```

---

### **ÉTAPE 4 : Modifier messageSenders.ts**

**Fichier** : `extension/background/messageSenders.ts`

**Changements** :

#### 4.1 - Importer le cache

```typescript
import { getUserAgentIdsCache } from "./websocket"
import { SOFIA_BASE_IDS, CHATBOT_BASE_IDS, /* ... */ } from "./constants"
```

#### 4.2 - Modifier sendMessageToSofia()

```typescript
export function sendMessageToSofia(socketSofia: any, text: string): void {
  if (!socketSofia?.connected) {
    console.warn("⚠️ SofIA socket not connected")
    return
  }

  // 🆕 Récupérer les IDs depuis le cache
  const agentIds = getUserAgentIdsCache()
  if (!agentIds?.sofia) {
    console.error("❌ User agent IDs not initialized")
    return
  }

  const sofiaIds = agentIds.sofia

  const payload = {
    type: 2,
    payload: {
      senderId: sofiaIds.AUTHOR_ID,        // ✅ Dynamique
      senderName: "Extension User",
      message: text,
      messageId: generateUUID(),
      roomId: sofiaIds.ROOM_ID,            // ✅ Dynamique
      channelId: sofiaIds.CHANNEL_ID,      // ✅ Dynamique
      serverId: sofiaIds.SERVER_ID,
      source: "extension",
      attachments: [],
      metadata: {
        channelType: "DM",
        isDm: true,
        targetUserId: sofiaIds.AGENT_ID
      }
    }
  }

  console.log("📤 Message to SofIA:", payload)
  socketSofia.emit("message", payload)
}
```

#### 4.3 - Modifier sendMessageToChatbot()

Même logique avec `agentIds.chatbot`

#### 4.4 - Modifier sendToThemeExtractor()

Vérifier si cette fonction utilise aussi les IDs et les rendre dynamiques

---

### **ÉTAPE 5 : Point d'initialisation**

**Fichier** : `extension/background/index.ts`

**Assurer l'ordre correct** :

```typescript
import { initializeUserAgentIds } from "./websocket"

// Au démarrage de l'extension
async function initializeExtension() {
  console.log("🚀 Initializing Sofia Extension...")

  // 1️⃣ IMPORTANT : Initialiser les IDs en premier
  await initializeUserAgentIds()

  // 2️⃣ Ensuite initialiser les websockets
  await initializeSofiaSocket()
  await initializeChatbotSocket()
  // ... autres sockets

  console.log("✅ Extension initialized")
}

// Appeler au démarrage
initializeExtension()
```

---

## 🧪 Plan de Test

### Test 1 : Génération d'UUID depuis wallet

```typescript
// Dans la console de l'extension
import { debugUserSession } from "./lib/services/UserSessionManager"

await debugUserSession()
// Devrait afficher :
// - Wallet Address: "0xabc123..."
// - User ID (UUID): "a1b2c3d4-e5f6-..."
// - Stored Mapping: {...}
```

### Test 2 : Isolation des salons (1 utilisateur)

1. Connecter un wallet dans l'extension
2. Ouvrir les DevTools → Console
3. Vérifier les logs :
   ```
   ✅ User agent IDs initialized
   🔑 Using user-specific IDs: {AUTHOR_ID: "...", ROOM_ID: "..."}
   📨 Sent room join for SofIA: room-abc-sofia
   ```
4. Envoyer un message
5. Vérifier côté serveur ElizaOS :
   ```bash
   docker logs -f sofia-container
   # Devrait voir : "Creating new connection for room: room-abc-sofia"
   ```

### Test 3 : Isolation entre 2 utilisateurs

1. **Browser 1** (Alice) :
   - Connecter wallet A
   - Noter le `ROOM_ID` dans les logs
   - Envoyer message "Hello from Alice"

2. **Browser 2** (Bob) :
   - Connecter wallet B
   - Noter le `ROOM_ID` dans les logs (doit être différent)
   - Envoyer message "Hello from Bob"

3. **Vérification** :
   - Alice ne doit PAS voir le message de Bob
   - Bob ne doit PAS voir le message d'Alice
   - Logs serveur doivent montrer 2 salons différents

### Test 4 : Persistance

1. User A envoie des messages
2. Fermer le navigateur
3. Rouvrir et reconnecter le même wallet
4. Vérifier que le même `ROOM_ID` est utilisé
5. L'historique devrait être préservé dans IndexedDB

### Test 5 : Gestion erreur sans wallet

1. Désactiver MetaMask (déconnecter le wallet)
2. Recharger l'extension
3. Vérifier qu'une erreur claire est affichée : "Wallet non connecté"
4. Les websockets ne devraient PAS s'initialiser
5. L'UI devrait demander à l'utilisateur de connecter son wallet

---

## ⚠️ Points d'Attention

### 1. Timing de connexion wallet

**Contrainte** : Le wallet DOIT être connecté avant d'initialiser les websockets

**Solution** : Initialisation conditionnelle avec attente

```typescript
// Dans background/index.ts
async function initializeExtension() {
  console.log("🚀 Initializing Sofia Extension...")

  // 1️⃣ Vérifier que le wallet est connecté
  const walletAddress = await storage.get("metamask-account")
  if (!walletAddress) {
    console.error("❌ Wallet non connecté - Impossible d'initialiser")
    // Afficher message à l'utilisateur dans l'UI
    return
  }

  // 2️⃣ Initialiser les IDs utilisateur
  await initializeUserAgentIds()

  // 3️⃣ Initialiser les websockets
  await initializeSofiaSocket()
  await initializeChatbotSocket()
  // ...

  console.log("✅ Extension initialized")
}

// Écouter les changements de wallet
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['metamask-account']) {
    console.log("🔄 Wallet changed, reinitializing connections...")
    reinitializeAllSockets()
  }
})
```

### 2. Format UUID ElizaOS

ElizaOS utilise `createUniqueUuid()` de `@elizaos/core` qui génère des UUIDs v5.

Notre fonction `generateDeterministicUUID()` doit produire un format compatible :
- Format : `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Le `4` indique UUID v4 (ElizaOS accepte v4 et v5)

### 3. Gestion des erreurs

Ajouter des try-catch dans toutes les fonctions async :

```typescript
export async function getUserId(): Promise<string> {
  try {
    const walletAddress = await storage.get("metamask-account")

    if (!walletAddress) {
      throw new Error("Wallet non connecté - Connexion requise pour utiliser SofIA")
    }

    // Génère UUID depuis wallet
    const userId = getUUIDFromWallet(walletAddress)
    return userId

  } catch (error) {
    console.error("❌ Error getting user ID:", error)
    // Pas de fallback - on propage l'erreur
    throw error
  }
}
```

**Important** : Ne PAS masquer les erreurs - l'UI doit savoir que le wallet n'est pas connecté

### 4. Logs de debug

Ajouter des logs détaillés pendant le développement :

```typescript
console.log("🔑 Wallet:", walletAddress)
console.log("🆔 User UUID:", userId)
console.log("🏠 Room ID:", roomId)
console.log("📨 Sending message to room:", roomId)
```

Retirer ou mettre en mode debug en production.

### 5. Migration des utilisateurs existants

Les utilisateurs actuels ont peut-être déjà des données dans IndexedDB avec les anciens IDs fixes.

**Option 1** : Reset complet (perte de données)
**Option 2** : Migration script (complexe)
**Option 3** : Garder l'ancien système en parallèle temporairement

**Recommandation** : Pour ce stade de développement, Option 1 (reset).

---

## 📂 Récapitulatif des Fichiers

### Fichiers à CRÉER

1. ✅ `extension/lib/services/UserSessionManager.ts` - Nouveau système de gestion d'identité

### Fichiers à MODIFIER

2. ✅ `extension/background/constants.ts` - Garder seulement les IDs agents (base)
3. ✅ `extension/background/websocket.ts` - Utiliser IDs dynamiques
4. ✅ `extension/background/messageSenders.ts` - Utiliser IDs dynamiques
5. ✅ `extension/background/index.ts` - Ordre d'initialisation correct

### Fichiers à VÉRIFIER

6. ⚠️ `extension/background/messageHandlers.ts` - Vérifier s'il utilise les constants
7. ⚠️ `extension/background/tripletProcessor.ts` - Vérifier s'il utilise les constants
8. ⚠️ Tous les fichiers dans `extension/components/` qui pourraient référencer les IDs

---

## 🚀 Ordre d'Exécution

### Phase 1 : Préparation (30 min)
1. Créer `UserSessionManager.ts`
2. Tester les fonctions de génération UUID
3. Vérifier que le mapping wallet → UUID fonctionne

### Phase 2 : Modification des constants (15 min)
1. Renommer `SOFIA_IDS` → `SOFIA_BASE_IDS`
2. Garder seulement `AGENT_ID` et `AGENT_NAME`
3. Répéter pour les 4 autres agents

### Phase 3 : WebSockets (45 min)
1. Modifier `initializeSofiaSocket()` avec IDs dynamiques
2. Tester avec 1 agent uniquement
3. Si ça marche, répéter pour les 4 autres

### Phase 4 : Message Senders (30 min)
1. Modifier `sendMessageToSofia()`
2. Modifier `sendMessageToChatbot()`
3. Vérifier les autres fonctions d'envoi

### Phase 5 : Tests (1h)
1. Test 1 utilisateur
2. Test 2 utilisateurs (2 browsers)
3. Test persistance
4. Test fallback sans wallet

### Phase 6 : Debug et Ajustements (variable)
1. Corriger les bugs trouvés
2. Améliorer les logs
3. Optimiser les performances

---

## 🎯 Critères de Succès

✅ Chaque wallet génère un UUID unique et persistant
✅ Chaque user a des ROOM_IDs différents pour chaque agent
✅ Les messages sont isolés entre utilisateurs
✅ L'historique persiste après reconnexion
✅ Erreur claire si wallet non connecté (pas de fallback)
✅ Les logs ElizaOS montrent la création de salons uniques
✅ Aucune régression sur les fonctionnalités existantes

---

## 📊 Exemple de Flow Complet

### Scénario avec 2 utilisateurs

**User A (Alice)** - Wallet: `0xAAA123...`
```
1. Génère User UUID depuis wallet:
   AUTHOR_ID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

2. Récupère AGENT_ID depuis constants.ts (INCHANGÉ):
   SofIA AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646"
   ChatBot AGENT_ID: "79c0c83b-2bd2-042f-a534-952c58a1024d"

3. Génère ROOM_ID pour chaque agent:
   → SofIA:    hash("a1b2c3d4..." + "582f4e58...") = "f1e2d3c4-b5a6-9807-..."
   → ChatBot:  hash("a1b2c3d4..." + "79c0c83b...") = "a9b8c7d6-e5f4-3210-..."
```

**User B (Bob)** - Wallet: `0xBBB456...`
```
1. Génère User UUID depuis wallet:
   AUTHOR_ID: "b9e8d7c6-f5a4-3210-fedc-ba9876543210"

2. Récupère AGENT_ID depuis constants.ts (MÊME que Alice):
   SofIA AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646"
   ChatBot AGENT_ID: "79c0c83b-2bd2-042f-a534-952c58a1024d"

3. Génère ROOM_ID pour chaque agent:
   → SofIA:    hash("b9e8d7c6..." + "582f4e58...") = "c5d4e3f2-a1b0-9876-..."
   → ChatBot:  hash("b9e8d7c6..." + "79c0c83b...") = "d3e2f1a0-b9c8-7654-..."
```

**Côté serveur ElizaOS** :
```
Salons actifs:
- f1e2d3c4-... → Alice (a1b2c3d4) + Agent SofIA (582f4e58) ✅
- a9b8c7d6-... → Alice (a1b2c3d4) + Agent ChatBot (79c0c83b) ✅
- c5d4e3f2-... → Bob (b9e8d7c6) + Agent SofIA (582f4e58) ✅
- d3e2f1a0-... → Bob (b9e8d7c6) + Agent ChatBot (79c0c83b) ✅
```

**🔒 Les AGENT_ID restent inchangés** :
- Agent SofIA : `582f4e58-1285-004d-8ef6-1e6301f3d646` (depuis constants.ts)
- Agent ChatBot : `79c0c83b-2bd2-042f-a534-952c58a1024d` (depuis constants.ts)

**Code dans websocket.ts** :
```typescript
// Dans websocket.ts
import { SOFIA_BASE_IDS } from "./constants"  // ✅ AGENT_ID existant

// Génère les IDs dynamiques EN UTILISANT l'AGENT_ID existant
const sofiaIds = await getUserAgentIds("SofIA", SOFIA_BASE_IDS.AGENT_ID)

// Résultat pour Alice:
{
  AUTHOR_ID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // ✅ Depuis wallet Alice
  ROOM_ID: "f1e2d3c4-b5a6-9807-1234-567890abcdef",    // ✅ Hash(Alice UUID + Agent ID)
  CHANNEL_ID: "f1e2d3c4-b5a6-9807-1234-567890abcdef", // ✅ = ROOM_ID
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",   // ✅ INCHANGÉ (constants.ts)
  SERVER_ID: "00000000-0000-0000-0000-000000000000",  // ✅ Fixe
  AGENT_NAME: "SofIA"                                  // ✅ Pour logs
}

// Résultat pour Bob (DIFFÉRENT):
{
  AUTHOR_ID: "b9e8d7c6-f5a4-3210-fedc-ba9876543210",  // ✅ Depuis wallet Bob
  ROOM_ID: "c5d4e3f2-a1b0-9876-5432-109876543210",    // ✅ Hash(Bob UUID + Agent ID)
  CHANNEL_ID: "c5d4e3f2-a1b0-9876-5432-109876543210", // ✅ = ROOM_ID
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",   // ✅ MÊME Agent ID
  SERVER_ID: "00000000-0000-0000-0000-000000000000",  // ✅ Fixe
  AGENT_NAME: "SofIA"                                  // ✅ Pour logs
}
```

✅ **Les conversations sont isolées !**
✅ **Les agents gardent leurs IDs originaux !**
✅ **Chaque user a des salons uniques pour chaque agent !**

---

## 📚 Références

- Plugin Discord ElizaOS : https://github.com/elizaos-plugins/plugin-discord/blob/1.x/src/messages.ts
- Documentation ElizaOS ensureConnection : voir `runtime.ensureConnection()`
- Format UUID v4 : https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random)

---

## 🔄 Prochaines Étapes (Après implémentation)

1. **Système de reset pour testing** : Ajouter un bouton UI pour reset la session
2. **Migration des données** : Script pour migrer l'ancien système vers le nouveau
3. **Analytics** : Tracker le nombre de salons uniques créés
4. **Optimisation** : Cache en mémoire pour éviter les lectures storage répétées
5. **Documentation** : Mettre à jour CLAUDE.md avec le nouveau système

---

**Date de création** : 2025-10-27
**Branche** : `chanelEliza`
**Status** : 📝 PLAN - Prêt pour implémentation
