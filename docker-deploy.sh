#!/bin/bash

# Orochi UI Docker Build & Deploy Script
# A simple script to build and push Docker images directly from your Mac

set -e

# Configuration - edit these variables
REGISTRY=${REGISTRY:-"docker.io"} # Use docker.io for Docker Hub
USERNAME=${DOCKER_USERNAME:-"yourusername"} # Your Docker Hub username
IMAGE_NAME="orochi-ui"
TAG=${TAG:-"latest"}
FULL_IMAGE_NAME="$USERNAME/$IMAGE_NAME:$TAG"

echo "Orochi UI Docker Deploy"
echo "======================="
echo "Will build and push: $FULL_IMAGE_NAME"
echo ""

# Build the application
echo "Building Angular application..."
npm install --force
npm run build

# Build Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME:$TAG .
docker tag $IMAGE_NAME:$TAG $FULL_IMAGE_NAME

# Docker login
if [ -z "$DOCKER_PASSWORD" ]; then
  echo "Please login to Docker:"
  docker login -u $USERNAME $REGISTRY
else
  echo "Logging in to Docker registry..."
  docker login -u $USERNAME -p $DOCKER_PASSWORD $REGISTRY
fi

# Push image
echo "Pushing image to registry..."
docker push $FULL_IMAGE_NAME
echo "Image pushed successfully!"

echo ""
echo "Deployment complete!"
echo "Image is available at: $FULL_IMAGE_NAME"
