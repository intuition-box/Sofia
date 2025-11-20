#!/usr/bin/env bun

/**
 * 📊 SofIA Workload Calculator - VERSION SIMPLE
 *
 * Ce script prend vos métriques Dash0 et calcule les besoins pour 20/50/100 users
 */

console.log('\n🚀 SofIA Workload Calculator\n');
console.log('='.repeat(70));

// ============================================
// ÉTAPE 1: ENTREZ VOS DONNÉES ICI
// ============================================

const TEST_DURATION_HOURS = 24; // Test sur 24 heures

// 👇 REMPLACEZ CES VALEURS PAR VOS DONNÉES RÉELLES DE DASH0
const MY_METRICS = {
  // Nombre total de messages WebSocket reçus par les agents
  totalMessages: 0,  // ← À remplir depuis Dash0: sofia.messages.received

  // Nombre total de requêtes LLM (Gaianet)
  totalLLMRequests: 0,  // ← À remplir depuis Dash0: sofia.llm.requests

  // Tokens utilisés
  totalInputTokens: 0,   // ← À remplir depuis Dash0: sofia.llm.tokens.input
  totalOutputTokens: 0,  // ← À remplir depuis Dash0: sofia.llm.tokens.output

  // Temps de réponse moyen (en millisecondes)
  avgResponseTime: 0,  // ← À remplir depuis Dash0: sofia.message.processing.duration (moyenne)
};

// ============================================
// CALCULS AUTOMATIQUES
// ============================================

console.log('\n📋 VOS DONNÉES (1 utilisateur sur 24h)\n');
console.log(`Messages totaux:           ${MY_METRICS.totalMessages}`);
console.log(`Requêtes LLM:              ${MY_METRICS.totalLLMRequests}`);
console.log(`Input tokens:              ${MY_METRICS.totalInputTokens}`);
console.log(`Output tokens:             ${MY_METRICS.totalOutputTokens}`);
console.log(`Temps de réponse moyen:    ${MY_METRICS.avgResponseTime}ms`);

// Calculs de base
const messagesPerHour = MY_METRICS.totalMessages / TEST_DURATION_HOURS;
const llmRequestsPerHour = MY_METRICS.totalLLMRequests / TEST_DURATION_HOURS;
const tokensPerRequest = (MY_METRICS.totalInputTokens + MY_METRICS.totalOutputTokens) / MY_METRICS.totalLLMRequests;

console.log(`\nPar heure:`);
console.log(`  Messages/h:              ${messagesPerHour.toFixed(1)}`);
console.log(`  Requêtes LLM/h:          ${llmRequestsPerHour.toFixed(1)}`);
console.log(`  Tokens par requête:      ${tokensPerRequest.toFixed(0)}`);

// ============================================
// PROJECTIONS POUR 20, 50, 100 USERS
// ============================================

function calculateForUsers(userCount: number) {
  // Facteur de concurrence: on assume que 15% des users sont actifs en même temps
  const activeConcurrency = 0.15;
  const activeUsers = Math.ceil(userCount * activeConcurrency);

  // Projections horaires (basées sur users actifs)
  const messagesHour = messagesPerHour * activeUsers;
  const llmRequestsHour = llmRequestsPerHour * activeUsers;
  const tokensHour = tokensPerRequest * llmRequestsHour;

  // Projections journalières
  const messagesDay = messagesHour * 24;
  const llmRequestsDay = llmRequestsHour * 24;
  const tokensDay = tokensHour * 24;

  // Projections mensuelles (30 jours)
  const messagesMonth = messagesDay * 30;
  const llmRequestsMonth = llmRequestsDay * 30;
  const tokensMonth = tokensDay * 30;

  // Besoins infrastructure
  const requestsPerSecond = llmRequestsHour / 3600;
  const tokensPerSecond = tokensHour / 3600;

  // Estimation GPU (1 GPU = ~100 req/s pour Llama-7B)
  const gpusNeeded = Math.ceil(requestsPerSecond / 100) || 1;

  return {
    userCount,
    activeUsers,
    messagesHour: Math.round(messagesHour),
    llmRequestsHour: Math.round(llmRequestsHour),
    tokensHour: Math.round(tokensHour),
    messagesDay: Math.round(messagesDay),
    llmRequestsDay: Math.round(llmRequestsDay),
    tokensDay: Math.round(tokensDay),
    messagesMonth: Math.round(messagesMonth),
    llmRequestsMonth: Math.round(llmRequestsMonth),
    tokensMonth: Math.round(tokensMonth),
    requestsPerSecond: requestsPerSecond.toFixed(2),
    tokensPerSecond: tokensPerSecond.toFixed(2),
    gpusNeeded,
  };
}

