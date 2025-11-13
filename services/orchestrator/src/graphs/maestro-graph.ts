/**
 * Maestro Graph - LangGraph state machine for agentic search orchestration
 * 
 * This defines the complete workflow as a state machine in code:
 * Query → Intent → Clarified → Context → Trend → Candidates → Looks → Ranked → Final
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { OrchestratorState, AgentExecutionTrace } from '../types';
import {
  queryIntentNode,
  clarificationNode,
  contextEnrichmentNode,
  trendEnrichmentNode,
  vectorSearchNode,
  bundleCreationNode,
  rankingNode,
  safetyValidationNode,
  responseGenerationNode
} from '../agents/orchestrator';

/**
 * Routing Strategy Configuration
 */
export type RoutingStrategy = 'two-path' | 'seven-path';

/**
 * Get routing strategy from environment variable
 */
function getRoutingStrategy(): RoutingStrategy {
  const strategy = process.env.ROUTING_STRATEGY || 'two-path';
  if (strategy === 'seven-path' || strategy === 'two-path') {
    return strategy;
  }
  console.warn(`[Orchestrator] Invalid ROUTING_STRATEGY: ${strategy}, defaulting to 'two-path'`);
  return 'two-path';
}

/**
 * Create the Maestro orchestration graph
 * Supports both two-path and seven-path routing strategies
 */
export function createMaestroGraph() {
  const strategy = getRoutingStrategy();
  console.log(`[Orchestrator] Using routing strategy: ${strategy}`);
  
  if (strategy === 'seven-path') {
    return createSevenPathGraph();
  } else {
    return createTwoPathGraph();
  }
}

/**
 * Create Two-Path Graph (Simple vs Complex)
 */
function createTwoPathGraph() {
  // Define the state graph
  const workflow = new StateGraph<OrchestratorState>({
    channels: {
      query: { value: '' },
      requestId: { value: '' },
      startTime: { value: 0 },
      queryIntent: { value: null },
      clarificationRequest: { value: null },
      clarifiedQuery: { value: null },
      contextualQuery: { value: null },
      trendEnrichedQuery: { value: null },
      trendSignals: { value: null },
      searchCandidates: { value: [] },
      lookBundles: { value: [] },
      rankedLooks: { value: [] },
      validatedLooks: { value: [] },
      finalResponse: { value: null },
      executionTraces: {
        reducer: (a: AgentExecutionTrace[], b: AgentExecutionTrace[]) => [...(a || []), ...(b || [])],
        value: []
      },
      currentStep: { value: 'START' },
      error: { value: null },
      estimatedCost: { value: 0 },
      actualCost: { value: 0 },
      metadata: { value: {} },
      activeFilters: { value: null }
    }
  });

  // Add nodes for each agent
  workflow.addNode('query_intent', queryIntentNode);
  workflow.addNode('clarification', clarificationNode);
  workflow.addNode('context_enrichment', contextEnrichmentNode);
  workflow.addNode('trend_enrichment', trendEnrichmentNode);
  workflow.addNode('vector_search', vectorSearchNode);
  workflow.addNode('bundle_creation', bundleCreationNode);
  workflow.addNode('ranking', rankingNode);
  workflow.addNode('safety_validation', safetyValidationNode);
  workflow.addNode('response_generation', responseGenerationNode);

  // Define the workflow edges
  workflow.addEdge(START, 'query_intent');

  // Two-path routing: After Ivy, decide simple or complex path
  workflow.addConditionalEdges(
    'query_intent',
    (state: OrchestratorState) => {
      if (state.clarificationRequest?.needsClarification) {
        return 'clarify';
      }

      const routing = evaluateTwoPathRouting(state);
      return routing.requiresContext ? 'context' : 'vector';
    },
    {
      'clarify': 'clarification',
      'context': 'context_enrichment',
      'vector': 'vector_search'
    }
  );

  workflow.addConditionalEdges(
    'clarification',
    shouldContinueAfterClarification,
    {
      'context_enrichment': 'context_enrichment',
      'vector_search': 'vector_search',
      'end': END
    }
  );

  workflow.addConditionalEdges(
    'context_enrichment',
    (state: OrchestratorState) => {
      const routing = getRoutingMetadata(state);
      return routing?.requiresTrend ? 'trend' : 'vector';
    },
    {
      'trend': 'trend_enrichment',
      'vector': 'vector_search'
    }
  );

  workflow.addEdge('trend_enrichment', 'vector_search');
  
  // After Kiko: Decide based on path (simple vs complex)
  // Simple path: Skip bundling/ranking, go directly to response
  // Complex path: Continue with bundling and ranking
  workflow.addConditionalEdges(
    'vector_search',
    (state: OrchestratorState) => {
      const routing = getRoutingMetadata(state);
      return routing?.requiresBundling ? 'bundle' : 'response';
    },
    {
      'response': 'safety_validation', // Simple path: Validate directly before responding
      'bundle': 'bundle_creation' // Complex path: Continue with bundling
    }
  );
  
  // Complex path: Continue with bundling and ranking
  workflow.addConditionalEdges(
    'bundle_creation',
    (state: OrchestratorState) => {
      const routing = getRoutingMetadata(state);
      return routing?.requiresRanking ? 'rank' : 'validate';
    },
    {
      'rank': 'ranking',
      'validate': 'safety_validation'
    }
  );

  workflow.addEdge('ranking', 'safety_validation');
  workflow.addEdge('safety_validation', 'response_generation');
  workflow.addEdge('response_generation', END);

  // Compile the graph
  return workflow.compile();
}

