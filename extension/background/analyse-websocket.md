# Analyse du fichier websocket.ts

**Date**: 13 Novembre 2025
**Fichier**: `/Users/maximesaint-joannis/VScode/SOFIA/Sofia/extension/background/websocket.ts`

---

## 📋 Résumé des Fonctions

### **Fonctions Utilitaires (lignes 14-95)**

#### 1. `extractMessageText(data)` (ligne 18)
- ✅ **Statut**: OK
- **Rôle**: Extrait le texte d'un message avec fallback sur plusieurs formats
- **Gère**: `data.text`, `data.content.text`, `data.payload.content.text`, `data.message`, `data.payload.message`
- **Usage**: Utilisée par tous les handlers de messages pour extraire le contenu

#### 2. `isMessageFromAgent(data, agentIds)` (ligne 33)
- ✅ **Statut**: OK
- **Rôle**: Vérifie si un message provient de l'agent attendu
- **Logique**: Check `(channelId === CHANNEL_ID || roomId === CHANNEL_ID) && senderId === AGENT_ID`
- **Note**: Gère les deux formats (channelId/roomId) car ElizaOS peut envoyer l'un ou l'autre

#### 3. `handleAgentMessage(data, agentIds, agentName, customHandler?)` (ligne 43)
- ✅ **Statut**: OK - Fonction unifiée centrale
- **Rôle**: Traite les messages reçus des agents de manière cohérente
- **Logique**:
  - Vérifie si le message vient de l'agent via `isMessageFromAgent()`
  - Extrait le texte via `extractMessageText()`
  - Si `customHandler` fourni → l'exécute avec le texte
  - Sinon → stockage par défaut dans IndexedDB
  - Nettoie les anciens messages (garde 50 derniers)
- **Usage**: Utilisée par les 5 agents

---

### **Fonction de Setup Channel (lignes 101-205)**

#### 4. `setupAgentChannel(socket, agentIds, agentName, onReady?)` (ligne 101)
- ✅ **Statut**: OK - Fonction unifiée centrale
- **Rôle**: Crée ou récupère un channel DM pour un agent
- **Flux**:
  1. Vérifie IndexedDB pour channel existant
  2. **Si existe**:
     - Réutilise le channel
     - Envoie ROOM_JOINING pour recevoir les broadcasts
     - Appelle `onReady` callback
  3. **Si n'existe pas**:
     - Crée channel via REST API (`POST /api/messaging/central-channels`)
     - Type: `2` (numérique pour ChannelType.DM)
     - Ajoute agent au channel (`POST .../agents`)
     - Envoie ROOM_JOINING
     - Stocke dans IndexedDB
     - Appelle `onReady` callback
- ⚠️ **REDONDANCE DÉTECTÉE**: Assigne à la fois `ROOM_ID` et `CHANNEL_ID` (lignes 113-114, 156-157)
- **Usage**: Appelée par les 5 fonctions `initialize*Socket()`

---

### **Variables Globales (lignes 207-258)**

#### 5. Variables Socket
```typescript
let socketSofia: Socket
let socketBot: Socket
let socketThemeExtractor: Socket
let socketPulse: Socket
let socketRecommendation: Socket
```
- ✅ **Statut**: OK
- **Rôle**: Instances Socket.IO pour chaque agent

#### 6. `userAgentIds` (ligne 214)
```typescript
let userAgentIds: {
  sofia: AgentIds
  chatbot: AgentIds
  themeExtractor: AgentIds
  pulse: AgentIds
  recommendation: AgentIds
} | null = null
```
- ✅ **Statut**: OK
- **Rôle**: Cache des IDs pour les 5 agents (AUTHOR_ID, CHANNEL_ID, AGENT_ID, etc.)
- **Initialisation**: Via `initializeUserAgentIds()`

#### 7. `elizaRoomIds` (ligne 222)
```typescript
let elizaRoomIds: {
  sofia?: string
  chatbot?: string
  themeExtractor?: string
  pulse?: string
  recommendation?: string
} = {}
```
- ❌ **Statut**: INUTILISÉ
- **Problème**: Déclarée mais jamais remplie ni utilisée dans le code
- **Recommandation**: Supprimer

---

### **Fonctions d'Initialisation des IDs (lignes 234-265)**

