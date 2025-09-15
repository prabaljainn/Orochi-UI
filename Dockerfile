FROM node:20 as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy the rest of the application
COPY . .

# Build the application with dashboard structure
# Build each language with correct base href
RUN NODE_OPTIONS=--max-old-space-size=5120 npx ng build \
        --configuration production \
        --localize=en \
        --base-href="/dashboard/en/" \
        --deploy-url="/dashboard/en/"

RUN NODE_OPTIONS=--max-old-space-size=5120 npx ng build \
        --configuration production \
        --localize=ja \
        --base-href="/dashboard/ja/" \
        --deploy-url="/dashboard/ja/"

# Organize the build output for the dashboard structure
RUN mkdir -p /app/build/dashboard && \
    if [ -d /app/dist/orochi-ui/en ]; then \
      mv /app/dist/orochi-ui/en /app/build/dashboard/en; \
      echo "✓ Moved English build to dashboard/en"; \
    fi && \
    if [ -d /app/dist/orochi-ui/ja ]; then \
      mv /app/dist/orochi-ui/ja /app/build/dashboard/ja; \
      echo "✓ Moved Japanese build to dashboard/ja"; \
    fi && \
    echo "Build structure ready for /dashboard/en/ URLs"

# NGINX configuration
FROM nginx:alpine

# Copy the built app to nginx html directory with dashboard structure
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration for dashboard structure
COPY nginx-dashboard-structure.conf /etc/nginx/nginx.conf

# Copy any additional nginx files (if needed)
COPY nginx/docker-entry.sh /docker-entry.sh

RUN chmod +x /docker-entry.sh

# Expose port 80
EXPOSE 80

# Use our custom entrypoint script
ENTRYPOINT ["/docker-entry.sh"]
