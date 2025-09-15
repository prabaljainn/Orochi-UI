#!/usr/bin/env sh

# Create necessary directories
mkdir -p /usr/share/nginx/html/assets

# Set default PREFIX if not provided
if [ -z "$PREFIX" ]; then
    export PREFIX="orochi"
fi

# Handle BOX mode (with PREFIX) or default mode
if [ "$BOX" = "true" ]; then
    # Update base href in all language versions for dashboard structure
    if [ -f /usr/share/nginx/html/dashboard/en/index.html ]; then
        sed -i.bak -r "s|base href=\"/dashboard/en/\"|base href=\"/$PREFIX/dashboard/en/\"|" /usr/share/nginx/html/dashboard/en/index.html
    fi
    if [ -f /usr/share/nginx/html/dashboard/ja/index.html ]; then
        sed -i.bak -r "s|base href=\"/dashboard/ja/\"|base href=\"/$PREFIX/dashboard/ja/\"|" /usr/share/nginx/html/dashboard/ja/index.html
    fi
    if [ -f /usr/share/nginx/html/dashboard/ar/index.html ]; then
        sed -i.bak -r "s|base href=\"/dashboard/ar/\"|base href=\"/$PREFIX/dashboard/ar/\"|" /usr/share/nginx/html/dashboard/ar/index.html
    fi
    if [ -f /usr/share/nginx/html/dashboard/es/index.html ]; then
        sed -i.bak -r "s|base href=\"/dashboard/es/\"|base href=\"/$PREFIX/dashboard/es/\"|" /usr/share/nginx/html/dashboard/es/index.html
    fi
    if [ -f /usr/share/nginx/html/dashboard/te/index.html ]; then
        sed -i.bak -r "s|base href=\"/dashboard/te/\"|base href=\"/$PREFIX/dashboard/te/\"|" /usr/share/nginx/html/dashboard/te/index.html
    fi
    if [ -f /usr/share/nginx/html/dashboard/hi/index.html ]; then
        sed -i.bak -r "s|base href=\"/dashboard/hi/\"|base href=\"/$PREFIX/dashboard/hi/\"|" /usr/share/nginx/html/dashboard/hi/index.html
    fi

    # Use orochi-box.conf with PREFIX substitution
    envsubst '$PREFIX $NGINX_HOST $NGINX_PORT' < /orochi-box.conf > /etc/nginx/nginx.conf
    echo "Using BOX mode with PREFIX: $PREFIX"
else
    # Use the standard dashboard structure configuration
    cp /nginx-dashboard-structure.conf /etc/nginx/nginx.conf
    echo "Using standard dashboard structure"
fi

# Create a simple config file for the frontend (optional)
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "prefix": "$PREFIX",
  "apiUrl": "/api",
  "environment": "${ENVIRONMENT:-production}"
}
EOF

echo "Starting nginx with configuration..."
nginx -g "daemon off;"