#### 8. `initializeUserAgentIds()` (ligne 234)
- ✅ **Statut**: OK
- **Rôle**: Initialise les IDs pour les 5 agents basés sur le wallet de l'utilisateur
- **Appelée**: Une fois au démarrage ou à la première utilisation
- **Génère**: AUTHOR_ID depuis le wallet + combine avec AGENT_ID constants

#### 9. `getUserAgentIdsCache()` (ligne 249)
- ✅ **Statut**: OK
- **Rôle**: Retourne le cache des IDs
- **Usage**: Utilisé par les anciens message senders

#### 10. `getElizaRoomIds()` (ligne 256)
- ❌ **Statut**: INUTILISÉ
- **Problème**: Retourne `elizaRoomIds` qui n'est jamais rempli
- **Recommandation**: Supprimer

#### 11. Getters Socket (lignes 261-277)
```typescript
getSofiaSocket()
getChatbotSocket()
getThemeExtractorSocket()
getPulseSocket()
getRecommendationSocket()
```
- ✅ **Statut**: OK
- **Rôle**: Accesseurs directs aux instances Socket.IO
- **Usage**: Pour envoyer des messages depuis d'autres parties du code

---

### **Fonctions d'Initialisation des Sockets (lignes 280-522)**

#### 12. `initializeSofiaSocket()` (ligne 280)
- ✅ **Statut**: OK
- **Pattern**:
  - Prévention de duplication
  - Création socket avec `commonSocketConfig`
  - Handler `connect` → `setupAgentChannel()`
  - Handler `messageBroadcast` → `handleAgentMessage()` (stockage IndexedDB par défaut)
  - Handler `disconnect`

#### 13. `initializeChatbotSocket(onReady?)` (ligne 320)
- ✅ **Statut**: OK
- **Spécificité**:
  - Callback `onReady` pour signaler au UI que le chatbot est prêt
  - Handler personnalisé: envoie `CHATBOT_RESPONSE` via `chrome.runtime.sendMessage`

#### 14. `initializeThemeExtractorSocket()` (ligne 398)
- ✅ **Statut**: OK
- **Spécificité**: Handler personnalisé parse JSON et appelle `handleThemeExtractorResponse()`

#### 15. `initializePulseSocket()` (ligne 456)
- ✅ **Statut**: OK
- **Spécificité**:
  - Stocke analyse dans IndexedDB avec `type: 'pulse_analysis'`
  - Envoie notification `PULSE_ANALYSIS_COMPLETE` au UI

#### 16. `initializeRecommendationSocket()` (ligne 545)
- ✅ **Statut**: OK
- **Spécificité**: Handler personnalisé parse JSON et appelle `handleRecommendationResponse()`

**Observation**: Toutes les fonctions d'initialisation suivent le même pattern cohérent, ce qui est excellent pour la maintenabilité.

---

### **Handlers Globaux pour Promises (lignes 524-603)**

#### 17. `globalThemeExtractorHandler` + `handleThemeExtractorResponse()` (lignes 525-534)
- ✅ **Statut**: OK
- **Rôle**: Système de Promise pour attendre les réponses de ThemeExtractor
- **Pattern**: Handler global qui résout une Promise quand la réponse arrive
- **Usage**: Utilisé par `sendThemeExtractionRequest()`

#### 18. `globalRecommendationHandler` + `handleRecommendationResponse()` (lignes 536-544)
- ✅ **Statut**: OK
- **Rôle**: Système de Promise pour attendre les réponses de RecommendationAgent
- **Pattern**: Identique à ThemeExtractor
- **Usage**: Utilisé par `sendRecommendationRequest()`

---

### **Fonctions d'Envoi de Requêtes (lignes 547-660)**

#### 19. `sendRecommendationRequest(walletData)` (ligne 547)
- ⚠️ **Statut**: INCOMPLET
- **Problème**:
  ```typescript
  // TODO: Re-implement recommendation request
  // const { sendRequestToRecommendation } = require('./messageSenders')
  // sendRequestToRecommendation(socketRecommendation, walletData)
  ```
- **Impact**: Retourne une Promise mais n'envoie rien réellement
- **Recommandation**: Soit implémenter, soit documenter clairement comme non implémenté

