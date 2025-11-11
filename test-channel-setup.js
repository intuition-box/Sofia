/**
 * Standalone Test Script for ElizaOS Channel Setup
 *
 * Based on: https://github.com/elizaos-plugins/plugin-action-bench/blob/save-prompts-and-test-results/test-scripts/src/core/utils/channel-utils.ts
 *
 * Tests the complete flow:
 * 1. Create channel via /api/messaging/central-channels
 * 2. Add agent to channel via /api/messaging/central-channels/{channelId}/agents
 * 3. Verify entities are created correctly
 *
 * Usage:
 *   node test-channel-setup.js
 *   bun test-channel-setup.js
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Server URL - change to production URL if testing remote
  API_URL: process.env.SOFIA_SERVER_URL || 'http://localhost:3000',

  // User ID - from extension (wallet-based deterministic UUID)
  USER_ID: process.env.USER_ID || 'c89710c9-057e-43cc-a1ef-73de724a332c',

  // Agent ID - SofIA agent from config
  AGENT_ID: process.env.AGENT_ID || '582f4e58-1285-004d-8ef6-1e6301f3d646',

  // Server ID
  SERVER_ID: '00000000-0000-0000-0000-000000000000'
};

// ============================================================================
// UTILITY FUNCTIONS (from ElizaOS official code)
// ============================================================================

/**
 * Create or get a test channel for benchmarking
 * Source: channel-utils.ts lines 17-84
 */
