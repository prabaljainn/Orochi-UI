#!/bin/bash

# Simple build script for /dashboard/en/ structure
# No PREFIX, no BOX mode - just simple /dashboard/en/

echo "=== Building Angular App for /dashboard/en/ Structure ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OUTPUT_DIR="dist"
LANGUAGES=("en" "ja")

# Clean previous build
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

# Build for each language with /dashboard/ base href
for lang in "${LANGUAGES[@]}"; do
    echo -e "${BLUE}Building for language: $lang${NC}"
    echo "Base href: /dashboard/$lang/"

    # Create a temporary directory for this language build
    TEMP_OUTPUT="$OUTPUT_DIR-$lang"

    # Build with specific base href for this language to temporary directory
    NODE_OPTIONS=--max-old-space-size=5120 npx ng build \
        --configuration production \
        --localize=$lang \
        --base-href="/dashboard/$lang/" \
        --deploy-url="/dashboard/$lang/" \
        --output-path="$TEMP_OUTPUT"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Build successful for $lang${NC}"

        # Create the correct directory structure
        mkdir -p "$OUTPUT_DIR/dashboard/$lang"

        # Copy all files from temporary location to final location
        if [ -d "$TEMP_OUTPUT/$lang" ]; then
            # If Angular created language-specific directories
            cp -r "$TEMP_OUTPUT/$lang"/* "$OUTPUT_DIR/dashboard/$lang/"
        elif [ -d "$TEMP_OUTPUT" ]; then
            # If Angular built everything in the temp directory
            cp -r "$TEMP_OUTPUT"/* "$OUTPUT_DIR/dashboard/$lang/"
        fi

        # Clean up temporary directory
        rm -rf "$TEMP_OUTPUT"

        echo -e "${GREEN}✓ Files organized in dashboard/$lang directory${NC}"
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
echo "Next steps:"
echo "1. Build Docker image: docker build -t orochi-ui ."
echo "2. Run container: docker run -p 80:80 orochi-ui"
echo "3. Visit: http://localhost/dashboard/en/"

echo ""
echo "Directory structure:"
ls -la "$OUTPUT_DIR/dashboard/" 2>/dev/null || echo "No builds found"
