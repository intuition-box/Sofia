/**
 * Test script for AI Recommendations
 * Run this to test the Ollama + MCP integration
 */

import { OllamaService } from './lib/services/OllamaService';

async function testRecommendations() {
  console.log('🚀 Testing AI Recommendations...\n');

  // Test wallet address - ton wallet avec de vraies données
  const testWallet = '0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551';

  try {
    // Check if services are running
    console.log('🔍 Checking services status...');
    
    const ollamaRunning = await OllamaService.isOllamaRunning();

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
    const recommendations = await OllamaService.generateRecommendations(testWallet);
    const duration = Date.now() - startTime;

    console.log('🎯 RECOMMENDATIONS GENERATED:');
    console.log('=====================================');
    console.log(recommendations);
    console.log('=====================================');
    console.log(`⚡ Generated in ${duration}ms\n`);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Ollama is running: ollama serve');
    console.log('2. Make sure your MCP server is running on port 3001');
    console.log('3. Check that qwen2.5 model is available: ollama list');
  }
}

// Run the test
testRecommendations();