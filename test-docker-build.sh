#!/bin/bash
# Test script to validate Docker configuration without full build

set -e

echo "🔍 Testing Docker configuration for PHALA Cloud deployment"
echo "=========================================================="

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Check if Dockerfile exists
echo -e "${BLUE}Test 1: Checking Dockerfile...${NC}"
if [ -f "$PROJECT_ROOT/Dockerfile" ]; then
  echo -e "${GREEN}✓ Dockerfile found${NC}"
else
  echo -e "${RED}✗ Dockerfile not found${NC}"
  exit 1
fi

# Test 2: Check if .dockerignore exists
echo -e "${BLUE}Test 2: Checking .dockerignore...${NC}"
if [ -f "$PROJECT_ROOT/.dockerignore" ]; then
  echo -e "${GREEN}✓ .dockerignore found${NC}"
else
  echo -e "${RED}✗ .dockerignore not found${NC}"
  exit 1
fi

# Test 3: Check if agent-sofia exists
echo -e "${BLUE}Test 3: Checking agent-sofia directory...${NC}"
if [ -d "$PROJECT_ROOT/agent-sofia" ]; then
  echo -e "${GREEN}✓ agent-sofia directory found${NC}"
else
  echo -e "${RED}✗ agent-sofia directory not found${NC}"
  exit 1
fi

# Test 4: Check if .env exists
echo -e "${BLUE}Test 4: Checking agent-sofia/.env...${NC}"
if [ -f "$PROJECT_ROOT/agent-sofia/.env" ]; then
  echo -e "${GREEN}✓ .env file found${NC}"
else
  echo -e "${RED}✗ .env file not found${NC}"
  echo -e "${RED}  Please create agent-sofia/.env from .env.example${NC}"
  exit 1
fi

# Test 5: Check essential files in agent-sofia
echo -e "${BLUE}Test 5: Checking essential agent files...${NC}"
REQUIRED_FILES=(
  "agent-sofia/package.json"
  "agent-sofia/bun.lock"
  "agent-sofia/src"
  "agent-sofia/config"
  "agent-sofia/gaianet"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -e "$PROJECT_ROOT/$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file not found"
    exit 1
  fi
done

# Test 6: Check agent config files
echo -e "${BLUE}Test 6: Checking agent configurations...${NC}"
AGENT_CONFIGS=(
  "agent-sofia/config/SofIA.json"
  "agent-sofia/config/ChatBot.json"
  "agent-sofia/config/ThemeExtractor.json"
  "agent-sofia/config/PulseAgent.json"
  "agent-sofia/config/RecommendationAgent.json"
)

for config in "${AGENT_CONFIGS[@]}"; do
  if [ -f "$PROJECT_ROOT/$config" ]; then
    echo -e "  ${GREEN}✓${NC} $(basename $config)"
  else
    echo -e "  ${RED}✗${NC} $(basename $config) not found"
    exit 1
  fi
done

# Test 7: Validate Dockerfile syntax
echo -e "${BLUE}Test 7: Validating Dockerfile syntax...${NC}"
if docker build --check -f "$PROJECT_ROOT/Dockerfile" "$PROJECT_ROOT" 2>/dev/null; then
  echo -e "${GREEN}✓ Dockerfile syntax is valid${NC}"
else
  # Try alternative validation
  if grep -q "^FROM" "$PROJECT_ROOT/Dockerfile"; then
    echo -e "${GREEN}✓ Dockerfile has valid FROM statement${NC}"
  else
    echo -e "${RED}✗ Dockerfile syntax issue${NC}"
    exit 1
  fi
fi

# Test 8: Check Docker availability
echo -e "${BLUE}Test 8: Checking Docker availability...${NC}"
if command -v docker &> /dev/null; then
  echo -e "${GREEN}✓ Docker is installed${NC}"
  docker --version
else
  echo -e "${RED}✗ Docker is not installed${NC}"
  exit 1
fi

# Test 9: Check gaianet plugin
echo -e "${BLUE}Test 9: Checking gaianet plugin...${NC}"
if [ -d "$PROJECT_ROOT/agent-sofia/gaianet" ]; then
  if [ -f "$PROJECT_ROOT/agent-sofia/gaianet/package.json" ]; then
    echo -e "${GREEN}✓ Gaianet plugin found with package.json${NC}"
  else
    echo -e "${RED}✗ Gaianet plugin package.json not found${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ Gaianet plugin directory not found${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}All tests passed! ✓${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}You can now build the Docker image with:${NC}"
echo "  ./build-docker.sh"
echo ""
echo -e "${BLUE}Or test with docker-compose:${NC}"
echo "  docker-compose build"
echo ""
