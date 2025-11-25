# Agentic Search System - Complete Project Summary

**Version:** 1.0  
**Date:** January 17, 2025  
**Project:** future-of-search  
**Contact:** alfaromeo.romel@gmail.com

---

## 📋 Executive Summary

The Agentic Search System is a production-quality, polyglot microservices architecture for intelligent product search powered by AI agents. The system uses LangGraph.js for orchestration, Vertex AI (Gemini 2.0 Flash) for natural language understanding, and Vertex AI Matching Engine for semantic vector search.

**Key Features:**
- Multi-agent AI system with 8 specialized agents
- Dynamic query clarification and intent understanding
- Semantic vector search with Vertex AI Matching Engine
- Cost-aware architecture with kill switches and budget controls
- Full-stack application (React frontend + microservices backend)

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                │
│              Search UI + Agent Trace Visualization           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          Orchestrator Service (Port 8080)                   │
│         LangGraph.js State Machine + Cost Tracking          │
└─────┬───────────────┬───────────────┬───────────────────────┘
      │               │               │
      ▼               ▼               ▼
┌──────────┐   ┌──────────────┐   ┌─────────────────┐
│  Query   │   │   Vector     │   │   Response      │
│Processor │   │   Search     │   │   Pipeline      │
│(Port     │   │(Port 8082)   │   │(Port 8083)     │
│ 8081)    │   │              │   │                 │
└────┬─────┘   └──────┬───────┘   └────────┬────────┘
     │                │                     │
     ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Vertex AI Services (GCP)                       │
│  • Gemini 2.0 Flash (Text Generation)                      │
│  • text-embedding-005 (Embeddings)                         │
│  • Matching Engine (Vector Search)                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Orchestration** | Node.js + LangGraph.js | Agent workflow coordination |
| **AI Agents** | Node.js + Vertex AI | Natural language processing |
| **Vector Search** | Java Spring Boot + Vertex AI | Semantic similarity search |
| **Response Pipeline** | Java Spring Boot | Result bundling & ranking |
| **Frontend** | React + Vite | User interface |
| **Infrastructure** | Docker Compose / Cloud Run | Deployment |
| **Cost Tracking** | Redis | Budget monitoring |
| **Schema** | Protocol Buffers + OpenAPI | Type safety across services |

---

## 🔧 Services Breakdown

### 1. Orchestrator Service (`services/orchestrator/`)

**Technology:** Node.js + TypeScript + LangGraph.js  
**Port:** 8080  
**Purpose:** Central coordinator managing the complete agent workflow

**Key Features:**
- LangGraph state machine for agent coordination
- Dynamic routing (simple vs complex query paths)
- Cost tracking and budget enforcement
- Execution trace collection
- Kill switch support

**Main Endpoints:**
- `POST /api/v1/search` - Main search endpoint
- `GET /api/v1/cost/metrics` - Cost tracking
- `GET /health` - Health check
- `GET /api/v1/graph` - LangGraph visualization

**Key Files:**
- `src/graphs/maestro-graph.ts` - LangGraph workflow definition
- `src/agents/orchestrator.ts` - Agent coordination logic
- `src/server.ts` - Express server setup

---

### 2. Query Processor Service (`services/query-processor/`)

**Technology:** Node.js + TypeScript + Vertex AI  
**Port:** 8081  
**Purpose:** AI agents for query understanding and enrichment

**Agents:**

| Agent | Purpose | Vertex AI Usage |
|-------|---------|----------------|
| **Ivy Interpreter** | Query intent analysis | Gemini 2.0 Flash for intent extraction |
| **Nori Clarifier** | Dynamic question generation | Gemini 2.0 Flash for clarification prompts |
| **Gale ContextKeeper** | Environmental context | Gemini 2.0 Flash for context inference |
| **Vogue TrendWhisperer** | Fashion trend analysis | Gemini 2.0 Flash for trend signals |

**Main Endpoints:**
- `POST /api/v1/interpret` - Query intent analysis
- `POST /api/v1/clarify` - Generate clarification questions
- `POST /api/v1/context` - Get environmental context
- `POST /api/v1/trends` - Analyze fashion trends

**Key Files:**
- `src/agents/ivy-interpreter.ts` - Intent analysis agent
- `src/agents/nori-clarifier.ts` - Clarification agent
- `src/agents/gale-context-keeper.ts` - Context agent
- `src/agents/vogue-trend-whisperer.ts` - Trend analysis agent
- `src/vertexai/real-client.ts` - Vertex AI client wrapper

