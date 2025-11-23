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
LANGUAGES=("en" "ja" "hi")

# Clean previous build
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

# Build all locales at once using Angular's i18n configuration
echo -e "${BLUE}Building for all languages with i18n...${NC}"
echo "Languages: ${LANGUAGES[@]}"
echo "Base hrefs are configured in angular.json"
echo ""

NODE_OPTIONS=--max-old-space-size=5120 npx ng build --configuration production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful for all languages${NC}"
    echo ""

    # Reorganize files into dashboard structure
    echo -e "${BLUE}Reorganizing files into /dashboard/ structure...${NC}"
    mkdir -p "$OUTPUT_DIR/dashboard"

    for lang in "${LANGUAGES[@]}"; do
        if [ -d "$OUTPUT_DIR/$lang" ]; then
            echo "Moving $lang to dashboard/$lang"
            mv "$OUTPUT_DIR/$lang" "$OUTPUT_DIR/dashboard/$lang"
            echo -e "${GREEN}✓ Files organized in dashboard/$lang directory${NC}"
        else
            echo -e "${RED}✗ No build output found for $lang${NC}"
        fi
    done
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

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
