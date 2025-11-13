#!/bin/bash
# Script pour tester l'image Docker localement avant déploiement PHALA

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CONTAINER_NAME="sofia-test"
IMAGE_NAME="sofia-agent:latest"
PORT=3000

echo -e "${BLUE}🧪 Testing Sofia Agent Docker Image Locally${NC}"
echo "=============================================="
echo ""

# Clean up any existing test container
echo -e "${BLUE}Cleaning up existing test container...${NC}"
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup done${NC}"
echo ""

# Run the container
echo -e "${BLUE}Starting container...${NC}"
docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${PORT}:${PORT} \
  ${IMAGE_NAME}

echo -e "${GREEN}✓ Container started${NC}"
echo ""

# Wait a bit for startup
echo -e "${BLUE}Waiting 10 seconds for agents to initialize...${NC}"
sleep 10

# Show logs
echo -e "${BLUE}Container logs (first 50 lines):${NC}"
echo "----------------------------------------"
docker logs ${CONTAINER_NAME} 2>&1 | head -50
echo "----------------------------------------"
echo ""

# Check if container is running
if docker ps | grep -q ${CONTAINER_NAME}; then
  echo -e "${GREEN}✓ Container is running${NC}"
else
  echo -e "${RED}✗ Container is not running${NC}"
  echo -e "${YELLOW}Full logs:${NC}"
  docker logs ${CONTAINER_NAME}
  exit 1
fi

# Test HTTP endpoint
echo -e "${BLUE}Testing HTTP endpoint...${NC}"
sleep 5
if curl -f http://localhost:${PORT} -m 5 2>/dev/null; then
  echo -e "${GREEN}✓ HTTP endpoint responds${NC}"
else
  echo -e "${YELLOW}⚠ HTTP endpoint not responding (might be normal if no HTTP routes defined)${NC}"
fi
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Test completed!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "${BLUE}1. Watch logs in real-time:${NC}"
echo "   docker logs -f ${CONTAINER_NAME}"
echo ""
echo -e "${BLUE}2. Check all 5 agents started:${NC}"
echo "   Look for these lines in logs:"
echo "   - Agent SofIA started"
echo "   - Agent ChatBot started"
echo "   - Agent ThemeExtractor started"
echo "   - Agent PulseAgent started"
echo "   - Agent RecommendationAgent started"
echo ""
echo -e "${BLUE}3. Stop the test container:${NC}"
echo "   docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}"
echo ""
echo -e "${BLUE}4. If everything works, push to registry:${NC}"
echo "   docker tag ${IMAGE_NAME} <your-dockerhub-username>/sofia-agent:latest"
echo "   docker push <your-dockerhub-username>/sofia-agent:latest"
echo ""
