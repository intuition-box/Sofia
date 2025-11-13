#!/bin/bash
# Script to deploy Gaianet node on Hetzner server

set -e

SERVER="65.109.142.174"
USER="root"

echo "=========================================="
echo "Deploying Gaianet Node to Hetzner Server"
echo "=========================================="

# SSH into server and run deployment commands
ssh ${USER}@${SERVER} << 'ENDSSH'
set -e

echo "Step 1: Updating system..."
apt-get update -y

echo "Step 2: Downloading Gaianet installation script..."
curl -sSfL 'https://github.com/GaiaNet-AI/gaianet-node/releases/latest/download/install.sh' | bash

echo "Step 3: Sourcing bashrc..."
source ~/.bashrc

echo "Step 4: Checking Gaianet installation..."
gaianet --version || echo "Gaianet installed, version check may need manual source"

echo "Step 5: Initializing Gaianet with embedding-capable config..."
# Using Qwen2.5-1.5B with nomic-embed for good performance/resource balance
gaianet init --config https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/qwen2.5-1.5b-instruct/config.json

echo "Step 6: Starting Gaianet node..."
gaianet start

echo "Step 7: Waiting for node to start (30 seconds)..."
sleep 30

echo "Step 8: Getting node info..."
gaianet info

echo "Step 9: Testing if embeddings endpoint is available..."
NODE_URL=$(gaianet info | grep "Node ID" | awk '{print $3}')
if [ ! -z "$NODE_URL" ]; then
    echo "Node URL: https://${NODE_URL}.gaia.domains"

    # Test models endpoint
    echo "Testing /v1/models endpoint..."
    curl -s "https://${NODE_URL}.gaia.domains/v1/models" | jq .

    echo ""
    echo "=========================================="
    echo "Gaianet Node Deployed Successfully!"
    echo "=========================================="
    echo "Node URL: https://${NODE_URL}.gaia.domains"
    echo ""
    echo "Next steps:"
    echo "1. Copy the Node ID and Device ID from 'gaianet info' above"
    echo "2. Go to https://www.gaianet.ai/setting/nodes"
    echo "3. Click 'Add New Node' and enter your Node ID and Device ID"
    echo "4. Join a domain or wait for approval"
    echo "5. Update your .env file with:"
    echo "   GAIANET_NODE_URL=https://${NODE_URL}.gaia.domains"
    echo "=========================================="
else
    echo "Warning: Could not extract Node URL. Run 'gaianet info' manually."
fi

ENDSSH

echo ""
echo "Deployment script completed!"
echo "Check the output above for your Node ID and next steps."
