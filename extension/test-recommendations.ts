/**
 * Test script for AI Recommendations
 * Run this to test the new simplified AI architecture
 */

import { RecommendationService } from './lib/services/ai/RecommendationService';
import { OllamaClient } from './lib/services/ai/OllamaClient';

async function testRecommendations() {
  console.log('🚀 Testing AI Recommendations...\n');

  // Test wallet address - your wallet with real data
  const testWallet = '0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551';

  try {
    // Check if services are running
    console.log('🔍 Checking services status...');
    
    const ollamaRunning = await OllamaClient.isAvailable();

    console.log(`- Ollama: ${ollamaRunning ? '✅ Running' : '❌ Not running'}`);
    console.log(`- Sofia GraphQL: ✅ Ready (using Intuition testnet)\n`);

    if (!ollamaRunning) {
      console.error('❌ Ollama is not running. Please start Ollama first:');
      console.log('   ollama serve');
      return;
    }

    // Test recommendations generation
    console.log(`📊 Generating recommendations for wallet: ${testWallet}`);
    console.log('⏳ This may take a few seconds...\n');

    const startTime = Date.now();
    const recommendations = await RecommendationService.generateRecommendations(testWallet);
    const duration = Date.now() - startTime;

    console.log('🎯 RECOMMENDATIONS GENERATED:');
    console.log('=====================================');
    console.log(`Found ${recommendations.length} recommendation categories:`);
    recommendations.forEach((rec, i) => {
      console.log(`\n${i + 1}. ${rec.category}`);
      console.log(`   Reason: ${rec.reason}`);
      console.log(`   Suggestions: ${rec.suggestions.length} items`);
      rec.suggestions.forEach((sug, j) => {
        console.log(`     ${j + 1}. ${sug.name} - ${sug.url}`);
      });
    });
    console.log('=====================================');
    console.log(`⚡ Generated in ${duration}ms\n`);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Ollama is running: ollama serve');
    console.log('2. Make sure llama3 model is available: ollama list');
    console.log('3. Check browser extension background script console');
  }
}

// Run the test
testRecommendations();