#!/bin/bash

# Backend API Testing Script
# Tests the simple orchestrator API endpoints

BASE_URL="http://localhost:3003"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Backend API Testing${NC}"
echo "================================"
echo ""

# Test 1: Health Check
echo -e "${GREEN}Test 1: Health Check${NC}"
echo "GET $BASE_URL/health"
curl -s -X GET "$BASE_URL/health" | jq '.'
echo ""
echo ""

# Test 2: API Info
echo -e "${GREEN}Test 2: API Information${NC}"
echo "GET $BASE_URL/"
curl -s -X GET "$BASE_URL/" | jq '.'
echo ""
echo ""

# Test 3: Search - Simple query
echo -e "${GREEN}Test 3: Simple Search - 'blue dress'${NC}"
echo "POST $BASE_URL/api/v1/search"
curl -s -X POST "$BASE_URL/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "blue dress",
    "maxResults": 3
  }' | jq '{
    query: .query,
    resultsCount: .results | length,
    firstResult: .results[0] | {
      bundleName: .look.bundleName,
      totalPrice: .look.totalPrice,
      itemsCount: .look.items | length,
      recommendationReason: .recommendationReason
    },
    questions: .questions | length,
    processingTime: .processingTime,
    cost: .cost
  }'
echo ""
echo ""

# Test 4: Search - With filters
echo -e "${GREEN}Test 4: Search with Filters - 'shirt' with color and budget${NC}"
echo "POST $BASE_URL/api/v1/search"
curl -s -X POST "$BASE_URL/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "shirt",
    "filters": {
      "color": "blue",
      "priceRange": [50, 100]
    },
    "maxResults": 5
  }' | jq '{
    query: .query,
    resultsCount: .results | length,
    firstResult: .results[0] | {
      bundleName: .look.bundleName,
      totalPrice: .look.totalPrice,
      itemsCount: .look.items | length
    },
    questions: .questions | length
  }'
echo ""
echo ""

# Test 5: Search - Complex query
echo -e "${GREEN}Test 5: Complex Search - 'help me choose a party outfit'${NC}"
echo "POST $BASE_URL/api/v1/search"
curl -s -X POST "$BASE_URL/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "help me choose a party outfit",
    "maxResults": 5
  }' | jq '{
    query: .query,
    resultsCount: .results | length,
    needsClarification: (.questions | length > 0),
    questionsCount: .questions | length,
    processingTime: .processingTime
  }'
echo ""
echo ""

# Test 6: Full Response Structure
echo -e "${GREEN}Test 6: Full Response Structure for 'dress'${NC}"
echo "POST $BASE_URL/api/v1/search"
curl -s -X POST "$BASE_URL/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "dress",
    "maxResults": 2
  }' | jq '{
    sessionId,
    query,
    totalResults,
    results: .results | map({
      bundleId: .look.bundleId,
      bundleName: .look.bundleName,
      description: .look.description,
      totalPrice: .look.totalPrice,
      items: .look.items | map({
        productName: .product.name,
        price: .product.price,
        similarityScore: .similarityScore
      }),
      recommendationReason: .recommendationReason,
      confidence: .confidence
    }),
    questions: .questions,
    aiAnalysis: .aiAnalysis,
    processingTime,
    cost
  }' > test-output.json

echo "✅ Full response saved to test-output.json"
echo ""
echo ""

echo -e "${BLUE}✅ All tests completed!${NC}"
echo "Check test-output.json for the full response structure"