/**
 * Create Seven-Path Graph (Fine-grained routing)
 */
function createSevenPathGraph() {
  // Define the state graph
  const workflow = new StateGraph<OrchestratorState>({
    channels: {
      query: { value: '' },
      requestId: { value: '' },
      startTime: { value: 0 },
      queryIntent: { value: null },
      clarificationRequest: { value: null },
      clarifiedQuery: { value: null },
      contextualQuery: { value: null },
      trendEnrichedQuery: { value: null },
      trendSignals: { value: null },
      searchCandidates: { value: [] },
      lookBundles: { value: [] },
      rankedLooks: { value: [] },
      validatedLooks: { value: [] },
      finalResponse: { value: null },
      executionTraces: {
        reducer: (a: AgentExecutionTrace[], b: AgentExecutionTrace[]) => [...(a || []), ...(b || [])],
        value: []
      },
      currentStep: { value: 'START' },
      error: { value: null },
      estimatedCost: { value: 0 },
      actualCost: { value: 0 },
      metadata: { value: {} },
      activeFilters: { value: null }
    }
  });

  // Add nodes for each agent
  workflow.addNode('query_intent', queryIntentNode);
  workflow.addNode('clarification', clarificationNode);
  workflow.addNode('context_enrichment', contextEnrichmentNode);
  workflow.addNode('trend_enrichment', trendEnrichmentNode);
  workflow.addNode('vector_search', vectorSearchNode);
  workflow.addNode('bundle_creation', bundleCreationNode);
  workflow.addNode('ranking', rankingNode);
  workflow.addNode('safety_validation', safetyValidationNode);
  workflow.addNode('response_generation', responseGenerationNode);

  // Define the workflow edges
  workflow.addEdge(START, 'query_intent');

  // After Ivy: Check clarification, then decide on Gale (Context)
  workflow.addConditionalEdges(
    'query_intent',
    (state: OrchestratorState) => {
      if (state.clarificationRequest?.needsClarification) {
        return 'clarify';
      }
      const routing = evaluateSevenPathRouting(state);
      return routing.requiresContext ? 'context' : 'vector';
    },
    {
      'clarify': 'clarification',
      'context': 'context_enrichment',
      'vector': 'vector_search'
    }
  );

  workflow.addConditionalEdges(
    'clarification',
    shouldContinueAfterClarification,
    {
      'context_enrichment': 'context_enrichment',
      'vector_search': 'vector_search',
      'end': END
    }
  );

  // After Gale: Decide on Vogue (Trend)
  workflow.addConditionalEdges(
    'context_enrichment',
    (state: OrchestratorState) => {
      const routing = getRoutingMetadata(state);
      return routing?.requiresTrend ? 'trend' : 'vector';
    },
    {
      'trend': 'trend_enrichment',
      'vector': 'vector_search'
    }
  );

  // Vogue always goes to vector search
  workflow.addEdge('trend_enrichment', 'vector_search');

  // After Kiko: Decide on Weave (Bundling)
  workflow.addConditionalEdges(
    'vector_search',
    (state: OrchestratorState) => {
      const routing = getRoutingMetadata(state);
      return routing?.requiresBundling ? 'bundle' : 'response';
    },
    {
      'bundle': 'bundle_creation',
      'response': 'safety_validation'
    }
  );

  // After Weave: Decide on Judge (Ranking)
  // If we have bundles, we likely need ranking
  workflow.addConditionalEdges(
    'bundle_creation',
    (state: OrchestratorState) => {
      const routing = getRoutingMetadata(state);
      if (routing?.requiresRanking) return 'rank';

      const intent = state.queryIntent;
      if (state.lookBundles && state.lookBundles.length > 1) return 'rank';
      if (intent?.intentType === 'comparison' || intent?.intentType === 'recommendation') {
        return 'rank';
      }
      return 'validate';
    },
    {
      'rank': 'ranking',
      'validate': 'safety_validation'
    }
  );

  // Judge always goes to safety validation
  workflow.addEdge('ranking', 'safety_validation');
  workflow.addEdge('safety_validation', 'response_generation');
  workflow.addEdge('response_generation', END);

  // Compile the graph
  return workflow.compile();
}

