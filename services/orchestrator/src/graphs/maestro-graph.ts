/**
 * Maestro Graph - LangGraph state machine for agentic search orchestration
 * 
 * This defines the complete workflow as a state machine in code:
 * Query → Intent → Clarified → Context → Trend → Candidates → Looks → Ranked → Final
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { OrchestratorState } from '../types';
import { 
  queryIntentNode, 
  clarificationNode, 
  contextEnrichmentNode, 
  trendEnrichmentNode,
  vectorSearchNode,
  bundleCreationNode,
  rankingNode,
  responseGenerationNode
} from '../agents/orchestrator';

/**
 * Create the Maestro orchestration graph
 */
export function createMaestroGraph() {
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
      searchCandidates: { value: [] },
      lookBundles: { value: [] },
      rankedLooks: { value: [] },
      finalResponse: { value: null },
      executionTraces: { value: [] },
      currentStep: { value: 'START' },
      error: { value: null },
      estimatedCost: { value: 0 },
      actualCost: { value: 0 },
      metadata: { value: {} }
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
  workflow.addNode('response_generation', responseGenerationNode);

  // Define the workflow edges
  workflow.addEdge(START, 'query_intent');

  // Conditional edges based on agent outputs
  workflow.addConditionalEdges(
    'query_intent',
    shouldClarify,
    {
      'clarify': 'clarification',
      'continue': 'context_enrichment'
    }
  );

  workflow.addConditionalEdges(
    'clarification',
    shouldContinueAfterClarification,
    {
      'context_enrichment': 'context_enrichment',
      'end': END
    }
  );

  workflow.addEdge('context_enrichment', 'trend_enrichment');
  workflow.addEdge('trend_enrichment', 'vector_search');
  workflow.addEdge('vector_search', 'bundle_creation');
  workflow.addEdge('bundle_creation', 'ranking');
  workflow.addEdge('ranking', 'response_generation');
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
    return 'context_enrichment';
  }
  
  // If no clarifications or user wants to skip, end the workflow
  // The response will indicate that clarification is needed
  return 'end';
}

/**
 * Export graph visualization data for monitoring
 */
export function getGraphVisualization() {
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
      { id: 'response_generation', type: 'agent', label: 'Sage\n(Response)' },
      { id: 'END', type: 'end', label: 'End' }
    ],
    edges: [
      { from: 'START', to: 'query_intent', type: 'default' },
      { from: 'query_intent', to: 'clarification', type: 'conditional', condition: 'needs_clarification' },
      { from: 'query_intent', to: 'context_enrichment', type: 'conditional', condition: 'continue' },
      { from: 'clarification', to: 'context_enrichment', type: 'conditional', condition: 'clarified' },
      { from: 'clarification', to: 'END', type: 'conditional', condition: 'end' },
      { from: 'context_enrichment', to: 'trend_enrichment', type: 'default' },
      { from: 'trend_enrichment', to: 'vector_search', type: 'default' },
      { from: 'vector_search', to: 'bundle_creation', type: 'default' },
      { from: 'bundle_creation', to: 'ranking', type: 'default' },
      { from: 'ranking', to: 'response_generation', type: 'default' },
      { from: 'response_generation', to: 'END', type: 'default' }
    ],
    metadata: {
      version: '1.0.0',
      description: 'Maestro Agentic Search Workflow',
      agents: {
        ivy: 'Query understanding and intent extraction',
        nori: 'Dynamic clarification question generation',
        gale: 'Environmental and contextual enrichment',
        vogue: 'Trend analysis and seasonal recommendations',
        kiko: 'Vector similarity search',
        weave: 'Product bundling and look creation',
        judge: 'Scoring and ranking of looks',
        sage: 'Response generation and explanation'
      }
    }
  };
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
    finalResultCount: state.rankedLooks?.length || 0,
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

