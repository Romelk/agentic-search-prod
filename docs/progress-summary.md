# Agentic Search Progress Summary

## Overview
This document captures the work completed to date on the Agentic Search initiative, along with the current open items. It is intended as a briefing aid for stakeholders and demo preparation.

## Major Milestones & Accomplishments

### Architecture Overview
- **Frontend**: React/Vite SPA calling `Full Orchestrator` API (`/api/v1/search`) and displaying agent traces + recommendations.
- **Orchestrator Service** (`services/orchestrator`): LangGraph runtime coordinating agents via HTTP microservices; maintains shared state, cost tracking, execution traces, and routes between simple/complex paths.
- **Query Processor** (`services/query-processor`): Houses Ivy, Nori, Gale, Vogue agents; integrates with Vertex AI (Gemini + embeddings), caching, and exposes REST endpoints consumed by the orchestrator.
- **Vector Search Service** (`services/vector-search`): Java Spring Boot app querying Vertex AI Matching Engine (Kiko Curator); handles embeddings, filters/trend signals, and returns semantic candidates.
- **Response Pipeline** (`services/response-pipeline`): Java service composing bundles (Weave), applying safety checks (Aegis), and providing narrative-ready payloads.
- **Shared Infrastructure**: GCP Vertex AI (Gemini 2.0 Flash, text-embedding-005, Matching Engine), Cloud Storage buckets for embedding files, IAM service accounts, and cost telemetry.
- **Optional Diagrams**: `docs/architecture-diagram.png` (high-level microservices) and `docs/orchestrator-flow.png` (LangGraph state machine) illustrate data flow from UI → Orchestrator → Agents → UI.

```mermaid
flowchart TB
    FE[Frontend (React)]
    ORCH[Orchestrator\n(LangGraph)]
    QP[Query Processor\n(Ivy · Nori · Gale · Vogue)]
    VS[Vector Search\n(Kiko)]
    RP[Response Pipeline\n(Weave · Sage · Aegis)]
    GEM[Gemini 2.0 Flash]
    EMB[text-embedding-005]
    ME[Matching Engine]
    GCS[GCS: Embeddings]

    FE --> ORCH
    ORCH --> QP
    ORCH --> VS
    ORCH --> RP
    ORCH --> FE

    QP --> GEM
    QP --> EMB
    VS --> ME
    VS --> GCS
    RP --> GEM
```

### Architecture & Documentation
- Produced comprehensive write-ups for every agent/service, including Perceive → Think → Act breakdowns, prompt structures, inputs/outputs, and AI touchpoints.
- Delivered overall architecture diagrams (microservices, orchestration graph), optimization proposals, and layperson-friendly explanations for presentations.
- Created supporting guides (`BACKEND_TESTING.md`, `RESTART_GUIDE.md`, `PRODUCT_DATA_COVERAGE.md`, etc.) to make the system reproducible.

### Orchestrator & Routing
- Implemented the LangGraph-based orchestrator with both two-path and seven-path strategies, dynamic transitions, and detailed state summaries.
- Fixed post-clarification routing bugs and enriched trace metadata for each node.
- Added cost estimation/recording, execution metrics, and structured telemetry for debugging and observability.

### Query Processor Enhancements
- Upgraded Ivy (intent analysis) with richer prompts (attributeSummary, clarificationSignals, complexity, reasoning) and robust parsing/fallbacks.
- Enhanced Nori to read Ivy’s signals, producing context-aware clarifications; updated Gale and Vogue agents to the revamped Vertex AI client.
- Introduced deep-clone caching, consistent JSON error handling, and a production-ready Vertex AI client with retries and cost guardrails.

### Response Pipeline & Bundling
- Refined Weave Composer to deduplicate candidates, apply context/trend scoring, and avoid combinatorial explosions.
- Added shared `TrendSignals` models across services to maintain consistency in enrichment data.

### Vector Search & Matching Engine
- Migrated vector-search service to the new Vertex AI `FindNeighbors` API, with proper metadata parsing and circuit breaker support.
- Authored scripts (`scripts/generate_embeddings.py`) and configs (JSON/YAML) for embedding generation and index management.
- Established Google Cloud setup (credentials, IAM, buckets) and automated workflows for embeddings upload, index creation, and endpoint deployment.