/**
 * Decision function: Should we ask for clarification?
 */
function shouldClarify(state: OrchestratorState): string {
  // If clarification is needed, go to clarification node
  if (state.clarificationRequest?.needsClarification) {
    return 'clarify';
  }
  
  // Otherwise, continue to context enrichment
  return 'continue';
}

/**
 * Decision function: What to do after clarification?
 */
function shouldContinueAfterClarification(state: OrchestratorState): string {
  // If user provided clarifications, continue with context enrichment
  if (state.clarifiedQuery && Object.keys(state.clarifiedQuery.clarifications).length > 0) {
    const strategy = resolveRoutingStrategy(state);
    const routing =
      strategy === 'two-path' ? evaluateTwoPathRouting(state) : evaluateSevenPathRouting(state);
    return routing.requiresContext ? 'context_enrichment' : 'vector_search';
  }
  
  // If no clarifications or user wants to skip, end the workflow
  // The response will indicate that clarification is needed
  return 'end';
}

/**
 * Two-Path Routing: Determine simple or complex path
 */
function determinePathTwoPath(state: OrchestratorState): 'simple' | 'complex' {
  const intent = state.queryIntent;
  
  if (!intent) {
    return 'complex'; // Default to complex if no intent
  }
  
  // Simple path: basic product search with simple entities
  if (intent.intentType === 'product_search' && hasBasicEntitiesOnly(intent.detectedEntities)) {
    return 'simple';
  }
  
  // Complex path: goal-based or has contextual entities
  return 'complex';
}

/**
 * Check if entities are only basic product attributes
 */
function hasBasicEntitiesOnly(entities: string[]): boolean {
  const basicEntities = ['color', 'category', 'size', 'brand', 'subcategory'];
  return entities.every(e => basicEntities.includes(e.toLowerCase()));
}

type RoutingMetadata = {
  routeKind: 'two-simple' | 'two-complex' | 'seven';
  requiresContext: boolean;
  requiresTrend: boolean;
  requiresBundling: boolean;
  requiresRanking: boolean;
};

function setRoutingMetadata(state: OrchestratorState, metadata: RoutingMetadata): RoutingMetadata {
  if (!state.metadata || typeof state.metadata !== 'object') {
    state.metadata = {};
  }
  state.metadata.routing = metadata;
  return metadata;
}

function getRoutingMetadata(state: OrchestratorState): RoutingMetadata | null {
  if (state.metadata && typeof state.metadata === 'object' && state.metadata.routing) {
    return state.metadata.routing as RoutingMetadata;
  }
  return null;
}

function evaluateTwoPathRouting(state: OrchestratorState): RoutingMetadata {
  const path = determinePathTwoPath(state);
  const requiresContext = path === 'complex' && needsContextEnrichment(state);
  const requiresTrend = requiresContext && needsTrendEnrichment(state);
  const requiresBundling = path === 'complex' && needsBundling(state);
  const requiresRanking = requiresBundling ? needsRanking(state) : false;

  return setRoutingMetadata(state, {
    routeKind: path === 'simple' ? 'two-simple' : 'two-complex',
    requiresContext,
    requiresTrend,
    requiresBundling,
    requiresRanking
  });
}

function evaluateSevenPathRouting(state: OrchestratorState): RoutingMetadata {
  const requiresContext = needsContextEnrichment(state);
  const requiresTrend = requiresContext && needsTrendEnrichment(state);
  const requiresBundling = needsBundling(state);
  const requiresRanking = requiresBundling ? needsRanking(state) : false;

  return setRoutingMetadata(state, {
    routeKind: 'seven',
    requiresContext,
    requiresTrend,
    requiresBundling,
    requiresRanking
  });
}

