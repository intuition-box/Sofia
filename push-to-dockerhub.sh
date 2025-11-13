#!/bin/bash
# Script pour pousser l'image sur Docker Hub

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

IMAGE_NAME="sofia-agent"
LOCAL_TAG="latest"

echo -e "${BLUE}📦 Pushing Sofia Agent to Docker Hub${NC}"
echo "======================================"
echo ""

# Check if DOCKERHUB_USERNAME is set
if [ -z "$DOCKERHUB_USERNAME" ]; then
  echo -e "${YELLOW}DOCKERHUB_USERNAME not set in environment${NC}"
  echo -n "Enter your Docker Hub username: "
  read DOCKERHUB_USERNAME

  if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo -e "${RED}Error: Docker Hub username is required${NC}"
    exit 1
  fi
fi

# Ask for version tag
echo -e "${BLUE}Current local image: ${IMAGE_NAME}:${LOCAL_TAG}${NC}"
echo -n "Enter version tag (default: latest): "
read VERSION_TAG
VERSION_TAG=${VERSION_TAG:-latest}

REMOTE_IMAGE="${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}"

echo ""
echo -e "${BLUE}Step 1: Checking if logged in to Docker Hub...${NC}"
if docker info 2>/dev/null | grep -q "Username: ${DOCKERHUB_USERNAME}"; then
  echo -e "${GREEN}✓ Already logged in as ${DOCKERHUB_USERNAME}${NC}"
else
  echo -e "${YELLOW}Not logged in. Please login to Docker Hub:${NC}"
  docker login
fi
echo ""

echo -e "${BLUE}Step 2: Tagging image...${NC}"
docker tag ${IMAGE_NAME}:${LOCAL_TAG} ${REMOTE_IMAGE}
echo -e "${GREEN}✓ Tagged as ${REMOTE_IMAGE}${NC}"
echo ""

# Also tag as latest if not already
if [ "$VERSION_TAG" != "latest" ]; then
  echo -e "${BLUE}Step 3: Also tagging as latest...${NC}"
  docker tag ${IMAGE_NAME}:${LOCAL_TAG} ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
  echo -e "${GREEN}✓ Tagged as ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest${NC}"
  echo ""
fi

echo -e "${BLUE}Step 4: Pushing to Docker Hub...${NC}"
echo -e "${YELLOW}This may take several minutes (image size: ~1.94GB)${NC}"
docker push ${REMOTE_IMAGE}
echo -e "${GREEN}✓ Pushed ${REMOTE_IMAGE}${NC}"
echo ""

# Push latest tag too
if [ "$VERSION_TAG" != "latest" ]; then
  echo -e "${BLUE}Step 5: Pushing latest tag...${NC}"
  docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
  echo -e "${GREEN}✓ Pushed ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest${NC}"
  echo ""
fi

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ Push completed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}Your image is now available at:${NC}"
echo "  ${REMOTE_IMAGE}"
if [ "$VERSION_TAG" != "latest" ]; then
  echo "  ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
fi
echo ""
echo -e "${BLUE}Docker Hub URL:${NC}"
echo "  https://hub.docker.com/r/${DOCKERHUB_USERNAME}/${IMAGE_NAME}"
echo ""
echo -e "${YELLOW}Next: Deploy to PHALA Cloud${NC}"
echo "1. Go to https://cloud.phala.network/"
echo "2. Create new deployment"
echo "3. Use image: ${REMOTE_IMAGE}"
echo "4. Set port: 3000"
echo "5. Add environment variables from agent-sofia/.env"
echo "6. Resources: 2 vCPU, 4 GB RAM minimum"
echo "7. Deploy!"
echo ""
