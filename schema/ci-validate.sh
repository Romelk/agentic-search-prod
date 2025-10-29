#!/bin/bash

# Schema Validation CI Script
# Ensures schema changes don't break cross-language compatibility

set -e

echo "=== Schema Validation CI ==="
echo ""

# Colors for output
GREEN='\033[0.32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if protoc is installed
if ! command -v protoc &> /dev/null; then
    echo -e "${RED}❌ protoc not installed${NC}"
    echo "Install with: brew install protobuf"
    exit 1
fi

echo "✅ protoc found: $(protoc --version)"

# Validate Protobuf schema
echo ""
echo "Step 1: Validating Protobuf schema..."
if protoc --proto_path=. --decode_raw < /dev/null models.proto 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ Protobuf validation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Protobuf schema valid${NC}"

# Generate TypeScript types (for validation)
echo ""
echo "Step 2: Generating TypeScript types..."
mkdir -p ../services/shared/generated/typescript
if protoc --plugin=protoc-gen-ts=../node_modules/.bin/protoc-gen-ts \
    --ts_out=../services/shared/generated/typescript \
    --proto_path=. \
    models.proto 2>/dev/null; then
    echo -e "${GREEN}✅ TypeScript types generated${NC}"
else
    echo "⚠️  TypeScript generation skipped (protoc-gen-ts not found)"
fi

# Generate Java classes (for validation)
echo ""
echo "Step 3: Generating Java classes..."
mkdir -p ../services/shared/generated/java
if protoc --java_out=../services/shared/generated/java \
    --proto_path=. \
    models.proto; then
    echo -e "${GREEN}✅ Java classes generated${NC}"
else
    echo -e "${RED}❌ Java generation failed${NC}"
    exit 1
fi

# Validate OpenAPI schema
echo ""
echo "Step 4: Validating OpenAPI schema..."
if command -v swagger-cli &> /dev/null; then
    swagger-cli validate openapi.yaml
    echo -e "${GREEN}✅ OpenAPI schema valid${NC}"
elif command -v openapi-generator-cli &> /dev/null; then
    openapi-generator-cli validate -i openapi.yaml
    echo -e "${GREEN}✅ OpenAPI schema valid${NC}"
else
    echo "⚠️  OpenAPI validation skipped (swagger-cli or openapi-generator-cli not found)"
fi

# Check for breaking changes (simple approach)
echo ""
echo "Step 5: Checking for breaking changes..."
if [ -f "../.schema-hash" ]; then
    CURRENT_HASH=$(md5sum models.proto openapi.yaml | md5sum | cut -d' ' -f1)
    PREVIOUS_HASH=$(cat ../.schema-hash)
    
    if [ "$CURRENT_HASH" != "$PREVIOUS_HASH" ]; then
        echo "⚠️  Schema has changed! Review for breaking changes."
        echo "   Previous: $PREVIOUS_HASH"
        echo "   Current:  $CURRENT_HASH"
    else
        echo -e "${GREEN}✅ No schema changes${NC}"
    fi
else
    echo "ℹ️  First run, storing schema hash"
fi

# Store current hash
md5sum models.proto openapi.yaml | md5sum | cut -d' ' -f1 > ../.schema-hash

echo ""
echo -e "${GREEN}=== Schema Validation Complete ===${NC}"
echo ""
echo "Generated files:"
echo "  - TypeScript: services/shared/generated/typescript/"
echo "  - Java: services/shared/generated/java/"


