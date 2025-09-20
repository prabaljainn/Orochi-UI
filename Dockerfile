FROM node:20 as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy the rest of the application
COPY . .

# Build the application with dashboard structure using the simple build script
RUN chmod +x build-dashboard.sh && ./build-dashboard.sh

# Create build directory for Docker
RUN mkdir -p /app/build && \
    cp -r /app/dist/* /app/build/ && \
    echo "Build structure ready for /dashboard/en/ URLs"

# NGINX configuration
FROM nginx:alpine

# Copy the built app to nginx html directory with dashboard structure
COPY --from=build /app/build /usr/share/nginx/html

# Copy the simple dashboard nginx configuration
COPY nginx-dashboard-structure.conf /nginx-dashboard-structure.conf

# Copy the docker entry script
COPY nginx/docker-entry.sh /docker-entry.sh

RUN chmod +x /docker-entry.sh

# Expose port 80
EXPOSE 80

# Use our custom entrypoint script
ENTRYPOINT ["/docker-entry.sh"]