---

### 3. Vector Search Service (`services/vector-search/`)

**Technology:** Java Spring Boot + Vertex AI Matching Engine  
**Port:** 8082  
**Purpose:** Semantic vector search using Vertex AI Matching Engine

**Agent:**
- **Kiko Curator** - Vector similarity search via Matching Engine

**Key Features:**
- Integration with Vertex AI Matching Engine (`findNeighbors` API)
- Metadata filtering (category, color, price, etc.)
- Trend signal integration
- Circuit breaker for resilience
- Cost tracking per query

**Main Endpoints:**
- `POST /api/v1/search` - Vector similarity search
- `GET /health` - Health check

**Key Files:**
- `src/main/java/.../service/KikoCuratorService.java` - Vector search logic
- `src/main/java/.../config/VertexAIConfig.java` - Vertex AI configuration
- `src/main/java/.../config/CostGuard.java` - Cost control

**Configuration:**
- `VERTEX_AI_ENDPOINT_ID` - Matching Engine endpoint ID
- `VERTEX_AI_INDEX_ID` - Matching Engine index ID
- `VERTEX_AI_DEPLOYED_INDEX_ID` - Deployed index ID
- `VERTEX_AI_KILL_SWITCH` - Emergency cost control

**Recent Migration:** Updated from deprecated `MatchRequest`/`MatchResponse` to `FindNeighborsRequest`/`FindNeighborsResponse` (SDK 3.35.0)

---

### 4. Response Pipeline Service (`services/response-pipeline/`)

**Technology:** Java Spring Boot  
**Port:** 8083  
**Purpose:** Result bundling, ranking, and response generation

**Agents:**
- **Weave Composer** - Bundle creation and deduplication
- **Judge Ranker** - Scoring and ranking
- **Sage Explainer** - Natural language explanations
- **Aegis Guardian** - Safety validation

**Main Endpoints:**
- `POST /api/v1/bundle` - Create product bundles
- `POST /api/v1/rank` - Rank results
- `POST /api/v1/explain` - Generate explanations
- `POST /api/v1/validate` - Safety checks

---

### 5. Frontend (`frontend/`)

**Technology:** React + Vite + TypeScript  
**Port:** 3000  
**Purpose:** User interface for search and results display

**Key Features:**
- Search interface
- Dynamic clarification questions UI
- Real-time LangGraph visualization
- Agent execution traces display
- Results with product cards

**Key Files:**
- `src/App.tsx` - Main application component
- `src/services/api.ts` - API client
- `src/components/` - UI components

---

## 🤖 Agent System

### Complete Agent Workflow

```
User Query
    ↓
[Ivy] Intent Analysis → Extract attributes, missing info, complexity
    ↓
[Nori] Clarification → Generate questions if needed
    ↓
[Gale] Context Enrichment → Add environmental context
    ↓
[Vogue] Trend Analysis → Fashion trend signals
    ↓
[Kiko] Vector Search → Semantic similarity search
    ↓
[Weave] Bundle Creation → Group compatible products
    ↓
[Judge] Ranking → Score and rank results
    ↓
[Sage] Explanation → Generate natural language response
    ↓
[Aegis] Safety Check → Validate output
    ↓
Final Response to User
```

### Agent Details

| Agent | Service | Input | Output | Vertex AI |
|-------|---------|-------|--------|-----------|
| **Ivy** | Query Processor | Raw query | QueryIntent | Gemini 2.0 Flash |
| **Nori** | Query Processor | QueryIntent | ClarificationRequest | Gemini 2.0 Flash |
| **Gale** | Query Processor | Query + location | ContextualQuery | Gemini 2.0 Flash |
| **Vogue** | Query Processor | Query + style cues | TrendSignals | Gemini 2.0 Flash |
| **Kiko** | Vector Search | Query + filters | SearchCandidate[] | Matching Engine |
| **Weave** | Response Pipeline | Candidates | LookBundle[] | None |
| **Judge** | Response Pipeline | Bundles | RankedLook[] | None |
| **Sage** | Response Pipeline | Ranked looks | Explanation | Gemini 2.0 Flash |
| **Aegis** | Response Pipeline | Response | ValidatedResponse | Gemini 2.0 Flash |

---

## 🔐 Configuration & Environment

### Required Environment Variables

