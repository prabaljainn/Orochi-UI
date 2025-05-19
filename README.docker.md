# Docker Deployment for Orochi UI

This document provides instructions for building and deploying the Orochi UI application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (optional, for local development)

## Build Docker Image Locally

To build the Docker image locally:

```bash
# Navigate to project root
cd /path/to/orochi-ui

# Build the Docker image
docker build -t orochi-ui:latest .
```

## Run Docker Container Locally

Once the image is built, you can run it locally:

```bash
# Run the container
docker run -d -p 80:80 --name orochi-ui orochi-ui:latest
```

The application will be available at http://localhost:80

## Deploy to a Docker Registry

To deploy to a Docker registry:

```bash
# Tag your image for the registry
docker tag orochi-ui:latest your-registry.com/orochi-ui:latest

# Login to your Docker registry
docker login -u username -p password your-registry.com

# Push the image to the registry
docker push your-registry.com/orochi-ui:latest
```

## Deploy to a Kubernetes Cluster

For Kubernetes deployment, a basic deployment YAML:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orochi-ui
spec:
  replicas: 2
  selector:
    matchLabels:
      app: orochi-ui
  template:
    metadata:
      labels:
        app: orochi-ui
    spec:
      containers:
      - name: orochi-ui
        image: your-registry.com/orochi-ui:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: orochi-ui-service
spec:
  selector:
    app: orochi-ui
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

Save this to `kubernetes-deployment.yaml` and apply with:

```bash
kubectl apply -f kubernetes-deployment.yaml
```

## CI/CD with BitBucket Pipelines

A BitBucket Pipelines configuration is included in this repository. To use it:

1. Set up the following environment variables in your BitBucket repository settings:
   - `DOCKER_REGISTRY`: Your Docker registry URL
   - `DOCKER_USERNAME`: Your Docker registry username
   - `DOCKER_PASSWORD`: Your Docker registry password

2. Push your code to trigger the pipeline, which will:
   - Build and test your Angular application
   - Build the Docker image
   - Deploy to the appropriate environment based on the branch

## Local Development with Docker Compose

For local development, create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  orochi-ui:
    build:
      context: .
    ports:
      - "80:80"
    volumes:
      - ./src:/app/src
    command: npm run start
```

Then run:

```bash
docker-compose up
``` 
