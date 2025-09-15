#!/bin/bash

# Build script for dashboard/en/ URL structure
# This script builds the Angular app with the correct base href for each language

echo "=== Building Angular App for /dashboard/en/ Structure ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OUTPUT_DIR="dist/orochi-ui"
LANGUAGES=("en" "ja")

# Clean previous build
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

# Build for each language with correct base href
for lang in "${LANGUAGES[@]}"; do
    echo -e "${BLUE}Building for language: $lang${NC}"
    echo "Base href: /dashboard/$lang/"

    # Build with specific base href for this language
    NODE_OPTIONS=--max-old-space-size=5120 npx ng build \
        --configuration production \
        --localize=$lang \
        --base-href="/dashboard/$lang/" \
        --deploy-url="/dashboard/$lang/"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Build successful for $lang${NC}"

        # Move the built files to the correct directory structure
        if [ -d "$OUTPUT_DIR/$lang" ]; then
            mkdir -p "$OUTPUT_DIR/dashboard"
            mv "$OUTPUT_DIR/$lang" "$OUTPUT_DIR/dashboard/$lang"
            echo -e "${GREEN}✓ Moved $lang build to dashboard/$lang directory${NC}"
        fi
    else
        echo -e "${RED}✗ Build failed for $lang${NC}"
        exit 1
    fi
    echo ""
done

echo -e "${GREEN}=== Build Complete ===${NC}"
echo "Built applications are in:"
for lang in "${LANGUAGES[@]}"; do
    echo "  - $OUTPUT_DIR/dashboard/$lang/ (for /dashboard/$lang/ URLs)"
done

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy nginx-dashboard-structure.conf to your nginx configuration"
echo "2. Deploy the built files to your web server"
echo "3. Restart nginx"
echo ""
echo "Directory structure in $OUTPUT_DIR:"
ls -la $OUTPUT_DIR/
