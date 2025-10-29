/**
 * Orchestrator Agents - Implementation of each agent in the workflow
 * These agents coordinate with microservices to execute the search pipeline
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  OrchestratorState, 
  QueryIntent, 
  ClarificationRequest, 
  ClarifiedQuery,
  ContextualQuery,
  TrendEnrichedQuery,
  SearchCandidate,
  LookBundle,
  RankedLook,
  FinalUIResponse,
  AgentExecutionTrace
} from '../types';

// Service endpoints configuration
const SERVICE_ENDPOINTS = {
  queryProcessor: process.env.QUERY_PROCESSOR_URL || 'http://localhost:8081',
  vectorSearch: process.env.VECTOR_SEARCH_URL || 'http://localhost:8082',
  responsePipeline: process.env.RESPONSE_PIPELINE_URL || 'http://localhost:8083'
};

/**
 * Helper function to create execution trace
 */
function createTrace(
  agentName: string,
  action: string,
  startTime: number,
  status: 'success' | 'error' | 'timeout',
  inputSummary: string,
  outputSummary: string,
  metadata: Record<string, string> = {}
): AgentExecutionTrace {
  const endTime = Date.now();
  return {
    agentName,
    action,
    startTime,
    endTime,
    executionTimeMs: endTime - startTime,
    status,
    inputSummary,
    outputSummary,
    metadata
  };
}

/**
 * Ivy Interpreter - Query Intent Analysis
 */
export async function queryIntentNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('ivy', 'analyze_query_intent', startTime, 'success', state.query, '');
  
  try {
    console.log(`[Ivy] Analyzing query intent: "${state.query}"`);
    
    // Call query processor service
    const response = await axios.post(`${SERVICE_ENDPOINTS.queryProcessor}/api/v1/analyze-intent`, {
      query: state.query,
      userContext: state.metadata.userContext || {}
    });
    
    const queryIntent: QueryIntent = response.data.intent;
    const clarificationRequest: ClarificationRequest = response.data.clarification;
    
    trace.outputSummary = `Intent: ${queryIntent.intentType}, Confidence: ${queryIntent.confidence}`;
    trace.metadata = {
      intentType: queryIntent.intentType,
      confidence: queryIntent.confidence.toString(),
      needsClarification: clarificationRequest.needsClarification.toString()
    };
    
    return {
      queryIntent,
      clarificationRequest,
      currentStep: 'query_intent_completed',
      executionTraces: [...state.executionTraces, trace]
    };
    
  } catch (error) {
    trace.status = 'error';
    trace.outputSummary = `Error: ${error.message}`;
    
    return {
      error: `Ivy agent failed: ${error.message}`,
      currentStep: 'query_intent_failed',
      executionTraces: [...state.executionTraces, trace]
    };
  }
}

/**
 * Nori Clarifier - Dynamic Question Generation
 */
export async function clarificationNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('nori', 'generate_clarification', startTime, 'success', '', '');
  
  try {
    console.log(`[Nori] Generating clarification questions`);
    
    // If clarification request already exists, return it
    if (state.clarificationRequest) {
      trace.outputSummary = `Generated ${state.clarificationRequest.questions.length} questions`;
      trace.metadata = {
        questionCount: state.clarificationRequest.questions.length.toString(),
        needsClarification: state.clarificationRequest.needsClarification.toString()
      };
      
      return {
        currentStep: 'clarification_completed',
        executionTraces: [...state.executionTraces, trace]
      };
    }
    
    // Otherwise, this node shouldn't be reached
    throw new Error('No clarification request available');
    
  } catch (error) {
    trace.status = 'error';
    trace.outputSummary = `Error: ${error.message}`;
    
    return {
      error: `Nori agent failed: ${error.message}`,
      currentStep: 'clarification_failed',
      executionTraces: [...state.executionTraces, trace]
    };
  }
}

/**
 * Gale Context Keeper - Environmental Context Enrichment
 */
