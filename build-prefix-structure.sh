#!/bin/bash

# Build script for PREFIX/dashboard/en/ URL structure
# This script builds the Angular app with the correct base href for each language
# Usage: ./build-prefix-structure.sh [PREFIX]

echo "=== Building Angular App for PREFIX/dashboard/en/ Structure ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PREFIX=${1:-"orochi"}  # Use provided PREFIX or default to "orochi"
OUTPUT_DIR="dist/orochi-ui"
LANGUAGES=("en" "ja")

# Special case for "dashboard" - means no PREFIX, just /dashboard/
if [ "$PREFIX" = "dashboard" ]; then
    echo -e "${BLUE}Building for standard /dashboard/ structure (no PREFIX)${NC}"
    USE_PREFIX=""
else
    echo -e "${BLUE}Using PREFIX: $PREFIX${NC}"
    USE_PREFIX="$PREFIX/"
fi

# Clean previous build
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

# Build for each language with correct base href
for lang in "${LANGUAGES[@]}"; do
    echo -e "${BLUE}Building for language: $lang${NC}"

    if [ "$PREFIX" = "dashboard" ]; then
        BASE_HREF="/dashboard/$lang/"
        DEPLOY_URL="/dashboard/$lang/"
        echo "Base href: $BASE_HREF"
    else
        BASE_HREF="/$PREFIX/dashboard/$lang/"
        DEPLOY_URL="/$PREFIX/dashboard/$lang/"
        echo "Base href: $BASE_HREF"
    fi

    # Build with specific base href for this language
    NODE_OPTIONS=--max-old-space-size=5120 npx ng build \
        --configuration production \
        --localize=$lang \
        --base-href="$BASE_HREF" \
        --deploy-url="$DEPLOY_URL"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Build successful for $lang${NC}"

        # Move the built files to the correct directory structure
        if [ -d "$OUTPUT_DIR/$lang" ]; then
            if [ "$PREFIX" = "dashboard" ]; then
                mkdir -p "$OUTPUT_DIR/dashboard"
                mv "$OUTPUT_DIR/$lang" "$OUTPUT_DIR/dashboard/$lang"
                echo -e "${GREEN}✓ Moved $lang build to dashboard/$lang directory${NC}"
            else
                mkdir -p "$OUTPUT_DIR/$PREFIX/dashboard"
                mv "$OUTPUT_DIR/$lang" "$OUTPUT_DIR/$PREFIX/dashboard/$lang"
                echo -e "${GREEN}✓ Moved $lang build to $PREFIX/dashboard/$lang directory${NC}"
            fi
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
    if [ "$PREFIX" = "dashboard" ]; then
        echo "  - $OUTPUT_DIR/dashboard/$lang/ (for /dashboard/$lang/ URLs)"
    else
        echo "  - $OUTPUT_DIR/$PREFIX/dashboard/$lang/ (for /$PREFIX/dashboard/$lang/ URLs)"
    fi
done

echo ""
echo -e "${YELLOW}Next steps:${NC}"
if [ "$PREFIX" = "dashboard" ]; then
    echo "1. Deploy with Docker (standard mode):"
    echo "   docker build -t orochi-ui ."
    echo "   docker run -p 80:80 orochi-ui"
    echo ""
    echo "2. Or copy files manually:"
    echo "   cp -r $OUTPUT_DIR/* /usr/share/nginx/html/"
    echo ""
    echo "Directory structure in $OUTPUT_DIR:"
    ls -la "$OUTPUT_DIR/dashboard/" 2>/dev/null || echo "No builds found"
else
    echo "1. Deploy with Docker (PREFIX mode):"
    echo "   docker build -t orochi-ui ."
    echo "   docker run -e BOX=true -e PREFIX=$PREFIX -p 80:80 orochi-ui"
    echo ""
    echo "2. Or copy files manually:"
    echo "   cp -r $OUTPUT_DIR/* /usr/share/nginx/html/"
    echo ""
    echo "Directory structure in $OUTPUT_DIR:"
    ls -la "$OUTPUT_DIR/$PREFIX/dashboard/" 2>/dev/null || echo "No builds found"
fi
