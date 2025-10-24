#!/bin/bash
set -e

echo "🚀 Starting Sofia Agent Server"
echo "==============================="

cd /app/agent

# Use the local elizaos binary
ELIZAOS="./node_modules/.bin/elizaos"

# Start ElizaOS server first
echo "Starting ElizaOS server..."
$ELIZAOS start &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to initialize..."
sleep 10

# Add each agent to the running server
echo "Adding SofIA agent..."
$ELIZAOS agent start --path config/SofIA.json
sleep 2

echo "Adding ChatBot agent..."
$ELIZAOS agent start --path config/ChatBot.json
sleep 2

echo "Adding ThemeExtractor agent..."
$ELIZAOS agent start --path config/ThemeExtractor.json
sleep 2

echo "Adding PulseAgent..."
$ELIZAOS agent start --path config/PulseAgent.json
sleep 2

echo "Adding RecommendationAgent..."
$ELIZAOS agent start --path config/RecommendationAgent.json
sleep 2

echo ""
echo "✅ All 4 agents added to ElizaOS server"
echo "   Server PID: $SERVER_PID"
echo ""

# Wait for server process (keeps container running)
wait $SERVER_PID