export async function contextEnrichmentNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('gale', 'enrich_context', startTime, 'success', '', '');
  
  try {
    console.log(`[Gale] Enriching with environmental context`);
    
    // Call query processor service for context enrichment
    const response = await axios.post(`${SERVICE_ENDPOINTS.queryProcessor}/api/v1/enrich-context`, {
      clarifiedQuery: state.clarifiedQuery || {
        intent: state.queryIntent!,
        clarifications: {},
        inferredPreferences: [],
        needsMoreInfo: false
      }
    });
    
    const contextualQuery: ContextualQuery = response.data;
    
    trace.outputSummary = `Added location: ${contextualQuery.location}, weather: ${contextualQuery.weather}`;
    trace.metadata = {
      location: contextualQuery.location,
      weather: contextualQuery.weather,
      season: contextualQuery.season
    };
    
    return {
      contextualQuery,
      currentStep: 'context_enrichment_completed',
      executionTraces: [...state.executionTraces, trace]
    };
    
  } catch (error) {
    trace.status = 'error';
    trace.outputSummary = `Error: ${error.message}`;
    
    return {
      error: `Gale agent failed: ${error.message}`,
      currentStep: 'context_enrichment_failed',
      executionTraces: [...state.executionTraces, trace]
    };
  }
}

/**
 * Vogue Trend Whisperer - Trend Analysis
 */
export async function trendEnrichmentNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('vogue', 'analyze_trends', startTime, 'success', '', '');
  
  try {
    console.log(`[Vogue] Analyzing trends and seasonal recommendations`);
    
    // Call query processor service for trend analysis
    const response = await axios.post(`${SERVICE_ENDPOINTS.queryProcessor}/api/v1/enrich-trends`, {
      contextualQuery: state.contextualQuery
    });
    
    const trendEnrichedQuery: TrendEnrichedQuery = response.data;
    
    trace.outputSummary = `Found ${trendEnrichedQuery.trendingStyles.length} trending styles`;
    trace.metadata = {
      trendingStylesCount: trendEnrichedQuery.trendingStyles.length.toString(),
      trendConfidence: trendEnrichedQuery.trendConfidence.toString()
    };
    
    return {
      trendEnrichedQuery,
      currentStep: 'trend_enrichment_completed',
      executionTraces: [...state.executionTraces, trace]
    };
    
  } catch (error) {
    trace.status = 'error';
    trace.outputSummary = `Error: ${error.message}`;
    
    return {
      error: `Vogue agent failed: ${error.message}`,
      currentStep: 'trend_enrichment_failed',
      executionTraces: [...state.executionTraces, trace]
    };
  }
}

/**
 * Kiko Curator - Vector Search
 */
export async function vectorSearchNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('kiko', 'vector_search', startTime, 'success', '', '');
  
  try {
    console.log(`[Kiko] Performing vector similarity search`);
    
    // Call vector search service
    const response = await axios.post(`${SERVICE_ENDPOINTS.vectorSearch}/api/v1/search/semantic`, {
      query: state.query,
      trendEnrichedQuery: state.trendEnrichedQuery,
      maxResults: state.metadata.maxResults || 20
    });
    
    const searchCandidates: SearchCandidate[] = response.data.candidates;
    
    trace.outputSummary = `Found ${searchCandidates.length} candidates`;
    trace.metadata = {
      candidateCount: searchCandidates.length.toString(),
      avgScore: (searchCandidates.reduce((sum, c) => sum + c.similarityScore, 0) / searchCandidates.length).toFixed(3)
    };
    
    return {
      searchCandidates,
      currentStep: 'vector_search_completed',
      executionTraces: [...state.executionTraces, trace]
    };
    
  } catch (error) {
    trace.status = 'error';
    trace.outputSummary = `Error: ${error.message}`;
    
    return {
      error: `Kiko agent failed: ${error.message}`,
      currentStep: 'vector_search_failed',
      executionTraces: [...state.executionTraces, trace]
    };
  }
}

