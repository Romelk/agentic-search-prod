# 🚀 Quick Restart Guide

After restarting Cursor, here's what you need to do to get everything running again.

## ✅ What Persists (No Action Needed)

- ✅ **Code changes** - All your saved files
- ✅ **Git commits** - All committed work
- ✅ **Configuration files** - `.env`, `package.json`, etc.
- ✅ **Database/data files** - Products, embeddings, etc.
- ✅ **Docker containers** - If using `docker-compose`, containers persist

## 🔄 What You Need to Restart

### 1. **Orchestrator** (Backend - Port 3003 or 8080)

**Default: Simple Orchestrator** (Port 3003)
```bash
cd services/simple-orchestrator
node server.js
```

**Or use the startup script (defaults to Simple Orchestrator):**
```bash
./start-all.sh
```

**Optional: Full Orchestrator with LangGraph** (Port 8080)
```bash
# Use environment variable to switch to full orchestrator
ORCHESTRATOR_MODE=full ./start-all.sh
```

**Or in background:**
```bash
cd services/simple-orchestrator && node server.js &
```

> **Note**: The default behavior uses Simple Orchestrator on port 3003. Full Orchestrator (LangGraph) is opt-in only and runs on port 8080 for isolated testing. See "Orchestrator Toggle" section below for details.

### 2. **Query Processor** (AI Agents - Port 8081)
```bash
cd services/query-processor
npm run dev
```
**Or in background:**
```bash
cd services/query-processor && npm run dev &
```

### 3. **Frontend** (React App - Port 3000)
```bash
cd frontend
npm run dev
```
**Or in background:**
```bash
cd frontend && npm run dev &
```

## 📝 Quick Startup Script

Create a file `start-all.sh`:

```bash
#!/bin/bash

# Start Simple Orchestrator
cd services/simple-orchestrator
node server.js &
ORCHESTRATOR_PID=$!
echo "🚀 Simple Orchestrator started (PID: $ORCHESTRATOR_PID)"

# Start Query Processor
cd ../query-processor
npm run dev &
QUERY_PROCESSOR_PID=$!
echo "🤖 Query Processor started (PID: $QUERY_PROCESSOR_PID)"

# Start Frontend
cd ../../frontend
npm run dev &
FRONTEND_PID=$!
echo "⚛️  Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ All services started!"
echo "📊 Services:"
echo "  - Backend: http://localhost:3003"
echo "  - Query Processor: http://localhost:8081"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "To stop all: kill $ORCHESTRATOR_PID $QUERY_PROCESSOR_PID $FRONTEND_PID"
```

**Make it executable and run:**
```bash
chmod +x start-all.sh
./start-all.sh
```

## 🧪 Verify Everything is Running

### Health Checks
```bash
# Backend
curl http://localhost:3003/health

# Query Processor
curl http://localhost:8081/health

# Frontend (just check if page loads)
open http://localhost:3000
```

### Quick Test
```bash
./test-backend.sh
```

## 🐳 If Using Docker Compose

If you're using Docker Compose, containers persist and restart automatically:
```bash
docker-compose up -d
```

## 📋 Environment Variables to Check

Make sure these are set in your `.env` files or environment:

**Query Processor** (`services/query-processor/.env`):
- `GCP_PROJECT_ID=future-of-search`
- `GCP_REGION=us-central1`
- `GEMINI_MODEL=gemini-2.0-flash-exp`
- `EMBEDDING_MODEL=text-embedding-005`
- `DAILY_BUDGET_USD=5`

**Simple Orchestrator**: Usually doesn't need env vars for local dev.

## 🔍 Troubleshooting

### Port Already in Use?
```bash
# Kill processes on specific ports
lsof -ti:3003 | xargs kill -9  # Simple Orchestrator
lsof -ti:8081 | xargs kill -9  # Query Processor
lsof -ti:3000 | xargs kill -9  # Frontend
```

### Services Not Starting?
1. Check if Node.js is installed: `node --version`
2. Check if dependencies are installed: `npm install` in each service
3. Check logs for errors

### Vertex AI Errors?
- Check GCP credentials are set: `gcloud auth application-default login`
- Check API quotas aren't exhausted (429 errors)

## 📚 Important URLs

- **Frontend**: http://localhost:3000
- **Backend API (Simple)**: http://localhost:3003 (default)
- **Backend API (Full/LangGraph)**: http://localhost:8080 (opt-in only)
- **Query Processor**: http://localhost:8081
- **Backend Health**: http://localhost:3003/health (Simple) or http://localhost:8080/health (Full)
- **Query Processor Health**: http://localhost:8081/health
- **API Docs**: http://localhost:3003/api/docs (Simple) or http://localhost:8080/api/docs (Full)

