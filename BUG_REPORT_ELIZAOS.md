# Bug Report: Entity Creation Fails with CLI v1.6.3/v1.6.4

## Our Flow

1. **Socket.IO Connection** → Connect to ElizaOS server (port 3000)
2. **REST API: Create Channel** → `POST /api/messaging/central-channels` 
3. **REST API: Add Agent to Channel** → `POST /api/messaging/central-channels/{channelId}/agents`
4. **Socket.IO: Send Message** → Send message 


## The Bug

**Expected behavior:** When a message arrives with a `senderId` (user UUID), MessageService should automatically create an entity for that user via `ensureAuthorEntityExists()`.

**With CLI v1.6.3 and v1.6.4:** `ensureAuthorEntityExists()` is never called

```
[SocketIO] Received SEND_MESSAGE from senderId: c89710c9-057e-43cc-a1ef-73de724a332c
[MessageBusService] All checks passed, proceeding to create agent memory and emit MESSAGE_RECEIVED event
[MessageService] Message received from e161938d-6b56-0128-aa91-94201f895f01 in room ...
# ❌ No [MessageService DEBUG] logs between these lines!
# ❌ ensureAuthorEntityExists() NEVER CALLED
Warn: core::prompts:formatPosts - no entity for {
  entityId: "e161938d-6b56-0128-aa91-94201f895f01"
}
# ❌ Entity does not exist in database → "Unknown User"
```

**The Issue:**

`ensureAuthorEntityExists()` should be called BEFORE `[MessageService] Message received from...` to:
1. Transform user UUID: `c89710c9-...` → `e161938d-6b56-...` (using `createUniqueUuid()`)
2. Create entity in database with transformed ID
3. Return transformed ID for message processing

With CLI npm packages, this function is **never called**, so the entity is never created in the database, causing the "no entity" warning.

**With Monorepo:** Entity creation works correctly

```
[SocketIO] Received SEND_MESSAGE from senderId: c89710c9-057e-43cc-a1ef-73de724a332c
[MessageBusService] All checks passed, proceeding to process message
[MessageService DEBUG] About to call ensureAuthorEntityExists for author_id: c89710c9-057e-43cc-a1ef-73de724a332c
[MessageService DEBUG] Transformed ID: e161938d-6b56-0128-aa91-94201f895f01
[MessageService DEBUG] Creating new entity with ID: e161938d-6b56-0128-aa91-94201f895f01
[MessageService DEBUG] Entity created successfully
Final senderName: User-c89710c9 ✅
```

## Socket.IO Message Format

```javascript
socket.emit("message", {
  type: 2, 
  payload: {
    channelId: "a47f9a5d-4643-4e14-877a-2f6db57bbd88",
    serverId: "00000000-0000-0000-0000-000000000000",
    senderId: "c89710c9-057e-43cc-a1ef-73de724a332c", // User UUID
    message: "Test message",
    metadata: {
      source: "extension",
      timestamp: Date.now(),
      user_display_name: "User"
    }
  }
})
```

## REST API Calls

### Step 2: Create Channel

```javascript
POST /api/messaging/central-channels
{
  "name": "DM-Chatbot-1234567890",
  "type": 2,
  "server_id": "00000000-0000-0000-0000-000000000000",
  "participantCentralUserIds": [
    "c89710c9-057e-43cc-a1ef-73de724a332c",
    "79c0c83b-2bd2-042f-a534-952c58a1024d"
  ],
  "metadata": {
    "isDm": true,
    "createdAt": "2025-01-11T18:30:00.000Z"
  }
}
```

### Step 3: Add Agent to Channel

```bash
POST /api/messaging/central-channels/{channelId}/agents
{
  "agentId": "79c0c83b-2bd2-042f-a534-952c58a1024d"
}
```

**File involved:** `packages/server/src/services/message.ts` - `ensureAuthorEntityExists()`
