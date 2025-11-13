#!/usr/bin/env tsx

/**
 * Test script to validate message reception from all 5 agents
 * Tests the corrected senderId filtering logic
 */

import { io, Socket } from 'socket.io-client';

// Configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

const AGENTS = {
  SofIA: {
    name: 'SofIA',
    agentId: '582f4e58-1285-004d-8ef6-1e6301f3d646',
    testMessage: 'Analyze this URL: https://example.com/test'
  },
  Chatbot: {
    name: 'Chatbot',
    agentId: '79c0c83b-2bd2-042f-a534-952c58a1024d',
    testMessage: 'Hello! How are you?'
  },
  ThemeExtractor: {
    name: 'ThemeExtractor',
    agentId: '7dad3d3a-db1a-08a2-9dda-182d98b6cf2b',
    testMessage: 'Extract themes from my browsing history'
  },
  PulseAgent: {
    name: 'PulseAgent',
    agentId: '8afb486a-3c96-0569-b112-4a7f465862b2',
    testMessage: 'Analyze my activity patterns'
  },
  RecommendationAgent: {
    name: 'RecommendationAgent',
    agentId: '92a956b2-ec82-0d31-8fc1-31c9e13836a3',
    testMessage: 'Give me recommendations based on my history'
  }
};

interface TestResult {
  agentName: string;
  channelId: string;
  messageSent: boolean;
  responseReceived: boolean;
  responseText?: string;
  senderId?: string;
  error?: string;
  duration?: number;
}

// Generate deterministic user ID from wallet
function generateUserId(walletAddress: string): string {
  const hash = walletAddress.toLowerCase().split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  const uuid = `${Math.abs(hash).toString(16).padStart(8, '0')}-057e-43cc-a1ef-73de724a332c`;
  return uuid;
}

// Create channel and add agent
async function setupChannel(
  agentName: string,
  agentId: string,
  userId: string
): Promise<string> {
  console.log(`🔧 [${agentName}] Creating channel...`);

  // Create channel
  const channelResponse = await fetch(`${SERVER_URL}/api/messaging/central-channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `DM-${agentName}-Test-${Date.now()}`,
      type: 2, // ChannelType.DM
      server_id: '00000000-0000-0000-0000-000000000000',
      participantCentralUserIds: [userId, agentId],
      metadata: {
        isDm: true,
        user1: userId,
        user2: agentId,
        forAgent: agentId,
        source: 'test-script',
        createdAt: new Date().toISOString()
      }
    })
  });

  if (!channelResponse.ok) {
    throw new Error(`Failed to create channel: ${channelResponse.statusText}`);
  }

  const result = await channelResponse.json();
  const channel = result.data || result;
  const channelId = channel.id;

  console.log(`✅ [${agentName}] Channel created: ${channelId.substring(0, 8)}...`);

  // Add agent to channel
  const addAgentResponse = await fetch(
    `${SERVER_URL}/api/messaging/central-channels/${channelId}/agents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    }
  );

  if (!addAgentResponse.ok) {
    console.warn(`⚠️  [${agentName}] Could not add agent to channel`);
  } else {
    console.log(`✅ [${agentName}] Agent added to channel`);
  }

  return channelId;
}

