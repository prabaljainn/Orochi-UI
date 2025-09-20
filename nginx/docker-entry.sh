#!/usr/bin/env sh

# Simple entry script for /dashboard/en/ structure
# No BOX mode, no PREFIX - just simple /dashboard/en/

echo "Starting Orochi UI with /dashboard/en/ structure..."

# Create necessary directories
mkdir -p /usr/share/nginx/html/assets

# Always use the standard dashboard structure configuration
cp /nginx-dashboard-structure.conf /etc/nginx/nginx.conf
echo "Using standard /dashboard/en/ structure"

# Create a simple config file for the frontend
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "apiUrl": "/api",
  "environment": "production"
}
EOF

echo "Starting nginx..."
nginx -g "daemon off;"
