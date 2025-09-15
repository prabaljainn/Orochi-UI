FROM node:20 as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy the rest of the application
COPY . .

# Build the application with dashboard structure using the build script
RUN chmod +x build-dashboard-structure.sh && ./build-dashboard-structure.sh

# Create build directory for Docker with correct structure
RUN mkdir -p /app/build && \
    cp -r /app/dist/orochi-ui/* /app/build/ && \
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
