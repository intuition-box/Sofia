# Plan de Correction - Réception des Messages Agents

## Contexte

Après avoir debuggé avec `test-entity-bug.ts`, l'extension est devenue complexe et ne reçoit plus les réponses des agents. Les messages s'envoient correctement mais ne sont pas traités côté extension.

## Problème Identifié

**Symptôme**: `⏭️ [Chatbot] Message not for us, ignoring`

**Cause Racine**: L'extension filtre les messages en cherchant `data.authorId === AGENT_ID`, mais le serveur ElizaOS envoie l'agent ID dans `data.senderId`, pas `data.authorId`.

**Preuve depuis les logs**:
```javascript
// logClient.txt ligne 98:
📡 [Chatbot] messageBroadcast received: {
  senderId: 'c89710c9-057e-43cc-a1ef-73de724a332c',  // ❌ C'est l'USER ID
  authorId: undefined,  // ❌ Pas fourni
  channelId: '06770071-f399-4631-908e-b9a8ccc0b51e'
}

// logServer.txt ligne 87:
[SofIA-Chat] MessageBusService: Sending payload: {
  "author_id": "79c0c83b-2bd2-042f-a534-952c58a1024d"  // ✅ C'est l'AGENT ID
}
```

**Architecture Socket.IO découverte**:
- Le serveur utilise `socket.emit("messageBroadcast", {...})`
- Payload structure: `{senderId, senderName, text, roomId, channelId, serverId, createdAt, source, id, thought, actions}`
- `senderId` contient l'`author_id` de la requête REST API
- Quand l'agent répond, `author_id` = AGENT_ID → donc `senderId` devrait être AGENT_ID

## Travail Déjà Effectué ✅

### 1. Persistance des Channels (COMPLÉTÉ)

#### IndexedDB Store
- ✅ Ajouté `AGENT_CHANNELS` store dans `indexedDB.ts` (DB_VERSION = 6)
- ✅ Créé interface `AgentChannelRecord` avec clé composite `wallet_address:agent_name`
- ✅ Index créés: `walletAddress`, `agentName`, `channelId`, `lastUsed`

#### Service CRUD
- ✅ Créé `AgentChannelsService` dans `indexedDB-methods.ts` avec 8 méthodes:
  - `storeChannelId()` - Sauvegarde channel avec timestamp
  - `getStoredChannelId()` - Récupère channel existant
  - `getAllUserChannels()` - Liste channels d'un wallet
  - `getAllAgentChannels()` - Liste channels d'un agent
  - `deleteChannel()` - Supprime un channel
  - `clearUserChannels()` - Efface tous les channels d'un user
  - `clearAllChannels()` - Efface tout
  - `getChannelStats()` - Statistiques de debug

#### Implémentation WebSocket
- ✅ Ajouté `extractMessageText()` helper dans `websocket.ts`
- ✅ SofIA: Check de persistance avant création + storage après REST API
- ✅ Chatbot: Check de persistance avant création + storage après REST API

**Test résultat**: ✅ Persistance fonctionne (logs confirment réutilisation des channels)

```javascript
// Logs après reload complet:
♻️ [AgentChannels] Retrieved channel for ChatBot: 06770071-f399-4631-908e-b9a8ccc0b51e
♻️ [Chatbot] Reusing existing channel: 06770071-f399-4631-908e-b9a8ccc0b51e
```

### 2. Helper Function
- ✅ `extractMessageText()` créé pour extraction robuste du texte

## ✅ Travail Accompli (Session actuelle)

### Corrections WebSocket et Persistance
1. ✅ **Filtrage messages corrigé** : Changé `data.authorId` → `data.senderId` pour tous les 5 agents
2. ✅ **Persistance channels** : Implémentation complète avec IndexedDB pour réutilisation après reload
3. ✅ **ROOM_JOINING ajouté** : Type 1 émis après création/récupération de channel
4. ✅ **Type DM corrigé** : `type: 2` → `type: "DM"` pour création de channels
5. ✅ **Metadata enrichie** : Ajout `isDM: true` et `channelType: "DM"` dans sendMessage

### Résultat
- ✅ L'extension envoie correctement les messages aux agents
- ✅ Les agents reçoivent et génèrent des réponses
- ✅ Les channels sont persistés et réutilisés
- ⚠️ **Blocage identifié** : Le serveur ElizaOS ne broadcast pas les réponses d'agents via Socket.IO

### Prochain Déblocage Nécessaire
**Question pour l'équipe ElizaOS** : Comment les clients externes doivent-ils recevoir les réponses d'agents ? Le `messageBroadcast` Socket.IO ne semble émettre que les messages utilisateur, pas les réponses d'agents qui passent par le MessageBus interne.