```bash
# Cost Controls (CRITICAL)
export VERTEX_AI_KILL_SWITCH=false  # Set to 'true' to block all Vertex AI calls
export DAILY_BUDGET_USD=15
export SERVICE_BUDGET_QUERY_PROCESSOR=5
export SERVICE_BUDGET_VECTOR_SEARCH=8

# Google Cloud Platform
export GCP_PROJECT_ID=future-of-search
export GCP_REGION=us-central1
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Vertex AI Matching Engine (for Vector Search)
export VERTEX_AI_ENDPOINT_ID=<endpoint-id>
export VERTEX_AI_INDEX_ID=<index-id>
export VERTEX_AI_DEPLOYED_INDEX_ID=<deployed-index-id>

# Service URLs (for local development)
export QUERY_PROCESSOR_URL=http://localhost:8081
export VECTOR_SEARCH_URL=http://localhost:8082
export RESPONSE_PIPELINE_URL=http://localhost:8083

# Redis (for cost tracking)
export REDIS_URL=redis://localhost:6379
```

### Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| Orchestrator | 8080 | HTTP |
| Query Processor | 8081 | HTTP |
| Vector Search | 8082 | HTTP |
| Response Pipeline | 8083 | HTTP |
| Frontend | 3000 | HTTP |
| Redis | 6379 | TCP |
| PostgreSQL | 5432 | TCP (optional) |

---

## 🚀 Deployment

### Local Development

**Option 1: Docker Compose (Recommended)**
```bash
docker-compose up
```

**Option 2: Manual Start**
```bash
# Start Redis
docker run -p 6379:6379 redis:alpine

# Start services individually
cd services/orchestrator && npm run dev
cd services/query-processor && npm run dev
cd services/vector-search && ./gradlew bootRun
cd services/response-pipeline && ./gradlew bootRun
cd frontend && npm run dev
```

### Cloud Deployment (Google Cloud Run)

```bash
# Enable APIs
gcloud services enable aiplatform.googleapis.com run.googleapis.com

# Deploy services
gcloud run deploy orchestrator --source=services/orchestrator
gcloud run deploy query-processor --source=services/query-processor
gcloud run deploy vector-search --source=services/vector-search
gcloud run deploy response-pipeline --source=services/response-pipeline
```

---

## 💰 Cost Management

### Built-in Cost Controls

1. **Kill Switch** - Emergency stop for all Vertex AI calls
   ```bash
   export VERTEX_AI_KILL_SWITCH=true
   ```

2. **Per-Service Budgets** - Daily spending limits
   - Query Processor: $5/day default
   - Vector Search: $8/day default
   - Response Pipeline: $2/day default

3. **Daily Budget** - Overall system limit ($15/day default)

4. **Per-Query Limits** - Maximum $0.50 per query

### Cost Estimation

| Usage Level | Searches/Day | Estimated Monthly Cost |
|-------------|--------------|----------------------|
| Conservative | 100 | ~$210/month |
| Moderate | 1,000 | ~$477/month |
| High | 10,000 | ~$2,100/month |

**Cost Breakdown:**
- Vertex AI API calls (Gemini): ~$0.002 per request
- Text Embeddings: ~$0.0001 per embedding
- Matching Engine Endpoint: ~$0.10-0.50/hour (when deployed)
- Matching Engine Queries: ~$0.001 per query

### Cost Monitoring

```bash
# Check current costs
curl http://localhost:8080/api/v1/cost/metrics

# Response:
{
  "daily_spend": 2.45,
  "daily_budget": 15.00,
  "remaining_budget": 12.55,
  "query_count": 45,
  "kill_switch_active": false
}
```

### Current Cost Status (January 17, 2025)

- **Historical Costs:** $415 (already incurred)
- **Current Protection:**
  - ✅ Billing disabled (no new costs possible)
  - ✅ Kill switch enabled (`VERTEX_AI_KILL_SWITCH=true`)
  - ✅ All services stopped
  - ✅ No Matching Engine endpoints running

---

## 📊 Data Flow

### Complete Request Flow

1. **User submits query** → Frontend (React)
2. **Frontend sends request** → Orchestrator (`POST /api/v1/search`)
3. **Orchestrator routes** → Query Processor (Ivy agent)
4. **Ivy analyzes intent** → Returns `QueryIntent`
5. **Orchestrator checks** → If clarification needed → Nori agent
6. **Nori generates questions** → Returns to user (if needed)
7. **User responds** → Orchestrator continues
8. **Orchestrator enriches** → Gale (context) + Vogue (trends)
9. **Orchestrator searches** → Vector Search (Kiko agent)
10. **Kiko queries Matching Engine** → Returns candidates
11. **Orchestrator bundles** → Response Pipeline (Weave, Judge, Sage, Aegis)
12. **Final response** → Frontend displays results