// Test message exchange with one agent
async function testAgentCommunication(
  agentName: string,
  agentId: string,
  userId: string,
  channelId: string,
  testMessage: string
): Promise<TestResult> {
  const startTime = Date.now();

  return new Promise<TestResult>((resolve) => {
    const result: TestResult = {
      agentName,
      channelId,
      messageSent: false,
      responseReceived: false
    };

    console.log(`\n📡 [${agentName}] Connecting to Socket.IO...`);

    // Connect socket
    const socket: Socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    const timeout = setTimeout(() => {
      console.log(`⏱️  [${agentName}] Timeout waiting for response`);
      result.error = 'Timeout waiting for response';
      socket.disconnect();
      resolve(result);
    }, 15000); // 15 second timeout

    socket.on('connect', () => {
      console.log(`✅ [${agentName}] Socket connected: ${socket.id}`);

      // Send message to agent
      console.log(`📤 [${agentName}] Sending message: "${testMessage}"`);

      const payload = {
        type: 2, // SEND_MESSAGE
        payload: {
          channelId,
          serverId: '00000000-0000-0000-0000-000000000000',
          senderId: userId,
          message: testMessage,
          metadata: {
            source: 'test-script',
            timestamp: Date.now()
          }
        }
      };

      socket.emit('message', payload);
      result.messageSent = true;
      console.log(`✅ [${agentName}] Message sent successfully`);
    });

    socket.on('messageBroadcast', (data: any) => {
      console.log(`📨 [${agentName}] messageBroadcast received:`, {
        channelId: data.channelId,
        senderId: data.senderId,
        senderName: data.senderName,
        expectedAgentId: agentId,
        isFromAgent: data.senderId === agentId,
        textPreview: data.text?.substring(0, 50)
      });

      // ✅ CORRECT FILTERING: Check senderId === agentId
      if (data.channelId === channelId && data.senderId === agentId) {
        console.log(`✅ [${agentName}] AGENT RESPONSE MATCHED!`);
        console.log(`📝 [${agentName}] Response text: ${data.text?.substring(0, 100)}...`);

        result.responseReceived = true;
        result.responseText = data.text;
        result.senderId = data.senderId;
        result.duration = Date.now() - startTime;

        clearTimeout(timeout);
        socket.disconnect();
        resolve(result);
      } else {
        console.log(`⏭️  [${agentName}] Message not from agent (from user or different channel)`);
      }
    });

    socket.on('connect_error', (error: any) => {
      console.error(`❌ [${agentName}] Connection error:`, error.message);
      result.error = `Connection error: ${error.message}`;
      clearTimeout(timeout);
      resolve(result);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 [${agentName}] Socket disconnected: ${reason}`);
    });
  });
}

// Run tests for all agents
async function runTests() {
  console.log('🧪 Starting Message Reception Tests\n');
  console.log('='.repeat(80));
  console.log('');

  const userId = generateUserId(TEST_WALLET);
  console.log(`👤 Test User ID: ${userId}`);
  console.log(`👛 Test Wallet: ${TEST_WALLET}\n`);

  const results: TestResult[] = [];

  try {
    // Test each agent sequentially
    for (const [key, agent] of Object.entries(AGENTS)) {
      console.log('\n' + '='.repeat(80));
      console.log(`🎯 TESTING: ${agent.name}`);
      console.log('='.repeat(80));

      try {
        // Setup channel
        const channelId = await setupChannel(agent.name, agent.agentId, userId);

        // Test communication
        const result = await testAgentCommunication(
          agent.name,
          agent.agentId,
          userId,
          channelId,
          agent.testMessage
        );

        results.push(result);

        // Wait 2 seconds between tests
        console.log(`\n⏸️  Waiting 2 seconds before next test...\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        console.error(`❌ [${agent.name}] Test failed:`, error.message);
        results.push({
          agentName: agent.name,
          channelId: '',
          messageSent: false,
          responseReceived: false,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log('');

    let successCount = 0;
    let failureCount = 0;

    console.log('Agent                  | Channel Created | Message Sent | Response Received | Duration');
    console.log('-'.repeat(90));

    results.forEach(result => {
      const channelStatus = result.channelId ? '✅' : '❌';
      const sentStatus = result.messageSent ? '✅' : '❌';
      const receivedStatus = result.responseReceived ? '✅' : '❌';
      const duration = result.duration ? `${result.duration}ms` : 'N/A';

      console.log(
        `${result.agentName.padEnd(22)} | ${channelStatus}              | ${sentStatus}           | ${receivedStatus}                | ${duration}`
      );

      if (result.responseReceived) {
        successCount++;
      } else {
        failureCount++;
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n' + '-'.repeat(90));
    console.log(`\n✅ Successful: ${successCount}/5`);
    console.log(`❌ Failed:     ${failureCount}/5`);

    // Detailed analysis
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DETAILED ANALYSIS');
    console.log('='.repeat(80));
    console.log('');

    results.forEach(result => {
      if (result.responseReceived) {
        console.log(`✅ ${result.agentName}`);
        console.log(`   Channel ID: ${result.channelId}`);
        console.log(`   Sender ID:  ${result.senderId}`);
        console.log(`   Duration:   ${result.duration}ms`);
        console.log(`   Response:   ${result.responseText?.substring(0, 80)}...`);
        console.log('');
      } else {
        console.log(`❌ ${result.agentName}`);
        console.log(`   Status: ${result.error || 'Unknown error'}`);
        console.log(`   Message sent: ${result.messageSent ? 'Yes' : 'No'}`);
        console.log('');
      }
    });

    // Final verdict
    console.log('='.repeat(80));
    if (successCount === 5) {
      console.log('🎉 ALL TESTS PASSED! All 5 agents are receiving messages correctly.');
    } else if (successCount > 0) {
      console.log(`⚠️  PARTIAL SUCCESS: ${successCount}/5 agents working correctly.`);
    } else {
      console.log('❌ ALL TESTS FAILED: No agents are receiving messages.');
    }
    console.log('='.repeat(80));
    console.log('');

  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:');
    console.error(error);
  }
}

// Run tests
runTests().catch(console.error);