## Travail À Faire 🔄 (En attente de réponse ElizaOS)

### Phase 1: Correction Urgente - Filtrage des Messages Agent

**Fichier**: `extension/background/websocket.ts`

**Problème**: Les 5 agents utilisent le mauvais champ pour filtrer les réponses.

**Code actuel (INCORRECT)**:
```typescript
socketBot.on("messageBroadcast", (data) => {
  if (
    (data.roomId === chatbotIds.ROOM_ID || data.channelId === chatbotIds.CHANNEL_ID) &&
    (data.authorId === chatbotIds.AGENT_ID || data.author_id === chatbotIds.AGENT_ID)  // ❌ FAUX
  ) {
    // Process
  }
})
```

**Code corrigé (CORRECT)**:
```typescript
socketBot.on("messageBroadcast", (data) => {
  console.log("📡 [Chatbot] messageBroadcast received:", {
    channelId: data.channelId,
    senderId: data.senderId,  // 🆕 L'auteur du message
    expectedChannelId: chatbotIds.CHANNEL_ID,
    expectedAgentId: chatbotIds.AGENT_ID,
    isFromAgent: (data.senderId === chatbotIds.AGENT_ID)
  })

  // ✅ CORRECTION: Vérifier senderId (pas authorId)
  if (
    data.channelId === chatbotIds.CHANNEL_ID &&
    data.senderId === chatbotIds.AGENT_ID
  ) {
    console.log("✅ [Chatbot] Agent response matched! Sending to UI...")

    const messageText = extractMessageText(data)

    chrome.runtime.sendMessage({
      type: "CHATBOT_RESPONSE",
      text: messageText
    }).catch((error) => {
      console.warn("⚠️ [Chatbot] Error sending CHATBOT_RESPONSE:", error)
    })
  } else {
    console.log("⏭️ [Chatbot] Message not for us (from user or different channel)")
  }
})
```

**Agents à corriger** (ordre prioritaire):
1. ✅ **Chatbot** (lignes ~382-422) - Tester d'abord
2. **SofIA** (lignes ~203-253)
3. **ThemeExtractor** (lignes ~541-585)
4. **PulseAgent** (lignes ~672-716)
5. **RecommendationAgent** (lignes ~820-864)

**Pattern de correction**:
- Remplacer `data.authorId` par `data.senderId`
- Supprimer le fallback `|| data.author_id`
- Simplifier: `data.channelId === agentIds.CHANNEL_ID && data.senderId === agentIds.AGENT_ID`
- Logger `senderId` pour debug

### Phase 2: Persistance pour les 3 Agents Restants

**Agents**: ThemeExtractor, PulseAgent, RecommendationAgent

**Travail**:
1. Ajouter check de channel existant via `agentChannelsService.getStoredChannelId()`
2. Si channel existe: réutiliser et return early
3. Si pas de channel: créer via REST API + stocker dans IndexedDB
4. Suivre le pattern exact de SofIA/Chatbot

**Fichiers**: `extension/background/websocket.ts` (lignes ~475-870)

### Phase 3: Restoration des Handlers Globaux

**Fichier**: `extension/background/websocket.ts`

**Problème**: Handlers commentés pour ThemeExtractor et RecommendationAgent

**Lignes à restaurer**:
- ThemeExtractor global handler (~ligne 590-620)
- RecommendationAgent global handler (~ligne 870-900)

**Actions**:
- Décommenter les handlers
- Vérifier que les event types correspondent
- Tester la réception des analyses thématiques et recommandations

### Phase 4: Implémentation Fonctions d'Envoi

**Fichier**: `extension/background/messageSenders.ts` ou `websocket.ts`

**Fonctions à implémenter**:
1. `sendThemeExtractionRequest()` - Envoyer URL pour analyse thématique
2. `sendRecommendationRequest()` - Demander recommandations basées sur historique

**Pattern à suivre**:
```typescript
export async function sendThemeExtractionRequest(url: string, metadata?: any) {
  if (!socketThemeExtractor || !socketThemeExtractor.connected) {
    throw new Error("ThemeExtractor socket not connected")
  }

  const payload = {
    type: 2,  // SEND_MESSAGE
    payload: {
      channelId: themeextractorIds.CHANNEL_ID,
      serverId: themeextractorIds.SERVER_ID,
      senderId: themeextractorIds.AUTHOR_ID,
      message: JSON.stringify({ url, metadata }),
      metadata: {
        source: "extension",
        timestamp: Date.now()
      }
    }
  }

  socketThemeExtractor.emit("message", payload)
}
```

## Plan de Test

