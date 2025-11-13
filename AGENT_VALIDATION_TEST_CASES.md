# Agent Validation Test Cases

This document defines test cases for validating routing strategies in the Full Orchestrator.

## Routing Strategies

### Two-Path Strategy (Default)
- **Simple Path** (3 agents): `Ivy → Kiko → Sage`
- **Complex Path** (7 agents): `Ivy → Gale → Vogue → Kiko → Weave → Judge → Sage`

### Seven-Path Strategy (Fine-grained)
- **Minimal** (3 agents): `Ivy → Kiko → Sage`
- **Context-Only** (4 agents): `Ivy → Gale → Kiko → Sage`
- **Trend-Only** (5 agents): `Ivy → Gale → Vogue → Kiko → Sage`
- **Bundling-Only** (4 agents): `Ivy → Kiko → Weave → Sage`
- **Bundling + Ranking** (5 agents): `Ivy → Kiko → Weave → Judge → Sage`
- **Full Context** (5 agents): `Ivy → Gale → Vogue → Kiko → Sage`
- **Full** (7 agents): `Ivy → Gale → Vogue → Kiko → Weave → Judge → Sage`

## Test Cases

### Test Case 1: Word-based Search
**Query**: `"blue dress"`

**Expected Two-Path Result**:
- Path: Simple
- Agents: Ivy, Kiko, Sage (3 agents)
- Route: `Ivy → Kiko → Sage`

**Expected Seven-Path Result**:
- Path: Minimal
- Agents: Ivy, Kiko, Sage (3 agents)
- Route: `Ivy → Kiko → Sage`

**Validation**:
- ✅ Verify execution traces contain exactly 3 agents
- ✅ Verify agents are: ivy, kiko, sage
- ✅ Verify Gale, Vogue, Weave, Judge are NOT in traces

---

### Test Case 2: Goal-based Search (Occasion)
**Query**: `"dress for wedding"`

**Expected Two-Path Result**:
- Path: Complex
- Agents: Ivy, Gale, Vogue, Kiko, Weave, Judge, Sage (7 agents)
- Route: `Ivy → Gale → Vogue → Kiko → Weave → Judge → Sage`

**Expected Seven-Path Result**:
- Path: Context-Only
- Agents: Ivy, Gale, Kiko, Sage (4 agents)
- Route: `Ivy → Gale → Kiko → Sage`

**Validation**:
- Two-Path: ✅ Verify execution traces contain exactly 7 agents
- Seven-Path: ✅ Verify execution traces contain exactly 4 agents
- ✅ Verify all expected agents are present
- ⚠️ **Key Difference**: Two-Path uses all agents (7), Seven-Path optimizes (4 agents)

---

### Test Case 3: Goal-based Search (Occasion + Season + Time)
**Query**: `"summer dress for beach wedding in July"`

**Expected Two-Path Result**:
- Path: Complex
- Agents: Ivy, Gale, Vogue, Kiko, Weave, Judge, Sage (7 agents)
- Route: `Ivy → Gale → Vogue → Kiko → Weave → Judge → Sage`

**Expected Seven-Path Result**:
- Path: Full
- Agents: Ivy, Gale, Vogue, Kiko, Weave, Judge, Sage (7 agents)
- Route: `Ivy → Gale → Vogue → Kiko → Weave → Judge → Sage`

**Validation**:
- ✅ Verify execution traces contain exactly 7 agents
- ✅ Verify all agents are present
- ✅ Both strategies use same path for complex queries

---

### Test Case 4: Seasonal Query
**Query**: `"summer dress"`

**Expected Two-Path Result**:
- Path: Complex
- Agents: Ivy, Gale, Vogue, Kiko, Weave, Judge, Sage (7 agents)

**Expected Seven-Path Result**:
- Path: Trend-Only
- Agents: Ivy, Gale, Vogue, Kiko, Sage (5 agents)

**Validation**:
- Two-Path: ✅ Verify 7 agents
- Seven-Path: ✅ Verify 5 agents (Gale, Vogue for trends, but no bundling)
- ⚠️ **Key Difference**: Seven-Path optimizes by skipping bundling/ranking (5 vs 7 agents)

---

### Test Case 5: Outfit Query
**Query**: `"blue dress outfit"`

**Expected Two-Path Result**:
- Path: Complex
- Agents: Ivy, Gale, Vogue, Kiko, Weave, Judge, Sage (7 agents)

**Expected Seven-Path Result**:
- Path: Bundling-Only
- Agents: Ivy, Kiko, Weave, Sage (4 agents)

**Validation**:
- Two-Path: ✅ Verify 7 agents
- Seven-Path: ✅ Verify 4 agents (bundling but no context/trends)
- ⚠️ **Key Difference**: Seven-Path optimizes by skipping context/trends (4 vs 7 agents)

---

## How to Test

### 1. Set Routing Strategy

**Two-Path Strategy**:
```bash
cd services/orchestrator
ROUTING_STRATEGY=two-path npm run dev
```

**Seven-Path Strategy**:
```bash
cd services/orchestrator
ROUTING_STRATEGY=seven-path npm run dev
```

### 2. Run Test Cases

Use the validation script:
```bash
./test-agent-validation.sh
```

Or manually test:
```bash
curl -X POST http://localhost:8080/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "blue dress", "maxResults": 3}' | \
  jq '{routingStrategy: .routingStrategy, agentCount: (.uiResponse.executionTraces | length), agents: [.uiResponse.executionTraces[] | .agentName] | unique}'
```

### 3. Validate Results

Check execution traces:
```bash
curl -X POST http://localhost:8080/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "blue dress"}' | \
  jq '.uiResponse.executionTraces[] | {agent: .agentName, action: .action, status: .status}'
```

## Expected Agent Utilization

### Two-Path Strategy
- **Simple queries**: 3 agents (57% reduction)
- **Complex queries**: 7 agents (0% reduction)
- **Average**: ~5 agents (if 50/50 split)

### Seven-Path Strategy
- **Simple queries**: 3 agents (57% reduction)
- **Occasion queries**: 4 agents (43% reduction)
- **Seasonal queries**: 5 agents (29% reduction)
- **Outfit queries**: 4 agents (43% reduction)
- **Complex queries**: 7 agents (0% reduction)
- **Average**: ~4.5 agents (better optimization)

## Comparison Metrics

| Metric | Two-Path | Seven-Path |
|--------|----------|------------|
| Max Agents | 7 | 7 |
| Min Agents | 3 | 3 |
| Avg Agents (estimated) | ~5 | ~4.5 |
| Routing Complexity | Low | Medium |
| Resource Optimization | Good | Better |

## Notes

- Both strategies use the same agents, just different routing logic
- Seven-Path provides finer-grained control but requires more decision logic
- Two-Path is simpler and easier to maintain
- Actual optimization depends on query distribution in production

