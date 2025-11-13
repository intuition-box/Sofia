# Tests de Validation - Extension SofIA

Ce répertoire contient les scripts de test pour valider les corrections apportées à la communication WebSocket et à la persistance des channels.

## Scripts de Test

### 1. `test-channel-persistence.ts`
**Objectif** : Valider que la persistance des channels fonctionne correctement pour les 5 agents.

**Ce qui est testé** :
- ✅ Création de channels pour les 5 agents via REST API
- ✅ Stockage des channels dans IndexedDB
- ✅ Récupération des channels après "reconnexion"
- ✅ Isolation multi-utilisateur (channels séparés par wallet)
- ✅ Pas de création de channels dupliqués

**Scénarios** :
1. **First Connection** : Crée 5 nouveaux channels (un par agent)
2. **Reconnection** : Réutilise les 5 channels existants (aucune création)
3. **Verification** : Vérifie que les IDs des channels correspondent
4. **Multi-User** : Teste avec un second wallet pour vérifier l'isolation

### 2. `test-message-reception.ts`
**Objectif** : Valider que tous les agents reçoivent correctement leurs réponses via WebSocket.

**Ce qui est testé** :
- ✅ Création de channel pour chaque agent
- ✅ Envoi de message test à chaque agent
- ✅ Réception de la réponse via `messageBroadcast`
- ✅ Filtrage correct avec `senderId === agentId` (fix principal)
- ✅ Mesure du temps de réponse

**Agents testés** :
1. **SofIA** - Agent de structuration sémantique
2. **Chatbot** - Agent conversationnel
3. **ThemeExtractor** - Extracteur de thèmes
4. **PulseAgent** - Analyseur d'activité
5. **RecommendationAgent** - Agent de recommandation

## Prérequis

### 1. Installer les dépendances

```bash
cd extension

# Installer les dépendances de test supplémentaires
pnpm add -D tsx idb
```

### 2. Serveur ElizaOS en cours d'exécution

Le serveur doit être accessible sur `http://localhost:3000` avec les 5 agents démarrés :

```bash
cd agent-sofia
elizaos start
```

Vérifier que les agents sont démarrés (devrait afficher les 5 agents).

## Exécution des Tests

### Option 1 : Via npm scripts (recommandé)

```bash
cd extension

# Test de persistance uniquement
pnpm test:persistence

# Test de réception des messages uniquement
pnpm test:messages

# Tous les tests
pnpm test:all
```

### Option 2 : Exécution directe

```bash
cd extension/background/__test__

# Test de persistance
tsx test-channel-persistence.ts

# Test de réception
tsx test-message-reception.ts
```

## Sortie Attendue

### Test 1 : Persistance des Channels

```
🧪 Starting Channel Persistence Tests
============================================================

📦 Initializing test IndexedDB...
✅ Test IndexedDB initialized

👤 Test User ID: c8971c9-057e-43cc-a1ef-73de724a332c
👛 Test Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

📍 TEST 1: First Connection (No Persistence)
------------------------------------------------------------

[SofIA]
❌ No stored channel for SofIA
🔧 Creating channel for SofIA via REST API...
✅ Channel created: 12345678-1234-5678-1234-567812345678
✅ Agent SofIA added to channel
💾 Stored channel for SofIA: 12345678-1234-5678-1234-567812345678

[... répété pour les 5 agents ...]

============================================================
✅ TEST 1 COMPLETE: All 5 channels created and stored

📊 Stored Channels:
   SofIA: 12345678...
   Chatbot: 23456789...
   ThemeExtractor: 34567890...
   PulseAgent: 45678901...
   RecommendationAgent: 56789012...

📍 TEST 2: Reconnection (With Persistence)
------------------------------------------------------------

[SofIA]
♻️  Retrieved channel for SofIA: 12345678-1234-5678-1234-567812345678
✅ Reused existing channel (no API call needed)

[... répété pour les 5 agents ...]

============================================================
✅ TEST 2 COMPLETE: All 5 channels reused from persistence

📍 TEST 3: Verification
------------------------------------------------------------
✅ SofIA: MATCH
✅ Chatbot: MATCH
✅ ThemeExtractor: MATCH
✅ PulseAgent: MATCH
✅ RecommendationAgent: MATCH

============================================================
✅ TEST 3 COMPLETE: All channels match perfectly!

📍 TEST 4: Multi-User Isolation
------------------------------------------------------------
✅ Channels are isolated per user

============================================================
✅ TEST 4 COMPLETE: Multi-user isolation working!

📊 FINAL SUMMARY
============================================================
Total channels stored: 6
Expected: 6 (5 for first user + 1 for second user)

✅ Channel count correct

============================================================
✅ ALL TESTS COMPLETED SUCCESSFULLY! 🎉
```

### Test 2 : Réception des Messages

```
🧪 Starting Message Reception Tests

================================================================================

👤 Test User ID: c8971c9-057e-43cc-a1ef-73de724a332c
👛 Test Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb


================================================================================
🎯 TESTING: SofIA
================================================================================
🔧 [SofIA] Creating channel...
✅ [SofIA] Channel created: 12345678...
✅ [SofIA] Agent added to channel

📡 [SofIA] Connecting to Socket.IO...
✅ [SofIA] Socket connected: abc123
📤 [SofIA] Sending message: "Analyze this URL: https://example.com/test"
✅ [SofIA] Message sent successfully
📨 [SofIA] messageBroadcast received: {
  channelId: '12345678-1234-5678-1234-567812345678',
  senderId: '582f4e58-1285-004d-8ef6-1e6301f3d646',
  isFromAgent: true
}
✅ [SofIA] AGENT RESPONSE MATCHED!
📝 [SofIA] Response text: {"atoms":[...],"triplets":[...]}...

[... répété pour tous les agents ...]


================================================================================
📊 TEST RESULTS SUMMARY
================================================================================

Agent                  | Channel Created | Message Sent | Response Received | Duration
------------------------------------------------------------------------------------------
SofIA                  | ✅              | ✅           | ✅                | 1245ms
Chatbot                | ✅              | ✅           | ✅                | 987ms
ThemeExtractor         | ✅              | ✅           | ✅                | 1532ms
PulseAgent             | ✅              | ✅           | ✅                | 1098ms
RecommendationAgent    | ✅              | ✅           | ✅                | 1876ms

✅ Successful: 5/5
❌ Failed:     0/5

================================================================================
🎉 ALL TESTS PASSED! All 5 agents are receiving messages correctly.
================================================================================
```

