# Production Agentic Search System

A production-quality, polyglot microservices architecture for agentic search powered by LangGraph.js, Vertex AI, Java Spring Boot, and React.

## 🏗️ Architecture

### Technology Stack

- **Orchestration**: Node.js + LangGraph.js
- **AI Agents**: Node.js + Vertex AI (Gemini 2.0 Flash)
- **Vector Search**: Java Spring Boot + Vertex AI Matching Engine
- **Response Pipeline**: Java Spring Boot
- **Frontend**: React + Vite
- **Infrastructure**: Google Cloud Run (serverless)

### Services

1. **Orchestrator** (Node.js + LangGraph.js)
   - Maestro agent orchestrating the complete workflow
   - LangGraph state machine for agent coordination
   - Cost tracking and kill-switch enforcement

2. **Query Processor** (Node.js)
   - Ivy Interpreter: Query understanding
   - Nori Clarifier: Dynamic question generation
   - Gale ContextKeeper: Environmental context
   - Vogue TrendWhisperer: Trend analysis

3. **Vector Search** (Java Spring Boot)
   - Kiko Curator: Semantic search via Vertex AI Matching Engine
   - High-performance vector similarity matching

4. **Response Pipeline** (Java Spring Boot)
   - Weave Composer: Bundle creation
   - Judge Ranker: Scoring and ranking
   - Sage Explainer: Generate explanations
   - Aegis Guardian: Safety validation

5. **Frontend** (React + Vite)
   - Modern search interface
   - Dynamic clarification questions UI
   - Real-time LangGraph visualization
   - Agent execution traces

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Java 21+
- Docker & Docker Compose
- Google Cloud SDK
- Protocol Buffers compiler

### Local Development (No Cloud Costs)

```bash
# 1. Clone and setup
git clone <repository>
cd agentic-search-prod

# 2. Validate schemas
cd schema && ./ci-validate.sh

# 3. Start local services with Docker Compose
docker-compose up

# 4. Access the application
open http://localhost:3000
```

### Environment Variables

```bash
# Cost Controls
export VERTEX_AI_KILL_SWITCH=false
export DAILY_BUDGET_USD=15
export SERVICE_BUDGET_QUERY_PROCESSOR=5
export SERVICE_BUDGET_VECTOR_SEARCH=8

# GCP Configuration
export GCP_PROJECT_ID=future-of-search
export GCP_REGION=us-central1

# Redis (for cost tracking)
export REDIS_URL=redis://localhost:6379
```

## 💰 Cost Management

### Built-in Cost Controls

1. **Kill-Switch**: Emergency stop for all Vertex AI calls
   ```bash
   export VERTEX_AI_KILL_SWITCH=true
   ```

2. **Per-Service Budgets**: Daily spending limits per service
   - Query Processor: $5/day default
   - Vector Search: $8/day default

3. **Budget Alerts**: GCP alerts at 50%, 90%, 100% of budget

4. **Per-Query Limits**: Maximum $0.50 per query

### Cost Estimation

**Conservative Usage** (100 searches/day):
- Vertex AI API calls: ~$20/month
- Vertex AI Matching Engine: ~$140/month
- Cloud Run: ~$50/month
- **Total**: ~$210/month

**Moderate Usage** (1000 searches/day):
- Total: ~$477/month

## 📊 Monitoring

### Cost Metrics API

```bash
curl http://localhost:8080/api/v1/cost/metrics
```

Response:
```json
{
  "daily_spend": 2.45,
  "daily_budget": 15.00,
  "remaining_budget": 12.55,
  "query_count": 45,
  "kill_switch_active": false
}
```

### Health Check

```bash
curl http://localhost:8080/api/v1/health
```

## 🧪 Development Workflow

### Phase A: Schema Development

```bash
cd schema
./ci-validate.sh  # Validate schemas and generate code
```

### Phase B: Local Development

```bash
# Install dependencies
npm install  # in each Node.js service
./gradlew build  # in each Java service

# Start Redis (for cost tracking)
docker run -p 6379:6379 redis:alpine

# Start services individually
cd services/orchestrator && npm run dev
cd services/query-processor && npm run dev
cd services/vector-search && ./gradlew bootRun
cd services/response-pipeline && ./gradlew bootRun
```

### Phase C: Cloud Deployment

```bash
# Enable GCP APIs
gcloud services enable aiplatform.googleapis.com run.googleapis.com

# Deploy with Terraform
cd infrastructure/terraform
terraform init
terraform apply

# Or deploy manually
gcloud run deploy orchestrator --source=services/orchestrator
```

## 🎯 API Usage

### Basic Search

```bash
curl -X POST http://localhost:8080/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need a nice dress for a summer evening party",
    "max_results": 10
  }'
```

### Get Clarification Questions

```bash
curl -X POST http://localhost:8080/api/v1/clarify \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Looking for a camera"
  }'
```

## 🔧 Configuration

### Service Ports (Local)

- Orchestrator: 8080
- Query Processor: 8081
- Vector Search: 8082
- Response Pipeline: 8083
- Frontend: 3000
- Redis: 6379

### GCP Resources

- Project: `future-of-search`
- Region: `us-central1`
- Services deployed to Cloud Run (serverless)

## 📝 Schema Management

All data models are defined in Protocol Buffers (`schema/models.proto`) and OpenAPI (`schema/openapi.yaml`).

**Cross-language type safety**:
- TypeScript types generated for Node.js services
- Java classes generated for Spring Boot services
- CI validation prevents breaking changes

## 🧠 LangGraph Workflow

The orchestrator uses LangGraph.js to manage the agent workflow:

```
Query → Ivy (Intent) → Nori (Clarify) → Gale (Context) → Vogue (Trend)
  → Kiko (Search) → Weave (Bundle) → Judge (Rank) → Sage (Explain)
  → Aegis (Validate) → Final Response
```

All state transitions are defined in code (`services/orchestrator/src/graphs/maestro-graph.ts`).

## 🚨 Troubleshooting

### Kill-Switch Not Working

```bash
# Verify environment variable
echo $VERTEX_AI_KILL_SWITCH

# Check Redis connection
redis-cli ping
```

### Budget Exceeded

```bash
# Check current spend
curl http://localhost:8080/api/v1/cost/metrics

# Reset daily counters (for testing)
redis-cli DEL "cost:query-processor:2025-01-17"
```

### Service Communication Issues

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs orchestrator
```

## 📚 Documentation

- [Schema Reference](./schema/README.md)
- [Cost Limiter Package](./services/shared/cost-limiter/README.md)
- [Deployment Guide](./infrastructure/README.md)
- [API Documentation](./schema/openapi.yaml)

## 🤝 Contributing

1. Validate schema changes: `cd schema && ./ci-validate.sh`
2. Run tests: `npm test` (Node.js) or `./gradlew test` (Java)
3. Check costs: Ensure all new features respect budget limits

## 📄 License

MIT

## 👥 Team

Project: future-of-search
Contact: alfaromeo.romel@gmail.com