#### 20. `sendThemeExtractionRequest(urls)` (ligne 631)
- ✅ **Statut**: OK
- **Rôle**: Envoie une liste d'URLs à ThemeExtractor pour analyse
- **Features**:
  - Timeout de 10 minutes (600000ms) - adapté pour analyses longues
  - Système de Promise avec `globalThemeExtractorHandler`
  - Pas de limite sur le nombre d'URLs
  - Résout avec thèmes parsés ou tableau vide en cas de timeout

#### 21. `sendMessage(agentType, text)` (ligne 667)
- ✅ **Statut**: OK - Fonction principale
- **Rôle**: Envoie un message texte à un agent spécifique
- **Parameters**:
  - `agentType`: 'SOFIA' | 'CHATBOT' | 'THEMEEXTRACTOR' | 'PULSEAGENT' | 'RECOMMENDATION'
  - `text`: Contenu du message
- **Payload Structure**:
  ```typescript
  {
    type: 2,  // SEND_MESSAGE
    payload: {
      channelId: agentIds.CHANNEL_ID,
      serverId: agentIds.SERVER_ID,
      senderId: agentIds.AUTHOR_ID,
      message: text,
      metadata: {
        source: "extension",
        timestamp: Date.now(),
        user_display_name: "User"
      }
    }
  }
  ```
- **Note**: `isDM` et `channelType` retirés du metadata pour éviter l'erreur "No world found"

---

## 🔍 Incohérences & Redondances Détectées

### ❌ **1. ROOM_ID vs CHANNEL_ID - REDONDANCE MAJEURE**

**Localisation**: Lignes 113-114, 156-157, interface `AgentIds`

**Problème**:
```typescript
// Dans setupAgentChannel()
agentIds.ROOM_ID = storedChannelId      // ← Même valeur
agentIds.CHANNEL_ID = storedChannelId   // ← Même valeur

// Interface AgentIds
export interface AgentIds {
  AUTHOR_ID: string
  ROOM_ID: string      // ← Toujours identique à CHANNEL_ID
  CHANNEL_ID: string   // ← Toujours identique à ROOM_ID
  AGENT_ID: string
  SERVER_ID: string
  AGENT_NAME: string
}
```

**Impact**:
- Les deux contiennent **toujours** la même valeur (le channel UUID depuis l'API REST)
- Confusion dans le code: parfois `ROOM_ID` est utilisé, parfois `CHANNEL_ID`
- Redondance inutile en mémoire

**Raison historique**:
- ElizaOS utilise parfois `roomId` et parfois `channelId` dans ses réponses
- Les deux ont été gardés "au cas où"

**Recommandation**:
1. Garder seulement `CHANNEL_ID` dans l'interface
2. Remplacer tous les usages de `agentIds.ROOM_ID` par `agentIds.CHANNEL_ID`
3. Dans les payloads Socket.IO, continuer d'utiliser `roomId` comme nom de propriété (c'est juste un nom de champ)

**Occurrences à modifier**:
- Ligne 113: `agentIds.ROOM_ID = storedChannelId` → `agentIds.CHANNEL_ID = storedChannelId`
- Ligne 156: `agentIds.ROOM_ID = channelData.id` → Supprimer (déjà assigné ligne 157)
- Ligne 158: Log utilise `ROOM_ID` → Changer pour `CHANNEL_ID`
- Interface `AgentIds`: Supprimer `ROOM_ID`

---

### ❌ **2. elizaRoomIds - VARIABLE MORTE**

**Localisation**: Lignes 222-229, fonction `getElizaRoomIds()` ligne 256

**Problème**:
```typescript
let elizaRoomIds: {
  sofia?: string
  chatbot?: string
  themeExtractor?: string
  pulse?: string
  recommendation?: string
} = {}

export function getElizaRoomIds() {
  return elizaRoomIds  // ← Toujours vide {}
}
```

**Impact**:
- Variable déclarée mais **jamais remplie**
- Fonction getter qui retourne toujours un objet vide
- Code mort qui pollue le fichier