console.log('\n\n🎯 PROJECTIONS\n');
console.log('='.repeat(70));

[20, 50, 100].forEach(userCount => {
  const results = calculateForUsers(userCount);

  console.log(`\n📊 ${userCount} UTILISATEURS`);
  console.log(`   Users actifs simultanément:    ${results.activeUsers}`);
  console.log(`
   PAR HEURE:`);
  console.log(`   Messages:                      ${results.messagesHour.toLocaleString()}`);
  console.log(`   Requêtes LLM:                  ${results.llmRequestsHour.toLocaleString()}`);
  console.log(`   Tokens:                        ${results.tokensHour.toLocaleString()}`);
  console.log(`
   PAR JOUR (24h):`);
  console.log(`   Messages:                      ${results.messagesDay.toLocaleString()}`);
  console.log(`   Requêtes LLM:                  ${results.llmRequestsDay.toLocaleString()}`);
  console.log(`   Tokens:                        ${results.tokensDay.toLocaleString()}`);
  console.log(`
   PAR MOIS (30j):`);
  console.log(`   Messages:                      ${results.messagesMonth.toLocaleString()}`);
  console.log(`   Requêtes LLM:                  ${results.llmRequestsMonth.toLocaleString()}`);
  console.log(`   Tokens:                        ${results.tokensMonth.toLocaleString()}`);
  console.log(`
   INFRASTRUCTURE GAIANET:`);
  console.log(`   Requêtes/seconde:              ${results.requestsPerSecond}`);
  console.log(`   Tokens/seconde:                ${results.tokensPerSecond}`);
  console.log(`   GPUs nécessaires:              ${results.gpusNeeded} GPU(s)`);
  console.log(`   RAM estimée:                   ${results.gpusNeeded * 16 + 32} GB`);
  console.log(`   VRAM estimée:                  ${results.gpusNeeded * 16} GB`);
});

console.log('\n\n💡 RECOMMANDATIONS\n');
console.log('='.repeat(70));
console.log(`
Pour votre discussion avec Gaianet, demandez:

1. Configuration pour démarrer (20 users):
   - Modèle: Llama-7B (plus rapide) ou Llama-13B (meilleure qualité)
   - Setup: ${calculateForUsers(20).gpusNeeded} GPU(s)
   - Latence cible: <2000ms (P95)

2. Plan de scaling (50-100 users):
   - Auto-scaling basé sur la charge
   - Ajout de GPUs à la demande

3. Optimisations possibles:
   - vLLM pour meilleure performance
   - Quantization (INT8) pour 2x le throughput
   - KV cache pour contextes répétés
`);

console.log('='.repeat(70));
console.log(`\n✅ Calcul terminé - ${new Date().toLocaleString()}\n`);

// ============================================
// EXPORT JSON (optionnel)
// ============================================

const exportData = {
  timestamp: new Date().toISOString(),
  testDuration: `${TEST_DURATION_HOURS} hours`,
  baselineMetrics: MY_METRICS,
  projections: {
    users20: calculateForUsers(20),
    users50: calculateForUsers(50),
    users100: calculateForUsers(100),
  }
};

// Sauvegarder dans reports/
const fs = require('fs');
const path = require('path');
const outputPath = path.join(__dirname, '../reports/workload-calculation.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

console.log(`📄 Rapport JSON sauvegardé: ${outputPath}\n`);
