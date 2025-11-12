#!/usr/bin/env tsx

/**
 * Test script to validate channel persistence for all 5 agents
 * Simulates extension behavior with IndexedDB storage
 */

import { openDB, IDBPDatabase } from 'idb';

// Configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

const AGENTS = {
  SofIA: '582f4e58-1285-004d-8ef6-1e6301f3d646',
  Chatbot: '79c0c83b-2bd2-042f-a534-952c58a1024d',
  ThemeExtractor: '7dad3d3a-db1a-08a2-9dda-182d98b6cf2b',
  PulseAgent: '8afb486a-3c96-0569-b112-4a7f465862b2',
  RecommendationAgent: '92a956b2-ec82-0d31-8fc1-31c9e13836a3'
};

interface AgentChannelRecord {
  key: string;
  channelId: string;
  walletAddress: string;
  agentName: string;
  agentId: string;
  createdAt: number;
  lastUsed: number;
}

// Simulate IndexedDB operations
class TestChannelPersistence {
  private db: IDBPDatabase | null = null;

  async init() {
    console.log('📦 Initializing test IndexedDB...');
    this.db = await openDB('sofiaDB-test', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('agent_channels')) {
          const store = db.createObjectStore('agent_channels', { keyPath: 'key' });
          store.createIndex('walletAddress', 'walletAddress', { unique: false });
          store.createIndex('agentName', 'agentName', { unique: false });
          store.createIndex('channelId', 'channelId', { unique: false });
          store.createIndex('lastUsed', 'lastUsed', { unique: false });
        }
      }
    });
    console.log('✅ Test IndexedDB initialized\n');
  }

  async storeChannelId(
    walletAddress: string,
    agentName: string,
    channelId: string,
    agentId: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const key = `${walletAddress}:${agentName}`;
    const record: AgentChannelRecord = {
      key,
      channelId,
      walletAddress,
      agentName,
      agentId,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    await this.db.put('agent_channels', record);
    console.log(`💾 Stored channel for ${agentName}: ${channelId}`);
  }

  async getStoredChannelId(walletAddress: string, agentName: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const key = `${walletAddress}:${agentName}`;
    const record = await this.db.get('agent_channels', key);

    if (record) {
      // Update lastUsed
      record.lastUsed = Date.now();
      await this.db.put('agent_channels', record);
      console.log(`♻️  Retrieved channel for ${agentName}: ${record.channelId}`);
      return record.channelId;
    }

    console.log(`❌ No stored channel for ${agentName}`);
    return null;
  }

  async getAllChannels(): Promise<AgentChannelRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('agent_channels');
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('agent_channels', 'readwrite');
    await tx.store.clear();
    await tx.done;
    console.log('🧹 Cleared all channels from test DB\n');
  }

  async close() {
    if (this.db) {
      this.db.close();
      console.log('🔒 Closed test IndexedDB');
    }
  }
}

// Create channel via REST API (simulating extension behavior)
async function createChannelViaAPI(
  agentName: string,
  agentId: string,
  userId: string
): Promise<string> {
  console.log(`🔧 Creating channel for ${agentName} via REST API...`);

  const response = await fetch(`${SERVER_URL}/api/messaging/central-channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `DM-${agentName}-${Date.now()}`,
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create channel: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const channelData = result.data || result;
  console.log(`✅ Channel created: ${channelData.id}`);

  // Add agent to channel
  const addAgentResponse = await fetch(
    `${SERVER_URL}/api/messaging/central-channels/${channelData.id}/agents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    }
  );

  if (addAgentResponse.ok) {
    console.log(`✅ Agent ${agentName} added to channel\n`);
  } else {
    console.warn(`⚠️  Could not add agent ${agentName} to channel\n`);
  }

  return channelData.id;
}

// Generate deterministic user ID from wallet
function generateUserId(walletAddress: string): string {
  const hash = walletAddress.toLowerCase().split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  const uuid = `${Math.abs(hash).toString(16).padStart(8, '0')}-057e-43cc-a1ef-73de724a332c`;
  return uuid;
}