/**
 * Weave Composer - Bundle Creation
 */
export async function bundleCreationNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('weave', 'create_bundles', startTime, 'success', '', '');
  
  try {
    console.log(`[Weave] Creating product bundles and looks`);
    
    // Call response pipeline service
    const response = await axios.post(`${SERVICE_ENDPOINTS.responsePipeline}/api/v1/create-bundles`, {
      searchCandidates: state.searchCandidates,
      trendEnrichedQuery: state.trendEnrichedQuery
    });
    
    const lookBundles: LookBundle[] = response.data.bundles;
    
    trace.outputSummary = `Created ${lookBundles.length} look bundles`;
    trace.metadata = {
      bundleCount: lookBundles.length.toString(),
      avgCoherenceScore: (lookBundles.reduce((sum, b) => sum + b.coherenceScore, 0) / lookBundles.length).toFixed(3)
    };
    
    return {
      lookBundles,
      currentStep: 'bundle_creation_completed',
      executionTraces: [...state.executionTraces, trace]
    };
    
  } catch (error) {
    trace.status = 'error';
    trace.outputSummary = `Error: ${error.message}`;
    
    return {
      error: `Weave agent failed: ${error.message}`,
      currentStep: 'bundle_creation_failed',
      executionTraces: [...state.executionTraces, trace]
    };
  }
}

/**
 * Judge Ranker - Scoring and Ranking
 */
export async function rankingNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('judge', 'rank_looks', startTime, 'success', '', '');
  
  try {
    console.log(`[Judge] Scoring and ranking look bundles`);
    
    // Call response pipeline service
    const response = await axios.post(`${SERVICE_ENDPOINTS.responsePipeline}/api/v1/rank-looks`, {
      lookBundles: state.lookBundles,
      trendEnrichedQuery: state.trendEnrichedQuery
    });
    
    const rankedLooks: RankedLook[] = response.data.rankedBundles;
    
    trace.outputSummary = `Ranked ${rankedLooks.length} looks`;
    trace.metadata = {
      rankedCount: rankedLooks.length.toString(),
      topScore: rankedLooks[0]?.score?.toFixed(3) || '0'
    };
    
    return {
      rankedLooks,
      currentStep: 'ranking_completed',
      executionTraces: [...state.executionTraces, trace]
    };
    
  } catch (error) {
    trace.status = 'error';
    trace.outputSummary = `Error: ${error.message}`;
    
    return {
      error: `Judge agent failed: ${error.message}`,
      currentStep: 'ranking_failed',
      executionTraces: [...state.executionTraces, trace]
    };
  }
}

/**
 * Sage Explainer - Response Generation
 */
export async function responseGenerationNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('sage', 'generate_response', startTime, 'success', '', '');
  
  try {
    console.log(`[Sage] Generating final response with explanations`);
    
    // Call response pipeline service
    const response = await axios.post(`${SERVICE_ENDPOINTS.responsePipeline}/api/v1/generate-response`, {
      rankedLooks: state.rankedLooks,
      trendEnrichedQuery: state.trendEnrichedQuery,
      requestId: state.requestId
    });
    
    const finalResponse: FinalUIResponse = response.data;
    
    trace.outputSummary = `Generated response with ${finalResponse.results.length} results`;
    trace.metadata = {
      resultCount: finalResponse.results.length.toString(),
      success: finalResponse.success.toString()
    };
    
    return {
      finalResponse,
      currentStep: 'response_generation_completed',
      executionTraces: [...state.executionTraces, trace]
    };
    
  } catch (error) {
    trace.status = 'error';
    trace.outputSummary = `Error: ${error.message}`;
    
    return {
      error: `Sage agent failed: ${error.message}`,
      currentStep: 'response_generation_failed',
      executionTraces: [...state.executionTraces, trace]
    };
  }
}