### Test 1: Chatbot (Prioritaire)
1. Corriger le filtrage Chatbot (senderId)
2. Rebuild extension: `cd extension && pnpm build`
3. Recharger extension dans Chrome
4. Envoyer message test via ChatPage
5. Vérifier logs client:
   - `📡 [Chatbot] messageBroadcast received: {senderId: '79c0c83b-...', ...}`
   - `✅ [Chatbot] Agent response matched!`
   - `✅ [Chatbot] Response sent to UI`
6. Vérifier UI: réponse s'affiche dans le chat

**Critère de succès**: Message agent visible dans l'UI

### Test 2: SofIA
1. Même pattern que Chatbot
2. Tester depuis navigation tracking
3. Vérifier réception des triplets

### Test 3: ThemeExtractor, PulseAgent, RecommendationAgent
1. Corriger filtrage + persistance
2. Implémenter fonctions d'envoi
3. Tester chaque agent individuellement
4. Vérifier logs serveur ET client

### Test 4: Persistance Multi-Session
1. Envoyer messages à tous les agents
2. Fermer/réouvrir extension
3. Vérifier réutilisation des channels (logs `♻️ Reusing existing channel`)
4. Envoyer nouveaux messages
5. Vérifier réception correcte

## Notes Techniques Importantes

### Structure ElizaOS MessageBroadcast
```typescript
{
  senderId: string,        // L'auteur du message (USER_ID ou AGENT_ID)
  senderName: string,      // Nom affiché
  text: string,            // Contenu
  roomId: string,          // Channel ID
  channelId: string,       // Channel ID (identique à roomId)
  serverId: string,        // Server ID
  createdAt: number,       // Timestamp
  source: string,          // "user_message" | "agent_response"
  id: string,              // Message ID
  thought?: string,        // Processus de pensée agent
  actions?: string[],      // Actions agent
  attachments?: any[]      // Pièces jointes
}
```

### Différencier User vs Agent
- **Message User**: `data.senderId === USER_ID` (c89710c9-057e-43cc-a1ef-73de724a332c)
- **Message Agent**: `data.senderId === AGENT_ID` (79c0c83b-2bd2-042f-a534-952c58a1024d)
- **Channel match**: `data.channelId === agentIds.CHANNEL_ID`

### IDs Constants (constants.ts)
```typescript
// Ne JAMAIS changer ces IDs:
SOFIA_AGENT_ID = "582f4e58-1285-004d-8ef6-1e6301f3d646"
CHATBOT_AGENT_ID = "79c0c83b-2bd2-042f-a534-952c58a1024d"
THEMEEXTRACTOR_AGENT_ID = "7dad3d3a-db1a-08a2-9dda-182d98b6cf2b"
PULSEAGENT_AGENT_ID = "8afb486a-3c96-0569-b112-4a7f465862b2"
RECOMMENDATION_AGENT_ID = "92a956b2-ec82-0d31-8fc1-31c9e13836a3"
```

### UserSessionManager
- `AUTHOR_ID` = User UUID (généré depuis wallet)
- `AGENT_ID` = Agent UUID (depuis constants.ts - FIXE)
- `CHANNEL_ID` = Créé via REST API + persisté dans IndexedDB
- Format clé IndexedDB: `wallet_address:agent_name`

## Ordre d'Exécution

1. **[URGENT]** Corriger filtrage Chatbot + Tester
2. **[URGENT]** Corriger filtrage SofIA + Tester
3. Corriger filtrage ThemeExtractor + Ajouter persistance
4. Corriger filtrage PulseAgent + Ajouter persistance
5. Corriger filtrage RecommendationAgent + Ajouter persistance
6. Restaurer handlers globaux ThemeExtractor
7. Restaurer handlers globaux RecommendationAgent
8. Implémenter sendThemeExtractionRequest
9. Implémenter sendRecommendationRequest
10. Test final multi-agent + multi-session

## Critères de Succès Final

✅ Tous les agents reçoivent et affichent leurs réponses
✅ Channels persistés et réutilisés après reload
✅ Logs clairs avec identification correct des messages agents
✅ Pas de création de channels dupliqués
✅ UI responsive pour tous les types de réponses
✅ Multi-user fonctionnel (via wallet address keying)

## Références Code

- IndexedDB: `extension/lib/database/indexedDB.ts` (lignes 13, 26, 96-104, 242-250)
- CRUD Service: `extension/lib/database/indexedDB-methods.ts` (lignes 1025-1196)
- WebSocket: `extension/background/websocket.ts` (lignes 14-27, 122-253, 287-422, 475-870)
- Constants: `extension/background/constants.ts`
- Server Code: `agent-sofia/node_modules/@elizaos/server/dist/index.js` (lignes 27073, 27132, 27190)