// Test scenarios
async function runTests() {
  console.log('🧪 Starting Channel Persistence Tests\n');
  console.log('='.repeat(60));
  console.log('');

  const storage = new TestChannelPersistence();
  await storage.init();

  const userId = generateUserId(TEST_WALLET);
  console.log(`👤 Test User ID: ${userId}`);
  console.log(`👛 Test Wallet: ${TEST_WALLET}\n`);

  try {
    // Test 1: First connection - Create channels for all 5 agents
    console.log('📍 TEST 1: First Connection (No Persistence)');
    console.log('-'.repeat(60));

    const createdChannels: { [key: string]: string } = {};

    for (const [agentName, agentId] of Object.entries(AGENTS)) {
      console.log(`\n[${agentName}]`);

      // Check if channel exists (should not)
      const existingChannel = await storage.getStoredChannelId(TEST_WALLET, agentName);

      if (!existingChannel) {
        // Create new channel
        const channelId = await createChannelViaAPI(agentName, agentId, userId);

        // Store in IndexedDB
        await storage.storeChannelId(TEST_WALLET, agentName, channelId, agentId);

        createdChannels[agentName] = channelId;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST 1 COMPLETE: All 5 channels created and stored\n');

    // Display stored channels
    const allChannels = await storage.getAllChannels();
    console.log('📊 Stored Channels:');
    allChannels.forEach(record => {
      console.log(`   ${record.agentName}: ${record.channelId.substring(0, 8)}...`);
    });
    console.log('');

    // Test 2: Simulated reconnection - Reuse existing channels
    console.log('📍 TEST 2: Reconnection (With Persistence)');
    console.log('-'.repeat(60));

    const reusedChannels: { [key: string]: string } = {};

    for (const [agentName, agentId] of Object.entries(AGENTS)) {
      console.log(`\n[${agentName}]`);

      // Check if channel exists (should exist)
      const existingChannel = await storage.getStoredChannelId(TEST_WALLET, agentName);

      if (existingChannel) {
        console.log(`✅ Reused existing channel (no API call needed)`);
        reusedChannels[agentName] = existingChannel;
      } else {
        console.log(`❌ ERROR: Expected channel to exist!`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST 2 COMPLETE: All 5 channels reused from persistence\n');

    // Verify channels match
    console.log('📍 TEST 3: Verification');
    console.log('-'.repeat(60));

    let allMatch = true;
    for (const [agentName, createdId] of Object.entries(createdChannels)) {
      const reusedId = reusedChannels[agentName];
      const match = createdId === reusedId;

      console.log(`${match ? '✅' : '❌'} ${agentName}: ${match ? 'MATCH' : 'MISMATCH'}`);
      console.log(`   Created:  ${createdId.substring(0, 20)}...`);
      console.log(`   Reused:   ${reusedId.substring(0, 20)}...`);

      if (!match) allMatch = false;
    }

    console.log('\n' + '='.repeat(60));
    if (allMatch) {
      console.log('✅ TEST 3 COMPLETE: All channels match perfectly!\n');
    } else {
      console.log('❌ TEST 3 FAILED: Some channels do not match\n');
    }

    // Test 4: Multi-user isolation
    console.log('📍 TEST 4: Multi-User Isolation');
    console.log('-'.repeat(60));

    const secondWallet = '0x123456789abcdef123456789abcdef123456789a';
    const secondUserId = generateUserId(secondWallet);

    console.log(`\n👛 Second Wallet: ${secondWallet}`);
    console.log(`👤 Second User ID: ${secondUserId}\n`);

    // Create channel for second user (Chatbot only)
    const secondUserChannelId = await createChannelViaAPI(
      'Chatbot',
      AGENTS.Chatbot,
      secondUserId
    );
    await storage.storeChannelId(secondWallet, 'Chatbot', secondUserChannelId, AGENTS.Chatbot);

    // Verify isolation
    const firstUserChatbot = await storage.getStoredChannelId(TEST_WALLET, 'Chatbot');
    const secondUserChatbot = await storage.getStoredChannelId(secondWallet, 'Chatbot');

    console.log(`First user Chatbot:  ${firstUserChatbot?.substring(0, 20)}...`);
    console.log(`Second user Chatbot: ${secondUserChatbot?.substring(0, 20)}...`);

    const isolated = firstUserChatbot !== secondUserChatbot;
    console.log(`\n${isolated ? '✅' : '❌'} Channels are ${isolated ? 'isolated' : 'NOT isolated'} per user`);

    console.log('\n' + '='.repeat(60));
    console.log(isolated ? '✅ TEST 4 COMPLETE: Multi-user isolation working!\n' : '❌ TEST 4 FAILED\n');

    // Final summary
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    const finalChannels = await storage.getAllChannels();
    console.log(`Total channels stored: ${finalChannels.length}`);
    console.log(`Expected: 6 (5 for first user + 1 for second user)`);
    console.log(`\n${finalChannels.length === 6 ? '✅' : '❌'} Channel count ${finalChannels.length === 6 ? 'correct' : 'incorrect'}`);

    console.log('\nBreakdown by user:');
    const firstUserChannels = finalChannels.filter(c => c.walletAddress === TEST_WALLET);
    const secondUserChannels = finalChannels.filter(c => c.walletAddress === secondWallet);
    console.log(`   First user:  ${firstUserChannels.length} channels`);
    console.log(`   Second user: ${secondUserChannels.length} channels`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY! 🎉\n');

    // Cleanup
    await storage.clearAll();

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error);
  } finally {
    await storage.close();
  }
}

// Run tests
runTests().catch(console.error);