**Recommandation**:
1. Supprimer la variable `elizaRoomIds`
2. Supprimer la fonction `getElizaRoomIds()`
3. Vérifier qu'aucune autre partie du code ne l'utilise (peu probable vu qu'elle est vide)

---

### ⚠️ **3. sendRecommendationRequest - FONCTION INCOMPLÈTE**

**Localisation**: Lignes 547-565

**Problème**:
```typescript
export async function sendRecommendationRequest(walletData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for recommendations'))
    }, 60000)

    globalRecommendationHandler = (recommendations) => {
      clearTimeout(timeout)
      resolve(recommendations || null)
    }

    // Send the request
    // TODO: Re-implement recommendation request  ← PAS IMPLÉMENTÉ
    console.log("📤 [websocket.ts] Sent recommendation request for wallet:", walletData?.address)
  })
}
```

**Impact**:
- La fonction retourne une Promise
- Mais elle **n'envoie jamais de message** au RecommendationAgent
- Promise timeout après 60s sans rien faire
- Trompeuse: le nom suggère qu'elle envoie une requête, mais elle ne fait que logger

**Recommandation**:
Option 1: Implémenter complètement
```typescript
// Envoyer vraiment le message
await sendMessage('RECOMMENDATION', JSON.stringify({
  type: 'recommendation_request',
  walletData
}))
```

Option 2: Documenter comme non implémenté
```typescript
export async function sendRecommendationRequest(walletData: any): Promise<any> {
  // NOT IMPLEMENTED: RecommendationAgent requires blockchain connection
  // to generate recommendations. This function is a placeholder.
  throw new Error('sendRecommendationRequest not implemented - requires blockchain')
}
```

---

### ⚠️ **4. Metadata - Incohérence mineure (documentée)**

**Localisation**: Ligne 141-145 (création channel) vs ligne 721-726 (envoi message)

**Observation**:

**À la création du channel**:
```typescript
metadata: {
  isDm: true,           // ← Présent
  source: "extension",
  createdAt: new Date().toISOString()
}
```

**À l'envoi du message**:
```typescript
metadata: {
  source: "extension",
  timestamp: Date.now(),
  user_display_name: "User"
  // Removed isDM and channelType to avoid DM onboarding issues
}
```

**Impact**:
- Incohérence entre metadata de création et metadata d'envoi
- **MAIS**: Intentionnel et documenté
- `isDM` retiré du message pour éviter l'erreur "No world found for user during onboarding"

**Statut**: ✅ OK - C'est une solution de contournement documentée

**Note**:
- L'erreur "No world found" persiste quand même
- Mais retirer `isDM` évite que le serveur traite le channel comme un DM privé
- Maintenant traité comme GROUP, ce qui évite le processus d'onboarding DM

---

### ℹ️ **5. Code Commenté - À Nettoyer**

**Localisation**: Lignes 379-391 (dans `initializeThemeExtractorSocket`)

**Code**:
```typescript
// socketThemeExtractor.on("message", async (data) => {
//   if (data.type === 4) { // AGENT_MESSAGE
//     ...
//   }
// })
//
// socketThemeExtractor.on("connect", async () => {
//   ...
//   (urls) => sendBookmarksToThemeExtractor(socketThemeExtractor, urls),
//   (urls) => sendHistoryToThemeExtractor(socketThemeExtractor, urls),
//   ...
// })
```

**Impact**:
- Code mort qui pollue la lisibilité
- Ancien pattern avant l'architecture unifiée
- Confusion pour les développeurs futurs

**Recommandation**: Supprimer complètement

---

## ✅ Points Positifs

### 1. Architecture Unifiée
- ✅ `setupAgentChannel()` centralise la logique de création/récupération de channels
- ✅ `handleAgentMessage()` centralise le traitement des messages
- ✅ Réduction de ~500 lignes à ~100 lignes de code partagé
- ✅ Maintenabilité excellente: un seul endroit à modifier pour tous les agents

### 2. Handlers Personnalisés Bien Implémentés
- ✅ Pattern cohérent: fonction unifiée + handler personnalisé optionnel
- ✅ Exemples:
  - ChatBot: envoie `CHATBOT_RESPONSE` au UI
  - ThemeExtractor: parse JSON + résout Promise
  - PulseAgent: stocke + notifie UI
  - RecommendationAgent: parse JSON + résout Promise

### 3. Gestion des Erreurs Cohérente
- ✅ Try/catch dans toutes les fonctions critiques
- ✅ Logs d'erreurs avec contexte (nom de l'agent)
- ✅ Graceful degradation (continue en cas d'erreur non critique)

### 4. Logs Détaillés
- ✅ Logs à chaque étape importante
- ✅ Format cohérent avec emojis: 📤, ✅, ❌, ⚠️
- ✅ Facilite grandement le debugging
- ✅ Logs de payload complets pour inspection

### 5. Configuration Commune
- ✅ `commonSocketConfig` partagé par tous les sockets
- ✅ Évite la duplication de configuration
- ✅ Facile à modifier (un seul endroit)

### 6. Persistance IndexedDB
- ✅ Channels sauvegardés et réutilisés après reload
- ✅ Service `agentChannelsService` bien utilisé
- ✅ Clé composite: `wallet_address:agent_name`

### 7. ROOM_JOINING
- ✅ Implémenté correctement pour tous les agents
- ✅ Nécessaire pour recevoir les `messageBroadcast` via Socket.IO
- ✅ Envoyé pour channels existants ET nouveaux

### 8. Type de Channel Correct
- ✅ `type: 2` (numérique) utilisé partout
- ✅ Corrige le problème précédent avec `type: "DM"` (string)

---

## 🎯 Recommandations de Refactoring

### Priorité HAUTE

#### 1. Supprimer ROOM_ID (garder seulement CHANNEL_ID)

**Changements**:
```typescript
// interface AgentIds - Supprimer ROOM_ID
export interface AgentIds {
  AUTHOR_ID: string
  CHANNEL_ID: string    // ← Garder seulement celui-ci
  AGENT_ID: string
  SERVER_ID: string
  AGENT_NAME: string
}

// setupAgentChannel() - Ligne 113-114
if (storedChannelId) {
  agentIds.CHANNEL_ID = storedChannelId  // ← Une seule assignation
  console.log(`♻️ [${agentName}] Reusing existing channel: ${storedChannelId}`)

  socket.emit("message", {
    type: 1,
    payload: {
      roomId: storedChannelId,  // ← Nom de propriété reste "roomId" (convention ElizaOS)
      entityId: agentIds.AUTHOR_ID
    }
  })
  // ...
}

// setupAgentChannel() - Ligne 156-158
if (channelData.id) {
  agentIds.CHANNEL_ID = channelData.id  // ← Une seule assignation
  console.log(`💾 [${agentName}] Updated CHANNEL_ID to: ${agentIds.CHANNEL_ID}`)
  // ...
}
```

**Impact**: Code plus clair, moins de confusion

---

#### 2. Supprimer Code Mort

**Supprimer**:
- Variable `elizaRoomIds` (ligne 222-229)
- Fonction `getElizaRoomIds()` (ligne 256-258)
- Code commenté lignes 379-391

**Vérification**: Faire une recherche globale pour s'assurer qu'aucune autre partie du code ne les utilise

---

### Priorité MOYENNE

#### 3. Compléter ou Documenter sendRecommendationRequest()

**Option A - Implémenter**:
```typescript
export async function sendRecommendationRequest(walletData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn("⚠️ [RecommendationAgent] Request timeout after 60s")
      globalRecommendationHandler = null
      resolve(null)
    }, 60000)

    globalRecommendationHandler = (recommendations) => {
      clearTimeout(timeout)
      resolve(recommendations || null)
    }

    // Envoyer le message au RecommendationAgent
    const message = JSON.stringify({
      type: 'recommendation_request',
      walletAddress: walletData?.address,
      timestamp: Date.now()
    })

    sendMessage('RECOMMENDATION', message)
      .catch((error) => {
        console.error("❌ [RecommendationAgent] Failed to send request:", error)
        clearTimeout(timeout)
        globalRecommendationHandler = null
        reject(error)
      })
  })
}
```

**Option B - Documenter comme non implémenté**:
```typescript
/**
 * Send recommendation request to RecommendationAgent
 *
 * @deprecated NOT IMPLEMENTED - Requires blockchain connection
 * @param walletData Wallet data (not used currently)
 * @returns Promise that rejects with error
 */
export async function sendRecommendationRequest(walletData: any): Promise<any> {
  throw new Error(
    'sendRecommendationRequest not implemented. ' +
    'RecommendationAgent requires active blockchain connection to Intuition Protocol.'
  )
}
```

---

#### 4. Ajouter Types TypeScript Plus Stricts

**Amélioration des types**:
```typescript
// Au lieu de any
export async function sendThemeExtractionRequest(urls: string[]): Promise<Theme[]>

interface Theme {
  name: string
  frequency: number
  urls?: string[]
}

// Au lieu de any pour walletData
interface WalletData {
  address: string
  chainId?: number
  balance?: string
}

export async function sendRecommendationRequest(walletData: WalletData): Promise<Recommendation[] | null>
```

---

### Priorité BASSE

#### 5. Documenter les Fonctions Principales

**Ajouter JSDoc**:
```typescript
/**
 * Unified function to setup agent channel (create or retrieve)
 *
 * This function:
 * 1. Checks IndexedDB for existing channel
 * 2. If exists: reuses it and sends ROOM_JOINING
 * 3. If not: creates via REST API, adds agent, sends ROOM_JOINING, stores in IndexedDB
 *
 * @param socket - Socket.IO instance for the agent
 * @param agentIds - Agent IDs object to update with channel ID
 * @param agentName - Agent name for logging ('SofIA', 'ChatBot', etc.)
 * @param onReady - Optional callback when setup is complete
 *
 * @example
 * await setupAgentChannel(socketSofia, sofiaIds, "SofIA")
 */
async function setupAgentChannel(
  socket: Socket,
  agentIds: AgentIds,
  agentName: string,
  onReady?: () => void
): Promise<void>
```

---

## 📊 Statistiques du Fichier

- **Lignes totales**: ~738
- **Fonctions**: 21
- **Fonctions d'initialisation socket**: 5 (une par agent)
- **Fonctions unifiées**: 3 (`setupAgentChannel`, `handleAgentMessage`, `sendMessage`)
- **Handlers globaux**: 2 (ThemeExtractor, RecommendationAgent)
- **Code mort détecté**: ~50 lignes (variable + fonction + commentaires)
- **Redondances**: ROOM_ID/CHANNEL_ID (~10 lignes à simplifier)

---

## 🏆 Score de Qualité

| Critère | Score | Commentaire |
|---------|-------|-------------|
| **Architecture** | 9/10 | Excellente avec fonctions unifiées |
| **Cohérence** | 8/10 | Pattern cohérent, quelques redondances |
| **Maintenabilité** | 9/10 | Facile à modifier grâce à l'architecture unifiée |
| **Lisibilité** | 7/10 | Bonne mais code mort à nettoyer |
| **Gestion erreurs** | 8/10 | Bonne couverture, logs détaillés |
| **Types TypeScript** | 6/10 | Trop de `any`, types à améliorer |
| **Documentation** | 5/10 | Manque de JSDoc sur fonctions principales |

**Score Global**: **7.5/10** - Bon code avec quelques améliorations possibles

---

## 📝 Plan d'Action Suggéré

### Phase 1: Nettoyage Rapide (30 min)
1. ✅ Supprimer `elizaRoomIds` et `getElizaRoomIds()`
2. ✅ Supprimer code commenté (lignes 379-391)
3. ✅ Remplacer tous les `agentIds.ROOM_ID` par `agentIds.CHANNEL_ID`
4. ✅ Supprimer `ROOM_ID` de l'interface `AgentIds`

### Phase 2: Amélioration Moyenne (1h)
1. ⏳ Décider du sort de `sendRecommendationRequest()` (implémenter ou documenter)
2. ⏳ Ajouter types TypeScript plus stricts
3. ⏳ Ajouter JSDoc sur fonctions principales

### Phase 3: Optimisation Longue (2h) [Optionnel]
1. ⏳ Résoudre l'erreur "No world found" pour éviter pollution logs multi-utilisateurs
2. ⏳ Tests unitaires pour fonctions unifiées
3. ⏳ Documentation complète de l'architecture

---

**Conclusion**: Le code est **globalement bien structuré** avec une excellente architecture unifiée. Les points à améliorer sont principalement du **nettoyage** (code mort, redondances) plutôt que des problèmes architecturaux majeurs.
