FROM node:20 as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Determine the correct build output directory
RUN if [ -d /app/dist/orochi-ui ]; then \
      echo "Using /app/dist/orochi-ui"; \
      mkdir -p /app/build; \
      cp -r /app/dist/orochi-ui/* /app/build/; \
    elif [ -d /app/dist ]; then \
      echo "Using /app/dist"; \
      mkdir -p /app/build; \
      cp -r /app/dist/* /app/build/; \
    else \
      echo "No build output found!"; \
      exit 1; \
    fi

# NGINX configuration
FROM nginx:alpine

# Copy the built app to nginx html directory
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/* /

RUN chmod +x /docker-entry.sh

# Expose port 80
EXPOSE 80

# use this if you need proxy, check: default.conf and box.conf
# ENV NGINX_HOST=webui \
#     NGINX_PORT=8081

    # Use our custom entrypoint script
ENTRYPOINT ["/docker-entry.sh"]
# Remove the default CMD as our entrypoint script already starts nginx
