/**
 * Utility to clear stored agent channels from IndexedDB
 * Use this when you reset the ElizaOS database
 */

import { sofiaDB, STORES } from './indexedDB';

export async function clearAllChannels(): Promise<void> {
  try {
    console.log('🧹 Clearing all agent channels from IndexedDB...');

    const tx = sofiaDB.transaction(STORES.AGENT_CHANNELS, 'readwrite');
    await tx.store.clear();
    await tx.done;

    console.log('✅ All agent channels cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing channels:', error);
    throw error;
  }
}

export async function clearChannelForAgent(walletAddress: string, agentName: string): Promise<void> {
  try {
    console.log(`🧹 Clearing channel for ${agentName}...`);

    const key = `${walletAddress}:${agentName}`;
    await sofiaDB.delete(STORES.AGENT_CHANNELS, key);

    console.log(`✅ Channel for ${agentName} cleared successfully`);
  } catch (error) {
    console.error(`❌ Error clearing channel for ${agentName}:`, error);
    throw error;
  }
}

export async function listAllChannels(): Promise<void> {
  try {
    const channels = await sofiaDB.getAll(STORES.AGENT_CHANNELS);

    console.log('📊 Stored Channels:');
    if (channels.length === 0) {
      console.log('   (none)');
    } else {
      channels.forEach(record => {
        console.log(`   ${record.agentName} (${record.walletAddress}): ${record.channelId}`);
        console.log(`      Created: ${new Date(record.createdAt).toLocaleString()}`);
        console.log(`      Last used: ${new Date(record.lastUsed).toLocaleString()}`);
      });
    }

    return;
  } catch (error) {
    console.error('❌ Error listing channels:', error);
  }
}

// Pour utiliser dans la console Chrome
(window as any).clearAllChannels = clearAllChannels;
(window as any).listAllChannels = listAllChannels;
(window as any).clearChannelForAgent = clearChannelForAgent;
