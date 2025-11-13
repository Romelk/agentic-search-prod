#!/bin/bash

# Start All Services Script
# Run this after restarting Cursor to start all services

echo "🚀 Starting Agentic Search Services..."
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are already running
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Orchestrator Mode Toggle (default: simple - zero breaking changes)
ORCHESTRATOR_MODE=${ORCHESTRATOR_MODE:-simple}

# Start Orchestrator (Simple or Full based on ORCHESTRATOR_MODE)
if [ "$ORCHESTRATOR_MODE" = "full" ]; then
    # Full Orchestrator (LangGraph) - opt-in only
    echo -e "${BLUE}📡 Starting Full Orchestrator (LangGraph) on port 8080...${NC}"
    if check_port 8080; then
        echo -e "${YELLOW}⚠️  Port 8080 already in use. Skipping...${NC}"
    else
        cd "$PROJECT_ROOT/services/orchestrator"
        PORT=8080 npm run dev > /tmp/orchestrator.log 2>&1 &
        ORCHESTRATOR_PID=$!
        echo -e "${GREEN}✅ Full Orchestrator (LangGraph) started on port 8080 (PID: $ORCHESTRATOR_PID)${NC}"
        echo -e "${YELLOW}💡 Note: Full orchestrator runs on port 8080. Frontend still uses port 3003 (simple orchestrator).${NC}"
        sleep 3
    fi
else
    # Simple Orchestrator (default - unchanged behavior)
    echo -e "${BLUE}📡 Starting Simple Orchestrator (port 3003)...${NC}"
    if check_port 3003; then
        echo -e "${YELLOW}⚠️  Port 3003 already in use. Skipping...${NC}"
    else
        cd "$PROJECT_ROOT/services/simple-orchestrator"
        node server.js > /tmp/orchestrator.log 2>&1 &
        ORCHESTRATOR_PID=$!
        echo -e "${GREEN}✅ Simple Orchestrator started (PID: $ORCHESTRATOR_PID)${NC}"
        sleep 2
    fi
fi

# Start Query Processor
echo -e "${BLUE}🤖 Starting Query Processor (port 8081)...${NC}"
if check_port 8081; then
    echo -e "${YELLOW}⚠️  Port 8081 already in use. Skipping...${NC}"
else
    cd "$PROJECT_ROOT/services/query-processor"
    npm run dev > /tmp/query-processor.log 2>&1 &
    QUERY_PROCESSOR_PID=$!
    echo -e "${GREEN}✅ Query Processor started (PID: $QUERY_PROCESSOR_PID)${NC}"
    sleep 3
fi

# Start Frontend
echo -e "${BLUE}⚛️  Starting Frontend (port 3000)...${NC}"
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 already in use. Skipping...${NC}"
else
    cd "$PROJECT_ROOT/frontend"
    npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
    sleep 2
fi

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "  - Frontend:        http://localhost:3000"
if [ "$ORCHESTRATOR_MODE" = "full" ]; then
    echo "  - Backend API:     http://localhost:8080 (Full Orchestrator - LangGraph)"
    echo "  - Simple API:      http://localhost:3003 (not running)"
else
    echo "  - Backend API:     http://localhost:3003 (Simple Orchestrator)"
fi
echo "  - Query Processor: http://localhost:8081"
echo ""
echo -e "${BLUE}🔍 Health Checks:${NC}"
if [ "$ORCHESTRATOR_MODE" = "full" ]; then
    echo "  - Backend:         http://localhost:8080/health (Full Orchestrator)"
else
    echo "  - Backend:         http://localhost:3003/health (Simple Orchestrator)"
fi
echo "  - Query Processor: http://localhost:8081/health"
echo ""
echo -e "${BLUE}📋 Log Files:${NC}"
echo "  - Orchestrator:    tail -f /tmp/orchestrator.log"
echo "  - Query Processor: tail -f /tmp/query-processor.log"
echo "  - Frontend:        tail -f /tmp/frontend.log"
echo ""
echo -e "${YELLOW}💡 To stop all services:${NC}"
echo "  pkill -f 'node server.js'"
echo "  pkill -f 'npm run dev'"
echo ""
echo -e "${YELLOW}🧪 Test backend:${NC}"
echo "  ./test-backend.sh"
echo ""
if [ "$ORCHESTRATOR_MODE" = "full" ]; then
    echo -e "${YELLOW}💡 Using Full Orchestrator (LangGraph)${NC}"
    echo "  To switch back to Simple Orchestrator:"
    echo "    ORCHESTRATOR_MODE=simple ./start-all.sh"
else
    echo -e "${YELLOW}💡 Using Simple Orchestrator (default)${NC}"
    echo "  To try Full Orchestrator (LangGraph):"
    echo "    ORCHESTRATOR_MODE=full ./start-all.sh"
fi



