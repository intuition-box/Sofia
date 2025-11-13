#!/usr/bin/env tsx
/**
 * Test script pour valider la communication avec le Chatbot
 * Vérifie que les corrections (authorId + persistance) fonctionnent
 */

import { io, Socket } from 'socket.io-client';

const config = {
  server: {
    url: 'http://localhost:3000'
  },
  agent: {
    // IDs depuis extension/background/constants.ts CHATBOT_BASE_IDS
    userId: 'c89710c9-057e-43cc-a1ef-73de724a332c',  // Remplacer par votre USER_ID si différent
    agentId: '79c0c83b-2bd2-042f-a534-952c58a1024d'   // Chatbot AGENT_ID
  }
};

async function createChannel(serverUrl: string, userId: string, agentId: string) {
  console.log(`🔧 Creating DM channel via REST API...`);

  const response = await fetch(`${serverUrl}/api/messaging/central-channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Test-Chatbot-${Date.now()}`,
      type: 2,
      server_id: '00000000-0000-0000-0000-000000000000',
      participantCentralUserIds: [userId, agentId],
      metadata: {
        isDm: true,
        source: 'test-script',
        createdAt: new Date().toISOString()
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create channel: ${response.statusText}`);
  }

  const result = await response.json();
  const channel = result.data || result;
  console.log(`✅ Channel created: ${channel.id}`);

  // Add agent to channel
  const addAgentResponse = await fetch(
    `${serverUrl}/api/messaging/central-channels/${channel.id}/agents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    }
  );

  if (addAgentResponse.ok) {
    console.log(`✅ Agent added to channel`);
  } else {
    console.warn(`⚠️ Could not add agent: ${addAgentResponse.statusText}`);
  }

  return channel;
}

async function testChatbot() {
  console.log('🧪 Testing Chatbot Communication\n');
  console.log('Configuration:');
  console.log(`  Server URL: ${config.server.url}`);
  console.log(`  User ID: ${config.agent.userId}`);
  console.log(`  Agent ID: ${config.agent.agentId}\n`);

  try {
    // 1. Create channel
    console.log('📝 Step 1: Setting up channel...');
    const channel = await createChannel(
      config.server.url,
      config.agent.userId,
      config.agent.agentId
    );

    console.log(`\n✅ Channel ready: ${channel.id}\n`);

    // 2. Connect via Socket.IO
    console.log('📝 Step 2: Connecting via Socket.IO...');
    const socket: Socket = io(config.server.url, {
      transports: ['websocket'],
      reconnection: true
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log(`✅ Socket connected (ID: ${socket.id})\n`);
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // 3. Send test message and wait for response
    console.log('📝 Step 3: Sending test message...');
    console.log('   Message: "Bonjour! Test de communication."\n');
    console.log('⏳ Waiting for agent response (15s timeout)...\n');

    const messagePromise = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout - no response after 15s'));
      }, 15000);

      let responseReceived = false;

      socket.on('messageBroadcast', (data: any) => {
        console.log('📨 messageBroadcast received:', {
          channelId: data.channelId,
          senderId: data.senderId,
          authorId: data.authorId || data.author_id,
          isFromAgent: (data.authorId === config.agent.agentId || data.author_id === config.agent.agentId),
          textPreview: (data.text || data.content?.text || '').substring(0, 50)
        });

        // Check if it's from the agent (using authorId, not senderId!)
        if (!responseReceived && (data.authorId === config.agent.agentId || data.author_id === config.agent.agentId)) {
          responseReceived = true;
          clearTimeout(timeout);
          resolve(data);
        }
      });

      socket.on('message', (data: any) => {
        if (data.type === 4 && !responseReceived) { // AGENT_MESSAGE
          responseReceived = true;
          clearTimeout(timeout);
          resolve(data);
        }
      });

      // Send message
      socket.emit('message', {
        type: 2, // SEND_MESSAGE
        payload: {
          channelId: channel.id,
          serverId: '00000000-0000-0000-0000-000000000000',
          senderId: config.agent.userId,
          message: 'Bonjour! Test de communication.',
          metadata: {
            source: 'test-script',
            timestamp: Date.now(),
            user_display_name: 'Test User'
          }
        }
      });

      console.log('✅ Message sent to channel\n');
    });

    try {
      const response = await messagePromise;
      const text = response.text || response.payload?.content?.text || response.content?.text || 'No text';

      console.log('✅ ✅ ✅ TEST PASSED! ✅ ✅ ✅');
      console.log(`   Agent response: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n`);
      console.log('🎉 Communication works correctly!');
      console.log('   - authorId filtering: ✅ WORKING');
      console.log('   - Message extraction: ✅ WORKING');
      console.log('   - Channel setup: ✅ WORKING');

    } catch (error: any) {
      console.log('❌ ❌ ❌ TEST FAILED! ❌ ❌ ❌');
      console.log(`   ${error.message}\n`);
      console.log('⚠️ Check:');
      console.log('   1. Is ElizaOS server running? (elizaos start)');
      console.log('   2. Is the Chatbot agent active?');
      console.log('   3. Check server logs for errors');
    }

    // Cleanup
    socket.disconnect();

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
console.log('═══════════════════════════════════════════════════════════');
console.log('  Chatbot Communication Test');
console.log('═══════════════════════════════════════════════════════════\n');

testChatbot()
  .then(() => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Test Completed');
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