### Data Models

**Key Types:**
- `QueryIntent` - Structured intent with attributes
- `ClarificationRequest` - Questions for user
- `SearchCandidate` - Product candidates from vector search
- `LookBundle` - Grouped product combinations
- `RankedLook` - Scored and ranked results
- `FinalUIResponse` - Complete response with traces

**Schema Location:** `schema/models.proto` and `schema/openapi.yaml`

---

## 🔧 Recent Changes & Fixes

### Vector Search Migration (Critical - January 2025)

**Issue:** Migrated from deprecated `MatchRequest`/`MatchResponse` to `FindNeighborsRequest`/`FindNeighborsResponse`

**Files Changed:**
- `services/vector-search/src/main/java/.../service/KikoCuratorService.java`
  - Updated to use `MatchServiceClient.findNeighbors()`
  - Changed metadata extraction from `hasMetadata()` to `restricts`/`numericRestricts`

**SDK Version:** `google-cloud-aiplatform` 3.35.0

### Bucket Configuration Fix (January 2025)

**Issue:** Configuration files referenced different GCS bucket than embedding scripts

**Files Fixed:**
- `outputs/index-config.json` - Updated to `gs://future-of-search-matching-engine-us-central1/matching-engine/data/`
- `outputs/index-config.yaml` - Updated bucket path
- `infrastructure/generate-embeddings.js` - Updated bucket name
- `infrastructure/create-matching-engine.js` - Updated bucket name
- `infrastructure/generate-mock-embeddings.js` - Updated bucket name
- `infrastructure/index-metadata.json` - Updated bucket path

**All scripts now upload to:** `gs://future-of-search-matching-engine-us-central1/matching-engine/data/`

### Query Processor Enhancements (January 2025)

**Changes:**
- Enhanced Ivy agent with richer prompts (`attributeSummary`, `clarificationSignals`)
- Improved Nori clarification logic using Ivy's signals
- Updated Vertex AI client to use `@google-cloud/vertexai` SDK
- Added fallback handling for parsing errors

---

## ⚠️ Known Issues & Current Status

### Critical Issues

1. **Matching Engine Returns Zero Results**
   - **Status:** Under investigation
   - **Symptom:** `findNeighbors` queries return empty results despite index deployment
   - **Possible Causes:**
     - Data format mismatch in embeddings
     - Index not fully synchronized
     - Query vector dimension mismatch
   - **Next Steps:**
     - Verify embedding format matches Matching Engine schema
     - Rebuild index with validated data
     - Test with direct Matching Engine API calls

2. **Billing Disabled**
   - **Status:** Intentionally disabled to prevent costs
   - **Impact:** Cannot access Vertex AI services via console
   - **Action:** Keep disabled until ready to use Vertex AI

### Cost Status

- **Historical Costs:** $415 (already incurred)
- **Current Protection:**
  - ✅ Billing disabled (no new costs possible)
  - ✅ Kill switch enabled (`VERTEX_AI_KILL_SWITCH=true`)
  - ✅ All services stopped
  - ✅ No Matching Engine endpoints running

---

## 📁 Project Structure

```
agentic-search-prod/
├── services/
│   ├── orchestrator/          # LangGraph orchestrator (Node.js)
│   ├── query-processor/       # AI agents (Node.js)
│   ├── vector-search/         # Matching Engine integration (Java)
│   ├── response-pipeline/      # Bundling & ranking (Java)
│   ├── shared/
│   │   └── cost-limiter/      # Shared cost tracking package
│   └── mock-*/                # Mock services for testing
├── frontend/                   # React application
├── infrastructure/             # Deployment scripts
├── scripts/                    # Utility scripts
│   ├── generate_embeddings.py # Embedding generation
│   ├── stop-vertex-ai.sh      # Emergency stop script
│   └── delete-matching-engine.sh
├── schema/                     # Protocol Buffers + OpenAPI
├── outputs/                    # Generated configs & embeddings
├── docs/                      # Documentation
│   ├── progress-summary.md
│   ├── DELETE_MATCHING_ENGINE.md
│   ├── EMERGENCY_STOP.md
│   ├── BILLING_STATUS.md
│   └── CHECK_REMAINING_COSTS.md
├── docker-compose.yml         # Local development setup
└── README.md                  # Main documentation
```

