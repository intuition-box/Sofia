#!/usr/bin/env tsx

/**
 * Test script to reproduce entity creation bug with CLI npm packages
 * Based on eliza-client-template test script
 */

import { io, Socket } from 'socket.io-client';

const config = {
  server: {
    url: 'http://localhost:3000'
  },
  agent: {
    userId: 'c89710c9-057e-43cc-a1ef-73de724a332c',
    agentId: '79c0c83b-2bd2-042f-a534-952c58a1024d'
  }
};

async function ensureChannelWithAgent(serverUrl: string, userId: string, agentId: string) {
  console.log(`   Creating channel via REST API...`);

  // Create channel via REST API
  const channelResponse = await fetch(`${serverUrl}/api/messaging/central-channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `DM-Test-${Date.now()}`,
      type: 2,
      server_id: '00000000-0000-0000-0000-000000000000',
      participantCentralUserIds: [userId, agentId],
      metadata: {
        isDm: true,
        createdAt: new Date().toISOString()
      }
    })
  });

  if (!channelResponse.ok) {
    throw new Error(`Failed to create channel: ${channelResponse.statusText}`);
  }

  const channelData = await channelResponse.json();
  const channel = channelData.data || channelData; // Handle both response formats
  console.log(`   ✅ Channel created: ${channel.id}`);

  // Add agent to channel
  console.log(`   Adding agent to channel...`);
  const addAgentResponse = await fetch(
    `${serverUrl}/api/messaging/central-channels/${channel.id}/agents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    }
  );

  if (!addAgentResponse.ok) {
    throw new Error(`Failed to add agent: ${addAgentResponse.statusText}`);
  }

  console.log(`   ✅ Agent added to channel`);
  return channel;
}

async function testChannelSetup() {
  console.log('🧪 Testing Entity Creation Bug Reproduction\n');
  console.log('Configuration:');
  console.log(`  Server URL: ${config.server.url}`);
  console.log(`  User ID: ${config.agent.userId}`);
  console.log(`  Agent ID: ${config.agent.agentId}\n`);

  try {
    // Test 1: Create channel and add participants via API
    console.log('📝 Test 1: Setting up channel with participants...');
    const channel = await ensureChannelWithAgent(
      config.server.url,
      config.agent.userId,
      config.agent.agentId
    );

    console.log(`\n✅ Channel ready: ${channel.id}`);
    console.log(`   Name: ${channel.name}`);
    console.log(`   Participants: User (${config.agent.userId}) and Agent (${config.agent.agentId})\n`);

    // Test 2: Connect via Socket.IO
    console.log('📝 Test 2: Connecting via Socket.IO...');
    const socket: Socket = io(config.server.url, {
      transports: ['websocket'],
      reconnection: true
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

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

    // Test 3: Send message via socket and wait for response
    console.log('📝 Test 3: Sending message via Socket.IO...');
    console.log('   Message: "Hello! Please respond to verify entity creation works."\n');
    console.log('⏳ Waiting for agent response (15s timeout)...\n');
    console.log('👀 Watch the server logs for:');
    console.log('   - [MessageService DEBUG] About to call ensureAuthorEntityExists');
    console.log('   - [MessageService DEBUG] Entity created successfully');
    console.log('   OR');
    console.log('   - Warn: core::prompts:formatPosts - no entity for {...}\n');

    const messagePromise = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message timeout (15s) - no agent response'));
      }, 15000);

      let messageReceived = false;

      socket.on('message', (data: any) => {
        if (data.type === 4 && !messageReceived) { // AGENT_MESSAGE
          messageReceived = true;
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
          message: 'Hello! Please respond to verify entity creation works.',
          metadata: {
            source: 'entity-bug-test',
            timestamp: Date.now(),
            user_display_name: 'Test User'
          }
        }
      });

      console.log('✅ Message sent to channel\n');
    });

    try {
      const response = await messagePromise;
      console.log('✅ Agent response received!');
      const text = response.payload?.content?.text || 'No text in response';
      console.log(`   Response: "${text.substring(0, 150)}${text.length > 150 ? '...' : ''}"\n`);

      console.log('✅ TEST PASSED: Entity was created successfully!');
      console.log('   No "no entity" warning in server logs means bug is NOT present.');
    } catch (error: any) {
      console.log('⏱️  Message timeout occurred');
      console.log(`   ${error.message}\n`);
      console.log('⚠️  Check server logs above:');
      console.log('   - If you see "no entity for {...}" → BUG REPRODUCED');
      console.log('   - If you see "Entity created successfully" → Bug NOT present (symlinks working)');
    }

    // Cleanup
    socket.disconnect();
    console.log('\n✅ Test completed - Check server logs for entity creation status');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
console.log('═══════════════════════════════════════════════════════════');
console.log('  Entity Creation Bug Reproduction Test');
console.log('═══════════════════════════════════════════════════════════\n');

testChannelSetup()
  .then(() => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Test Execution Completed');
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