## 🎯 After Restart Checklist

- [ ] Start Simple Orchestrator (port 3003)
- [ ] Start Query Processor (port 8081)
- [ ] Start Frontend (port 3000)
- [ ] Run health checks
- [ ] Test backend: `./test-backend.sh`
- [ ] Test frontend: Open http://localhost:3000

## 💾 What You'll Lose

- ❌ **Terminal history** - But commands are saved in this guide
- ❌ **Running processes** - Need to restart services
- ❌ **In-memory Redis** - If not using Docker (data persists with Docker)
- ❌ **Unsaved editor changes** - Make sure to save!

## 🔀 Orchestrator Toggle (Zero Breaking Changes)

The system supports two orchestrator implementations with a safe toggle mechanism:

### Simple Orchestrator (Default - Zero Risk)
- **Port**: 3003
- **Technology**: Traditional code with regex-based routing
- **Status**: Default behavior (unchanged)
- **Dependencies**: Only needs Query Processor (8081)

### Full Orchestrator (Opt-in Only)
- **Port**: 8080
- **Technology**: LangGraph.js state machine
- **Status**: Opt-in only, requires explicit toggle
- **Dependencies**: Query Processor (8081), Vector Search (8082), Response Pipeline (8083)

### Usage

```bash
# Default: Simple Orchestrator (no change, zero risk)
./start-all.sh

# Explicit opt-in to Full Orchestrator (testing only)
ORCHESTRATOR_MODE=full ./start-all.sh

# Revert to Simple Orchestrator (instant rollback)
ORCHESTRATOR_MODE=simple ./start-all.sh
```

### Safety Features
- ✅ **Default behavior unchanged**: Simple orchestrator always runs unless explicitly switched
- ✅ **Zero breaking changes**: All existing scripts and workflows continue to work
- ✅ **Isolated testing**: Full orchestrator runs on separate port (8080), doesn't interfere with production (3003)
- ✅ **Easy rollback**: Just don't set `ORCHESTRATOR_MODE=full` or set it to `simple`
- ✅ **Graceful degradation**: Full orchestrator handles missing services gracefully with fallbacks

### Service Dependencies
- **Simple Orchestrator**: Only needs Query Processor (8081) - Already running ✅
- **Full Orchestrator**: Needs Query Processor (8081) ✅, Vector Search (8082) ⚠️, Response Pipeline (8083) ⚠️
  - Missing services are handled gracefully with fallback responses
  - Clear error messages indicate which services are unavailable

## 🔀 Routing Strategy Toggle (Full Orchestrator Only)

The Full Orchestrator supports two routing strategies for optimizing agent usage:

### Two-Path Strategy (Default)
- **Path 1**: Simple (3 agents) - `Ivy → Kiko → Sage`
  - For: Simple product searches like "blue dress"
- **Path 2**: Complex (7 agents) - `Ivy → Gale → Vogue → Kiko → Weave → Judge → Sage`
  - For: Occasion-based or complex queries like "dress for wedding"

### Seven-Path Strategy (Fine-grained)
- **Minimal** (3 agents): `Ivy → Kiko → Sage`
- **Context-Only** (4 agents): `Ivy → Gale → Kiko → Sage`
- **Trend-Only** (5 agents): `Ivy → Gale → Vogue → Kiko → Sage`
- **Bundling-Only** (4 agents): `Ivy → Kiko → Weave → Sage`
- **Bundling + Ranking** (5 agents): `Ivy → Kiko → Weave → Judge → Sage`
- **Full Context** (5 agents): `Ivy → Gale → Vogue → Kiko → Sage`
- **Full** (7 agents): `Ivy → Gale → Vogue → Kiko → Weave → Judge → Sage`

### Usage

```bash
# Default: Two-path strategy
cd services/orchestrator
ROUTING_STRATEGY=two-path npm run dev

# Or use seven-path strategy
ROUTING_STRATEGY=seven-path npm run dev

# Or set in environment
export ROUTING_STRATEGY=seven-path
cd services/orchestrator && npm run dev
```

### Strategy Comparison

| Query | Two-Path | Seven-Path |
|-------|----------|------------|
| "blue dress" | Simple (3 agents) | Minimal (3 agents) |
| "dress for wedding" | Complex (7 agents) | Context-Only (4 agents) |
| "summer dress" | Complex (7 agents) | Trend-Only (5 agents) |
| "blue dress outfit" | Complex (7 agents) | Bundling-Only (4 agents) |

**Note**: The routing strategy toggle only applies to the Full Orchestrator (port 8080). Simple Orchestrator (port 3003) uses fixed routing logic.

---

**Pro Tip**: Bookmark this file! It's your restart checklist. 📌