function resolveRoutingStrategy(state: OrchestratorState): RoutingStrategy {
  const metadata = state.metadata as Record<string, unknown> | undefined;
  if (metadata) {
    const direct = metadata.routingStrategy;
    if (direct === 'two-path' || direct === 'seven-path') {
      return direct;
    }

    const routing = metadata.routing as RoutingMetadata | undefined;
    if (routing) {
      if (routing.routeKind === 'seven') {
        return 'seven-path';
      }
      if (routing.routeKind.startsWith('two')) {
        return 'two-path';
      }
    }
  }

  const envStrategy = process.env.ROUTING_STRATEGY;
  if (envStrategy === 'two-path' || envStrategy === 'seven-path') {
    return envStrategy;
  }

  return 'seven-path';
}

/**
 * Seven-Path Routing: Does query need context enrichment?
 */
function needsContextEnrichment(state: OrchestratorState): boolean {
  const intent = state.queryIntent;
  if (!intent) return false;
  
  // Context needed for occasion-based queries
  if (intent.attributes.occasion) return true;
  
  // Context needed for recommendation queries
  if (intent.intentType === 'recommendation') return true;
  
  // Context needed for location/weather-dependent queries
  if (intent.detectedEntities.some(e => 
    ['location', 'weather', 'time', 'season'].includes(e.toLowerCase())
  )) return true;
  
  return false;
}

/**
 * Seven-Path Routing: Does query need trend enrichment?
 */
function needsTrendEnrichment(state: OrchestratorState): boolean {
  const intent = state.queryIntent;
  if (!intent) return false;
  
  // Trends needed for seasonal queries
  if (intent.attributes.season) return true;
  
  // Trends needed for occasion-based queries
  if (intent.attributes.occasion) return true;
  
  // Trends needed for recommendation queries
  if (intent.intentType === 'recommendation') return true;
  
  return false;
}

/**
 * Seven-Path Routing: Does query need bundling?
 */
function needsBundling(state: OrchestratorState): boolean {
  const intent = state.queryIntent;
  if (!intent) return false;
  
  const query = intent.originalQuery.toLowerCase();
  
  // Bundling needed for outfit/ensemble queries
  if (query.includes('outfit') || 
      query.includes('ensemble') || 
      query.includes('look') || 
      query.includes('complete') ||
      query.includes('coordinated') ||
      query.includes('matching')) {
    return true;
  }
  
  // Bundling needed for recommendation queries
  if (intent.intentType === 'recommendation') return true;
  
  // Bundling needed for multiple product queries
  if (intent.detectedEntities.length > 3) return true;
  
  return false;
}

/**
 * Seven-Path Routing: Does query need ranking?
 */
function needsRanking(state: OrchestratorState): boolean {
  const intent = state.queryIntent;
  if (!intent) return false;
  
  // Ranking needed when Weave creates bundles (check if bundling was needed)
  // If bundling is needed, likely multiple bundles will be created
  if (needsBundling(state)) return true;
  
  // Ranking needed for comparison queries
  if (intent.intentType === 'comparison') return true;
  
  // Ranking needed for recommendation queries
  if (intent.intentType === 'recommendation') return true;
  
  return false;
}

/**
 * Export graph visualization data for monitoring
 */
export function getGraphVisualization() {
  const strategy = getRoutingStrategy();
  
  return {
    nodes: [
      { id: 'START', type: 'start', label: 'Start' },
      { id: 'query_intent', type: 'agent', label: 'Ivy\n(Query Intent)' },
      { id: 'clarification', type: 'agent', label: 'Nori\n(Clarification)' },
      { id: 'context_enrichment', type: 'agent', label: 'Gale\n(Context)' },
      { id: 'trend_enrichment', type: 'agent', label: 'Vogue\n(Trend)' },
      { id: 'vector_search', type: 'agent', label: 'Kiko\n(Vector Search)' },
      { id: 'bundle_creation', type: 'agent', label: 'Weave\n(Bundle)' },
      { id: 'ranking', type: 'agent', label: 'Judge\n(Ranking)' },
      { id: 'safety_validation', type: 'agent', label: 'Aegis\n(Safety)' },
      { id: 'response_generation', type: 'agent', label: 'Sage\n(Response)' },
      { id: 'END', type: 'end', label: 'End' }
    ],
    edges: strategy === 'two-path' ? getTwoPathEdges() : getSevenPathEdges(),
    metadata: {
      version: '1.0.0',
      description: 'Maestro Agentic Search Workflow',
      routingStrategy: strategy,
      agents: {
        ivy: 'Query understanding and intent extraction',
        nori: 'Dynamic clarification question generation',
        gale: 'Environmental and contextual enrichment',
        vogue: 'Trend analysis and seasonal recommendations',
        kiko: 'Vector similarity search',
        weave: 'Product bundling and look creation',
        judge: 'Scoring and ranking of looks',
        aegis: 'Safety, inclusivity, and policy validation',
        sage: 'Response generation and explanation'
      }
    }
  };
}