### Frontend & Tooling
- Built new React components (`CleanResultsView`, `OptionalFilters`, `TestUI`, etc.) to surface backend functionality.
- Added developer tooling: backend test scripts, agent validation suites, orchestration start/stop scripts, Swagger UI, and reference HTTP collections.
- Expanded mock product catalogs to cover broader query scenarios (blue tops, cream chinos, accessories, footwear, etc.).

### Integration & Testing
- Brought up the full stack (orchestrator, query processor, vector search, frontend) and executed end-to-end queries multiple times.
- Captured cost metrics, execution logs, and telemetry across the system.
- Iterated on product data and embeddings to support richer demo narratives.

## Current Status & Pending Items
- **Matching Engine Result Gap**: Despite regenerating embeddings and building a new index deployment (`kiko_index_v2`), `findNeighbors` queries return zero neighbors. Suspected ingestion/schema mismatch needs resolution or an alternative (e.g., reformat JSONL, rebuild index, evaluate different vector store).
- **Verification Loop**: Once the index returns candidates, rerun orchestrator demo queries (blue tee, cream chinos, outfit requests) to validate clarifications, bundling, and response generation end-to-end.
- **Optional Future Work**: Decide whether to continue investing in Matching Engine or evaluate Elasticsearch/other vector databases for more control over scoring and hybrid search.

## Agent Summary (Perceive → Think → Act)

| Agent | Perceive | Think / Decide | Act | Vertex AI Integration |
| --- | --- | --- | --- | --- |
| Ivy Interpreter | Reads raw user query + user context | Uses Gemini prompt to extract intent, attributes, missing info, tone; sets clarification signals | Returns structured `QueryIntent`, reasoning, attribute summary | **Gemini 2.0 Flash** text generation with custom prompt; cost-tracked via Vertex client |
| Nori Clarifier | Consumes Ivy’s intent & signals | Decides if clarification is needed; crafts targeted questions/options | Sends clarification prompts back to UI/orchestrator | **Gemini 2.0 Flash** prompt grounded in Ivy output; same Vertex AI client and retries |
| Gale Context Keeper | Takes original query, location, season hints | Determines environmental context via LLM or deterministic rules | Outputs enriched context object (season, locale, rationale) | **Gemini 2.0 Flash** for context inference; deterministic fallback for weather |
| Vogue Trend Whisperer | Ingests query + style cues | Analyses fashion trend themes and relevance | Supplies trend signals (trendConfidence, seasonal notes) | **Gemini 2.0 Flash** prompt specialized for trend reasoning |
| Kiko Vector Curator | Receives clarified query, filters, trend hints | Builds embeddings, queries Matching Engine, ranks neighbors | Returns search candidates with metadata & similarity | **Vertex AI text-embedding-005** to encode text; **Vertex AI Matching Engine** `findNeighbors` for ANN search |
| Weave Composer | Reads candidates, trend/context signals | Scores candidates, assembles compatible bundles/outfits | Emits curated looks with rationales | Rule/scoring engine (no direct Vertex call) |
| Sage Response Generator | Takes ranked looks, clarifications, costs | Chooses narrative angle, constructs explanation | Delivers final response text, bullet insights, reasoning | **Gemini 2.0 Flash** for natural language generation with safety prompt |
| Aegis Safety Validator | Reviews recommendations & reasoning | Checks policy compliance, inclusivity, sensitive content | Flags or sanitizes risky outputs before UI | **Gemini 2.0 Flash** safety guardrail prompt |
| Cost & Trace Instrumentation | Monitors all agent inputs/outputs | Aggregates latency, spend, routing decisions | Logs execution traces for audit & debugging | Vertex AI usage tracked per call; telemetry piped into orchestrator logs |

## Next Steps
1. **Resolve Matching Engine Ingestion**: Validate schema requirements, reformat embeddings if necessary, and rebuild the index to ensure neighbors return.
2. **Re-run Demo Queries**: Verify that “Blue T-shirt,” “Cream chinos,” and outfit-building prompts produce candidates, clarifications, and final responses.
3. **Demo Prep**: Once results flow, capture screenshots/logs for the presentation, highlighting the orchestrator traces, agent outputs, and UI responses.