async function createTestChannel(apiUrl, userId, agentId) {
  try {
    const baseUrl = apiUrl.replace('ws://', 'http://').replace('wss://', 'https://');

    console.log('[ChannelUtils] Creating test channel...');
    console.log(`  User ID: ${userId}`);
    console.log(`  Agent ID: ${agentId}`);

    const requestBody = {
      name: `test-dm-${Date.now()}`,
      type: 2, // ChannelType.DM
      server_id: CONFIG.SERVER_ID,
      participantCentralUserIds: [userId, agentId],
      metadata: {
        isDm: true,
        user1: userId,
        user2: agentId,
        forAgent: agentId,
        testChannel: true,
        createdAt: new Date().toISOString(),
      },
    };

    console.log(`[ChannelUtils] Request body:`, JSON.stringify(requestBody, null, 2));

    // Try to create a DM-style channel with both participants
    const createResponse = await fetch(`${baseUrl}/api/messaging/central-channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await createResponse.text();
    console.log(`[ChannelUtils] Create response (${createResponse.status}): ${responseText}`);

    if (createResponse.ok) {
      try {
        const channel = JSON.parse(responseText);
        if (channel && channel.id) {
          console.log(`[ChannelUtils] ✅ Created channel: ${channel.id}`);
          return channel;
        } else if (channel && channel.data && channel.data.id) {
          // Sometimes the response is wrapped in a data property
          console.log(`[ChannelUtils] ✅ Created channel: ${channel.data.id}`);
          return channel.data;
        } else {
          console.error('[ChannelUtils] Created channel but no ID in response');
          return null;
        }
      } catch (parseError) {
        console.error('[ChannelUtils] Failed to parse create response:', parseError);
        return null;
      }
    } else {
      console.error(`[ChannelUtils] Failed to create channel: ${createResponse.status}`);
      return null;
    }
  } catch (error) {
    console.error('[ChannelUtils] Error creating channel:', error);
    return null;
  }
}

/**
 * Get or create a DM channel between two users
 * Source: channel-utils.ts lines 89-148
 */
async function getOrCreateDmChannel(apiUrl, userId, agentId) {
  try {
    const baseUrl = apiUrl.replace('ws://', 'http://').replace('wss://', 'https://');

    // First try to get existing DM channel
    const params = new URLSearchParams({
      currentUserId: userId,
      targetUserId: agentId,
      dmServerId: CONFIG.SERVER_ID,
    });

    console.log('[ChannelUtils] Checking for existing DM channel...');
    console.log(`  URL: ${baseUrl}/api/messaging/dm-channel?${params}`);

    const getResponse = await fetch(`${baseUrl}/api/messaging/dm-channel?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (getResponse.ok) {
      const responseText = await getResponse.text();
      console.log(`[ChannelUtils] DM channel response: ${responseText}`);

      try {
        const response = JSON.parse(responseText);

        // Check if response has data wrapper (API response format)
        if (response && response.success && response.data && response.data.id) {
          const channel = response.data;
          console.log(`[ChannelUtils] ✅ Found existing DM channel: ${channel.id}`);
          return channel;
        } else if (response && response.id) {
          // Direct channel object
          console.log(`[ChannelUtils] ✅ Found existing DM channel: ${response.id}`);
          return response;
        } else {
          console.log('[ChannelUtils] ⚠️ Response missing channel ID, creating new channel');
        }
      } catch (parseError) {
        console.error('[ChannelUtils] Failed to parse response:', parseError);
      }
    } else {
      const errorText = await getResponse.text();
      console.log(`[ChannelUtils] DM channel not found (${getResponse.status}): ${errorText}`);
    }

    // If not found or invalid, create a new one
    console.log('[ChannelUtils] Creating new channel...');
    return await createTestChannel(apiUrl, userId, agentId);
  } catch (error) {
    console.error('[ChannelUtils] Error getting/creating DM channel:', error);
    return null;
  }
}

/**
 * Add an agent to an existing channel
 * Source: channel-utils.ts lines 153-186
 *
 * THIS IS THE KEY FUNCTION - it adds the agent explicitly via the /agents endpoint
 * which triggers entity creation in ElizaOS
 */
async function addAgentToChannel(apiUrl, channelId, agentId) {
  try {
    const baseUrl = apiUrl.replace('ws://', 'http://').replace('wss://', 'https://');

    console.log(`[ChannelUtils] Adding agent ${agentId} to channel ${channelId}...`);

    const response = await fetch(`${baseUrl}/api/messaging/central-channels/${channelId}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: agentId,
      }),
    });

    const responseText = await response.text();
    console.log(`[ChannelUtils] Add agent response (${response.status}): ${responseText}`);

    if (response.ok) {
      console.log(`[ChannelUtils] ✅ Successfully added agent to channel`);
      return true;
    } else {
      console.warn(`[ChannelUtils] Could not add agent: ${response.status} ${responseText}`);
      // Status 409 (Conflict) = agent already exists in channel = OK
      if (response.status === 409) {
        console.log(`[ChannelUtils] ℹ️ Agent already in channel (409 Conflict - this is OK)`);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('[ChannelUtils] Error adding agent to channel:', error);
    return false;
  }
}

/**
 * Ensure a channel exists and has the agent as a participant
 * Source: channel-utils.ts lines 191-206
 *
 * This is the complete flow recommended by ElizaOS
 */
async function ensureChannelWithAgent(apiUrl, userId, agentId) {
  console.log('\n=== Starting ensureChannelWithAgent ===\n');

  // Step 1: Get or create the channel
  const channel = await getOrCreateDmChannel(apiUrl, userId, agentId);

  if (channel) {
    console.log(`\n[ensureChannelWithAgent] Channel ready: ${channel.id}`);

    // Step 2: Try to add the agent (might already be added)
    console.log('\n[ensureChannelWithAgent] Now adding agent to channel...\n');
    const agentAdded = await addAgentToChannel(apiUrl, channel.id, agentId);

    if (agentAdded) {
      console.log('\n=== ✅ SUCCESS: Channel setup complete ===\n');
      return channel;
    } else {
      console.error('\n=== ❌ FAILED: Could not add agent to channel ===\n');
      return null;
    }
  }

  console.error('\n=== ❌ FAILED: Could not create channel ===\n');
  return null;
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

async function runTest() {
  console.log('============================================================');
  console.log('ElizaOS Channel Setup Test');
  console.log('============================================================\n');

  console.log('Configuration:');
  console.log(`  API URL: ${CONFIG.API_URL}`);
  console.log(`  User ID: ${CONFIG.USER_ID}`);
  console.log(`  Agent ID: ${CONFIG.AGENT_ID}`);
  console.log(`  Server ID: ${CONFIG.SERVER_ID}`);
  console.log('\n============================================================\n');

  try {
    // Run the complete flow
    const channel = await ensureChannelWithAgent(
      CONFIG.API_URL,
      CONFIG.USER_ID,
      CONFIG.AGENT_ID
    );

    if (channel) {
      console.log('============================================================');
      console.log('TEST RESULT: ✅ SUCCESS');
      console.log('============================================================');
      console.log('\nChannel Info:');
      console.log(JSON.stringify(channel, null, 2));
      console.log('\n============================================================');
      console.log('Next Steps:');
      console.log('  1. Check server logs for "Agent added to channel"');
      console.log('  2. Verify no "no entity" warnings appear');
      console.log('  3. Test sending messages via Socket.IO');
      console.log('============================================================\n');
      process.exit(0);
    } else {
      console.error('============================================================');
      console.error('TEST RESULT: ❌ FAILED');
      console.error('============================================================');
      console.error('\nChannel setup failed. Check the logs above for details.\n');
      console.error('============================================================\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('============================================================');
    console.error('TEST RESULT: ❌ ERROR');
    console.error('============================================================');
    console.error('\nUnexpected error during test:');
    console.error(error);
    console.error('\n============================================================\n');
    process.exit(1);
  }
}

// ============================================================================
// RUN TEST
// ============================================================================

console.log('\nStarting test in 2 seconds...\n');
setTimeout(runTest, 2000);