/**
 * Get edges for two-path routing strategy
 */
function getTwoPathEdges() {
  return [
    { from: 'START', to: 'query_intent', type: 'default' },
    { from: 'query_intent', to: 'clarification', type: 'conditional', condition: 'needs_clarification' },
    { from: 'query_intent', to: 'vector_search', type: 'conditional', condition: 'simple_path' },
    { from: 'query_intent', to: 'context_enrichment', type: 'conditional', condition: 'complex_path' },
    { from: 'clarification', to: 'context_enrichment', type: 'conditional', condition: 'clarified' },
    { from: 'clarification', to: 'END', type: 'conditional', condition: 'end' },
    { from: 'context_enrichment', to: 'trend_enrichment', type: 'default' },
    { from: 'trend_enrichment', to: 'vector_search', type: 'default' },
    { from: 'vector_search', to: 'bundle_creation', type: 'default', condition: 'complex_path_only' },
    { from: 'vector_search', to: 'safety_validation', type: 'default', condition: 'simple_path_only' },
    { from: 'bundle_creation', to: 'ranking', type: 'default' },
    { from: 'bundle_creation', to: 'safety_validation', type: 'default', condition: 'skip_ranking' },
    { from: 'ranking', to: 'safety_validation', type: 'default' },
    { from: 'safety_validation', to: 'response_generation', type: 'default' },
    { from: 'response_generation', to: 'END', type: 'default' }
  ];
}

/**
 * Get edges for seven-path routing strategy
 */
function getSevenPathEdges() {
  return [
    { from: 'START', to: 'query_intent', type: 'default' },
    { from: 'query_intent', to: 'clarification', type: 'conditional', condition: 'needs_clarification' },
    { from: 'query_intent', to: 'context_enrichment', type: 'conditional', condition: 'needs_context' },
    { from: 'query_intent', to: 'vector_search', type: 'conditional', condition: 'skip_context' },
    { from: 'clarification', to: 'context_enrichment', type: 'conditional', condition: 'clarified' },
    { from: 'clarification', to: 'END', type: 'conditional', condition: 'end' },
    { from: 'context_enrichment', to: 'trend_enrichment', type: 'conditional', condition: 'needs_trend' },
    { from: 'context_enrichment', to: 'vector_search', type: 'conditional', condition: 'skip_trend' },
    { from: 'trend_enrichment', to: 'vector_search', type: 'default' },
    { from: 'vector_search', to: 'bundle_creation', type: 'conditional', condition: 'needs_bundling' },
    { from: 'vector_search', to: 'safety_validation', type: 'conditional', condition: 'skip_bundling' },
    { from: 'bundle_creation', to: 'ranking', type: 'conditional', condition: 'needs_ranking' },
    { from: 'bundle_creation', to: 'safety_validation', type: 'conditional', condition: 'skip_ranking' },
    { from: 'ranking', to: 'safety_validation', type: 'default' },
    { from: 'safety_validation', to: 'response_generation', type: 'default' },
    { from: 'response_generation', to: 'END', type: 'default' }
  ];
}

/**
 * Get current state summary for monitoring
 */
export function getStateSummary(state: OrchestratorState) {
  return {
    requestId: state.requestId,
    currentStep: state.currentStep,
    query: state.query.substring(0, 100) + (state.query.length > 100 ? '...' : ''),
    hasClarification: !!state.clarificationRequest?.needsClarification,
    candidateCount: state.searchCandidates?.length || 0,
    bundleCount: state.lookBundles?.length || 0,
    rankedCount: state.rankedLooks?.length || 0,
    approvedCount: state.validatedLooks?.length || 0,
    finalResultCount: state.finalResponse?.results?.length || 0,
    estimatedCost: state.estimatedCost,
    actualCost: state.actualCost,
    executionTime: Date.now() - state.startTime,
    error: state.error,
    traces: state.executionTraces.map(t => ({
      agent: t.agentName,
      action: t.action,
      status: t.status,
      duration: t.executionTimeMs
    }))
  };
}