## Diagnostic des Échecs

### Si test-channel-persistence.ts échoue :

**Symptôme** : Channels ne correspondent pas après reconnexion

**Causes possibles** :
- IndexedDB n'est pas initialisé correctement
- Le service `agentChannelsService` ne persiste pas les channels
- DB_VERSION pas à jour

**Solution** :
1. Vérifier [indexedDB.ts](../lib/database/indexedDB.ts): `DB_VERSION = 6`
2. Vérifier que le store `AGENT_CHANNELS` existe
3. Vérifier [indexedDB-methods.ts](../lib/database/indexedDB-methods.ts): `AgentChannelsService`

### Si test-message-reception.ts échoue :

**Symptôme** : `Timeout waiting for response`

**Causes possibles** :
1. Serveur ElizaOS pas démarré
2. Agent spécifique ne répond pas
3. Filtrage incorrect (senderId vs authorId)

**Solution** :
```bash
# 1. Vérifier que le serveur tourne
curl http://localhost:3000/health

# 2. Vérifier les agents
cd agent-sofia
elizaos list

# 3. Regarder les logs du serveur
# Chercher les messages de l'agent testé
```

**Symptôme** : `Message not from agent`

**Cause** : Le `senderId` dans `messageBroadcast` ne correspond pas à l'`agentId`

**Solution** :
- Vérifier [websocket.ts](../websocket.ts): ligne ~395, ~217, ~560, ~720, ~898
- S'assurer que la condition est bien `data.senderId === agentIds.AGENT_ID`
- Comparer avec les IDs dans [constants.ts](../constants.ts)

## Validation Finale

Une fois les deux tests passés avec succès :

1. **Rebuild l'extension** :
   ```bash
   cd extension
   pnpm build
   ```

2. **Recharger l'extension** dans Chrome (chrome://extensions/)

3. **Tester manuellement** :
   - Ouvrir le side panel
   - Envoyer un message au Chatbot
   - Vérifier que la réponse s'affiche
   - Recharger l'extension (F5 dans le side panel)
   - Envoyer un autre message
   - Vérifier dans les logs DevTools :
     ```
     ♻️ [Chatbot] Reusing existing channel: abc123...
     ✅ [Chatbot] Agent response matched! Sending to UI...
     ```

## Structure des Tests

```
extension/background/__test__/
├── test-channel-persistence.ts    # Test de persistance IndexedDB
├── test-message-reception.ts      # Test de réception WebSocket
├── test-agent.ts                  # Test existant
└── README.md                      # Ce fichier
```

## Configuration VSCode

Pour exécuter les tests directement dans VSCode, ajouter dans `.vscode/tasks.json` :

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Test: Channel Persistence",
      "type": "shell",
      "command": "pnpm test:persistence",
      "options": {
        "cwd": "${workspaceFolder}/extension"
      },
      "group": "test"
    },
    {
      "label": "Test: Message Reception",
      "type": "shell",
      "command": "pnpm test:messages",
      "options": {
        "cwd": "${workspaceFolder}/extension"
      },
      "group": "test"
    },
    {
      "label": "Test: All",
      "type": "shell",
      "command": "pnpm test:all",
      "options": {
        "cwd": "${workspaceFolder}/extension"
      },
      "group": {
        "kind": "test",
        "isDefault": true
      }
    }
  ]
}
```

## Notes Importantes

1. **Isolation** : `test-channel-persistence.ts` utilise une base IndexedDB séparée (`sofiaDB-test`) pour ne pas polluer les données de l'extension
2. **Nettoyage** : Les tests nettoient leurs données à la fin (appel à `clearAll()`)
3. **Séquentiel** : `test-message-reception.ts` exécute les tests d'agents l'un après l'autre avec 2s de délai pour éviter la surcharge
4. **Timeout** : Chaque test d'agent a un timeout de 15s
5. **Dépendances** :
   - `tsx` : Exécuteur TypeScript (déjà dans devDependencies)
   - `socket.io-client` : Client WebSocket (déjà dans dependencies)
   - `idb` : Wrapper IndexedDB pour Node.js (à installer)

## Contribution

Pour ajouter de nouveaux tests :

1. Créer un fichier `test-*.ts` dans ce répertoire
2. Suivre le pattern existant (setup, test, teardown)
3. Utiliser les helpers existants (`generateUserId()`, `setupChannel()`)
4. Logger clairement chaque étape avec des emojis pour faciliter le debug
5. Inclure des assertions claires (✅/❌)
6. Produire un résumé final avec statistiques
7. Ajouter le script dans `package.json`

## Références

- Code source WebSocket: [../websocket.ts](../websocket.ts)
- Persistance IndexedDB: [../lib/database/indexedDB.ts](../lib/database/indexedDB.ts)
- Service CRUD: [../lib/database/indexedDB-methods.ts](../lib/database/indexedDB-methods.ts)
- Constants des agents: [../constants.ts](../constants.ts)
- Plan complet: [/PLAN.md](/PLAN.md)
