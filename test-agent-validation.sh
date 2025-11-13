#!/bin/bash

# Agent Validation Test Script
# Tests both routing strategies and compares results

BASE_URL="http://localhost:8080"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Agent Routing Strategy Validation${NC}"
echo "=========================================="
echo ""

# Check if orchestrator is running
if ! curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
  echo -e "${RED}❌ Orchestrator not running on $BASE_URL${NC}"
  echo "Please start the orchestrator first:"
  echo "  cd services/orchestrator && npm run dev"
  exit 1
fi

echo -e "${GREEN}✅ Orchestrator is running${NC}"
echo ""

# Get current routing strategy
CURRENT_STRATEGY=$(curl -s "$BASE_URL/health" | jq -r '.routingStrategy // "unknown"')
echo -e "${YELLOW}Current Routing Strategy: ${CURRENT_STRATEGY}${NC}"
echo ""

# Test cases
declare -a TEST_CASES=(
  "blue dress"
  "dress for wedding"
  "summer dress for beach wedding in July"
  "summer dress"
  "blue dress outfit"
)

# Function to test a query
test_query() {
  local query="$1"
  local strategy="$2"
  
  echo -e "${BLUE}Testing: \"$query\"${NC}"
  
  response=$(curl -s -X POST "$BASE_URL/api/v1/search" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"maxResults\": 3}")
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Request failed${NC}"
    return 1
  fi
  
  # Extract metrics
  routing_strategy=$(echo "$response" | jq -r '.routingStrategy // "unknown"')
  agent_count=$(echo "$response" | jq '.uiResponse.executionTraces | length')
  agents=$(echo "$response" | jq -r '[.uiResponse.executionTraces[] | .agentName] | unique | join(", ")')
  success=$(echo "$response" | jq -r '.uiResponse.success')
  results_count=$(echo "$response" | jq '.uiResponse.results | length')
  
  echo -e "  Strategy: ${GREEN}$routing_strategy${NC}"
  echo -e "  Agents: ${GREEN}$agent_count${NC} ($agents)"
  echo -e "  Success: ${GREEN}$success${NC}"
  echo -e "  Results: ${GREEN}$results_count${NC}"
  echo ""
  
  # Store results
  echo "$agent_count"
}

echo -e "${YELLOW}Running Test Cases...${NC}"
echo ""

# Run tests
for query in "${TEST_CASES[@]}"; do
  test_query "$query" "$CURRENT_STRATEGY"
done

echo -e "${GREEN}✅ Validation complete!${NC}"
echo ""
echo -e "${YELLOW}To test the other strategy:${NC}"
echo "  1. Stop the orchestrator (Ctrl+C)"
echo "  2. Set ROUTING_STRATEGY environment variable:"
echo "     export ROUTING_STRATEGY=seven-path  # or two-path"
echo "  3. Restart orchestrator"
echo "  4. Run this script again"
echo ""