---

## 🧪 Testing

### Manual Testing

```bash
# Test search endpoint
curl -X POST http://localhost:8080/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "blue t-shirt",
    "maxResults": 10
  }'

# Test clarification
curl -X POST http://localhost:8080/api/v1/clarify \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need something to wear"
  }'

# Check health
curl http://localhost:8080/health

# Check costs
curl http://localhost:8080/api/v1/cost/metrics
```

### Test Scenarios

1. **Simple Query:** "blue t-shirt"
   - Expected: 3 agents, ~600ms, no clarification

2. **Complex Query:** "I need something to wear with cream pants"
   - Expected: 5-9 agents, ~1000-1800ms, clarification questions

3. **Occasion Query:** "party outfit"
   - Expected: Trend analysis, context enrichment, bundled results

---

## 🔒 Security & Best Practices

### Cost Protection

1. **Always set kill switch in production:**
   ```bash
   export VERTEX_AI_KILL_SWITCH=true
   ```

2. **Set up billing alerts:**
   - Go to: https://console.cloud.google.com/billing/budgets
   - Create alerts at $50, $100, $200 thresholds

3. **Monitor costs daily:**
   ```bash
   curl http://localhost:8080/api/v1/cost/metrics
   ```

### Service Account Permissions

Required IAM roles:
- `Vertex AI User`
- `Vertex AI Administrator`
- `Storage Object Viewer` (for GCS buckets)

### API Keys & Credentials

- Store service account JSON in secure location
- Never commit credentials to git
- Use environment variables for configuration
- Rotate credentials regularly

---

## 📚 Key Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `docs/progress-summary.md` | Detailed progress and agent breakdown |
| `docs/DELETE_MATCHING_ENGINE.md` | How to delete Matching Engine resources |
| `docs/EMERGENCY_STOP.md` | Emergency cost control procedures |
| `docs/BILLING_STATUS.md` | Billing status and cost analysis |
| `docs/CHECK_REMAINING_COSTS.md` | Cost investigation guide |
| `schema/openapi.yaml` | API specification |
| `schema/models.proto` | Data model definitions |

---

## 🎯 Next Steps for Developer

### Immediate Tasks

1. **Resolve Matching Engine Issue**
   - Verify embedding data format
   - Rebuild index if needed
   - Test with direct API calls

2. **Review Billing Status**
   - Check historical cost breakdown
   - Understand what caused $415
   - Set up budget alerts

3. **Test End-to-End Flow**
   - Start all services
   - Test with sample queries
   - Verify agent execution traces

### Development Priorities

1. **Fix vector search** - Get Matching Engine returning results
2. **Add monitoring** - Enhanced logging and metrics
3. **Optimize costs** - Reduce API calls where possible
4. **Improve error handling** - Better fallbacks and retries
5. **Add tests** - Unit and integration tests

---

## 🆘 Emergency Procedures

### Stop All Costs Immediately

```bash
# Run emergency stop script
./scripts/stop-vertex-ai.sh

# Or manually:
export VERTEX_AI_KILL_SWITCH=true
pkill -f "gradlew bootRun"
pkill -f "node.*orchestrator"
pkill -f "node.*query-processor"
```

### Delete Matching Engine Resources

See: `docs/DELETE_MATCHING_ENGINE.md`

**Quick Links:**
- Index Endpoints: https://console.cloud.google.com/vertex-ai/matching-engine/index-endpoints?project=future-of-search
- Indexes: https://console.cloud.google.com/vertex-ai/matching-engine/indexes?project=future-of-search
- Disable API: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=future-of-search

---

## 📞 Support & Resources

- **Project:** future-of-search
- **Contact:** alfaromeo.romel@gmail.com
- **GCP Project:** future-of-search
- **Region:** us-central1

### Useful Links

- **Vertex AI Console:** https://console.cloud.google.com/vertex-ai?project=future-of-search
- **Billing Dashboard:** https://console.cloud.google.com/billing?project=future-of-search
- **Cloud Storage:** https://console.cloud.google.com/storage?project=future-of-search

---

## 📝 License

MIT

---

**Document Version:** 1.0  
**Last Updated:** January 17, 2025  
**Maintained By:** Project Team

