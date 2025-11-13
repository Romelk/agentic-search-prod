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
  TrendSignals,
  SearchCandidate,
  LookBundle,
  RankedLook,
  FinalUIResponse,
  AgentExecutionTrace,
  Product
} from '../types';

// Service endpoints configuration
const SERVICE_ENDPOINTS = {
  queryProcessor: process.env.QUERY_PROCESSOR_URL || 'http://localhost:8081',
  vectorSearch: process.env.VECTOR_SEARCH_URL || 'http://localhost:8082',
  responsePipeline: process.env.RESPONSE_PIPELINE_URL || 'http://localhost:8083'
};

type FiltersMap = Record<string, string>;

function parseFiltersFromMetadata(metadata?: Record<string, any>): FiltersMap | undefined {
  if (!metadata || !metadata.filters) {
    return undefined;
  }

  try {
    const parsed = typeof metadata.filters === 'string'
      ? JSON.parse(metadata.filters)
      : metadata.filters;

    if (!parsed || typeof parsed !== 'object') {
      return undefined;
    }

    const filters: FiltersMap = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Normalize price range arrays into min/max filters
      if (key === 'priceRange' && Array.isArray(value)) {
        const [min, max] = value as Array<string | number | null | undefined>;
        if (typeof min === 'number' && !Number.isNaN(min)) {
          filters.min_price = min.toString();
        }
        if (typeof max === 'number' && !Number.isNaN(max) && max > 0) {
          filters.max_price = max.toString();
        }
        continue;
      }

      const normalizedKey = key.toLowerCase();
      if (typeof value === 'string') {
        filters[normalizedKey] = value.toLowerCase();
      } else if (typeof value === 'number') {
        filters[normalizedKey] = value.toString();
      }
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  } catch (error) {
    console.warn('[Orchestrator] Failed to parse filters metadata:', error);
    return undefined;
  }
}

function buildTrendSignalsPayload(
  trendEnrichedQuery?: TrendEnrichedQuery,
  contextualQuery?: ContextualQuery
): TrendSignals | undefined {
  if (!trendEnrichedQuery) {
    return undefined;
  }

  const contextual = trendEnrichedQuery.contextual || contextualQuery;

  return {
    trendingStyles: trendEnrichedQuery.trendingStyles || [],
    seasonalRecommendations: trendEnrichedQuery.seasonalRecommendations || [],
    trendConfidence: trendEnrichedQuery.trendConfidence ?? 0,
    season: contextual?.season,
    location: contextual?.location,
    timeOfDay: contextual?.timeOfDay,
    metadata: contextual?.environmentalContext
  };
}

function normalizeSearchCandidate(candidate: any, query: string): SearchCandidate {
  const productPayload = candidate.product || candidate.metadata || candidate;
  const similarity =
    candidate.similarityScore ??
    candidate.similarity_score ??
    candidate.score ??
    0;
  const matchingAttributes =
    candidate.matchingAttributes ??
    candidate.matching_attributes ??
    [];
  const matchReason =
    candidate.matchReason ??
    candidate.match_reason ??
    `Matches your search for "${query}"`;

  const product: Product = {
    sku: productPayload.sku || productPayload.id || candidate.id || `SKU-${Date.now()}`,
    name: productPayload.name || 'Unknown Product',
    description: productPayload.description || '',
    price: productPayload.price || 0,
    currency: productPayload.currency || 'USD',
    category: productPayload.category || '',
    subcategory: productPayload.subcategory || '',
    brand: productPayload.brand || '',
    color: productPayload.color || '',
    size: productPayload.size || '',
    material: productPayload.material || '',
    styleTags: Array.isArray(productPayload.styleTags)
      ? productPayload.styleTags
      : Array.isArray(productPayload.style_tags)
        ? productPayload.style_tags
        : (typeof productPayload.style_tags === 'string'
          ? productPayload.style_tags.split(',').map((s: string) => s.trim())
          : []),
    season: productPayload.season || '',
    gender: productPayload.gender || '',
    occasion: productPayload.occasion || '',
    imageUrl: productPayload.imageUrl || productPayload.image_url || '',
    stockStatus: productPayload.stockStatus || productPayload.stock_status || 'in_stock',
    rating: productPayload.rating || 0,
    popularityScore: productPayload.popularityScore || productPayload.popularity_score || 0
  };

  return {
    product,
    similarityScore: Number.isFinite(similarity) ? similarity : 0,
    matchingAttributes: Array.isArray(matchingAttributes)
      ? matchingAttributes
      : [],
    matchReason
  };
}

function normalizeLookBundle(bundle: any, query: string): LookBundle {
  const bundleId =
    bundle.bundleId ||
    bundle.bundle_id ||
    bundle.id ||
    `bundle-${Date.now()}`;
  const bundleName =
    bundle.bundleName ||
    bundle.bundle_name ||
    bundle.name ||
    `Look ${bundleId}`;
  const styleTheme =
    bundle.styleTheme ||
    bundle.style_theme ||
    bundle.style ||
    'mixed';
  const description =
    bundle.description ||
    bundle.summary ||
    bundle.explanation ||
    '';

  const rawItems = bundle.items || bundle.products || [];
  const items: SearchCandidate[] = rawItems.map((item: any) =>
    normalizeSearchCandidate(item, query)
  );

  const coherence =
    bundle.coherenceScore ||
    bundle.coherence_score ||
    bundle.score ||
    0.8;

  return {
    bundleId,
    bundleName,
    items,
    coherenceScore: coherence,
    styleTheme,
    description
  };
}

function deriveStyleThemes(trendSignals?: TrendSignals): string[] {
  const themes = new Set<string>();

  if (trendSignals) {
    const styleToThemeMap: Record<string, string> = {
      formal: 'formal',
      work: 'work',
      office: 'work',
      party: 'party',
      evening: 'party',
      wedding: 'formal',
      casual: 'casual',
      relaxed: 'casual',
      summer: 'summer',
      winter: 'winter',
      beach: 'summer'
    };

    for (const style of trendSignals.trendingStyles || []) {
      const normalized = style.toLowerCase();
      const mapped = styleToThemeMap[normalized] || (normalized.includes('casual') ? 'casual' : undefined);
      if (mapped) themes.add(mapped);
    }

    for (const recommendation of trendSignals.seasonalRecommendations || []) {
      const normalized = recommendation.toLowerCase();
      if (normalized.includes('wedding')) themes.add('formal');
      if (normalized.includes('party') || normalized.includes('evening')) themes.add('party');
      if (normalized.includes('work') || normalized.includes('office')) themes.add('work');
    }

    if (trendSignals.season) {
      themes.add(trendSignals.season.toLowerCase());
    }
  }

  if (themes.size === 0) {
    return ['casual', 'formal', 'mixed'];
  }

  return Array.from(themes).slice(0, 4);
}

function buildUserPreferences(
  contextualQuery?: ContextualQuery,
  filters?: FiltersMap
): Record<string, unknown> {
  const preferences: Record<string, unknown> = {};

  if (contextualQuery) {
    if (contextualQuery.season) {
      preferences.season = contextualQuery.season;
    }
    if (contextualQuery.location) {
      preferences.location = contextualQuery.location;
    }
    if (contextualQuery.timeOfDay) {
      preferences.timeOfDay = contextualQuery.timeOfDay;
    }

    const clarified = contextualQuery.clarified;
    if (clarified?.clarifications) {
      if (clarified.clarifications.budget) {
        preferences.budget = clarified.clarifications.budget;
      }
      if (clarified.clarifications.occasion) {
        preferences.occasion = clarified.clarifications.occasion;
      }
      if (clarified.clarifications.color) {
        preferences.color = clarified.clarifications.color;
      }
    }
  }

  if (filters) {
    if (filters.occasion) {
      preferences.occasion = filters.occasion;
    }
    if (filters.color) {
      preferences.color = filters.color;
    }
    if (filters.min_price || filters.max_price) {
      preferences.priceRange = {
        min: filters.min_price,
        max: filters.max_price
      };
    }
  }

  return preferences;
}

function parseUserContextFromMetadata(metadata?: Record<string, any>): Record<string, unknown> {
  if (!metadata?.userContext) {
    return {};
  }

  try {
    return typeof metadata.userContext === 'string'
      ? JSON.parse(metadata.userContext)
      : metadata.userContext;
  } catch (error) {
    console.warn('[Orchestrator] Failed to parse user context metadata:', error);
    return {};
  }
}

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
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
    
  } catch (error) {
    trace.status = 'error';
    const errorMessage = error instanceof Error ? error.message : String(error);
    trace.outputSummary = `Error: ${errorMessage}`;
    
    return {
      error: `Ivy agent failed: ${errorMessage}`,
      currentStep: 'query_intent_failed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
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
        executionTraces: [trace] // Return only the new trace; reducer will accumulate
      };
    }
    
    // Otherwise, this node shouldn't be reached
    throw new Error('No clarification request available');
    
  } catch (error) {
    trace.status = 'error';
    const errorMessage = error instanceof Error ? error.message : String(error);
    trace.outputSummary = `Error: ${errorMessage}`;
    
    return {
      error: `Nori agent failed: ${errorMessage}`,
      currentStep: 'clarification_failed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
  }
}

/**
 * Gale Context Keeper - Environmental Context Enrichment
 */
export async function contextEnrichmentNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const queryText = state.queryIntent?.originalQuery || state.query || '';
  const trace = createTrace('gale', 'enrich_context', startTime, 'success', queryText, '');
  
  try {
    console.log(`[Gale] Enriching with environmental context`);
    
    // Call query processor service for context enrichment
    const clarifiedQuery = state.clarifiedQuery || {
      intent: state.queryIntent!,
      clarifications: {},
      inferredPreferences: [],
      needsMoreInfo: false
    };
    
    const response = await axios.post(`${SERVICE_ENDPOINTS.queryProcessor}/api/v1/enrich-context`, {
      clarifiedQuery
    });
    
    // Extract contextualQuery from response (response.data.contextualQuery)
    const contextualQuery: ContextualQuery = response.data.contextualQuery || response.data;
    
    trace.outputSummary = `Added location: ${contextualQuery.location}, weather: ${contextualQuery.weather}`;
    trace.metadata = {
      location: contextualQuery.location,
      weather: contextualQuery.weather,
      season: contextualQuery.season
    };
    
    return {
      contextualQuery,
      currentStep: 'context_enrichment_completed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
    
  } catch (error) {
    trace.status = 'error';
    const errorMessage = error instanceof Error ? error.message : String(error);
    trace.outputSummary = `Error: ${errorMessage}`;
    
    return {
      error: `Gale agent failed: ${errorMessage}`,
      currentStep: 'context_enrichment_failed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
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
    
    // Extract trendEnrichedQuery from response (response.data.trendEnrichedQuery)
    const trendEnrichedQuery: TrendEnrichedQuery = response.data.trendEnrichedQuery || response.data;
    
    trace.outputSummary = `Found ${trendEnrichedQuery.trendingStyles.length} trending styles`;
    trace.metadata = {
      trendingStylesCount: trendEnrichedQuery.trendingStyles.length.toString(),
      trendConfidence: trendEnrichedQuery.trendConfidence.toString()
    };
    
    return {
      trendEnrichedQuery,
      currentStep: 'trend_enrichment_completed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
    
  } catch (error) {
    trace.status = 'error';
    const errorMessage = error instanceof Error ? error.message : String(error);
    trace.outputSummary = `Error: ${errorMessage}`;
    
    return {
      error: `Vogue agent failed: ${errorMessage}`,
      currentStep: 'trend_enrichment_failed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
  }
}

/**
 * Kiko Curator - Vector Search
 */
export async function vectorSearchNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('kiko', 'vector_search', startTime, 'success', state.query, '');
  
  try {
    console.log(`[Kiko] Performing vector similarity search`);
    
    const maxResults = parseInt(state.metadata?.maxResults || '20', 10) || 20;
    const filters = parseFiltersFromMetadata(state.metadata);
    const trendSignals = buildTrendSignalsPayload(state.trendEnrichedQuery, state.contextualQuery);

    const requestPayload: any = {
      query: state.query,
      maxResults
    };

    if (filters) {
      requestPayload.filters = filters;
    }
    if (trendSignals) {
      requestPayload.trendSignals = trendSignals;
    }
    if (state.trendEnrichedQuery) {
      requestPayload.trendEnrichedQuery = state.trendEnrichedQuery;
    }

    let response;
    try {
      response = await axios.post(`${SERVICE_ENDPOINTS.vectorSearch}/api/v1/search/semantic`, requestPayload);
    } catch (error) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const status = isAxiosError ? (error as any).response?.status : undefined;
      if (status === 404 || status === 400) {
        console.warn('[Kiko] Primary vector search endpoint unavailable, attempting fallback payload shape');
        response = await axios.post(`${SERVICE_ENDPOINTS.vectorSearch}/api/v1/search/semantic`, {
          query: state.query,
          trendEnrichedQuery: state.trendEnrichedQuery,
          maxResults,
          filters
        });
      } else {
        throw error;
      }
    }

    const rawCandidates = response?.data?.candidates || [];
    const searchCandidates: SearchCandidate[] = rawCandidates.map((candidate: any) =>
      normalizeSearchCandidate(candidate, state.query)
    );

    const averageScore =
      searchCandidates.length > 0
        ? searchCandidates.reduce((sum, c) => sum + c.similarityScore, 0) / searchCandidates.length
        : 0;

    trace.outputSummary = `Found ${searchCandidates.length} candidates`;
    trace.metadata = {
      candidateCount: searchCandidates.length.toString(),
      avgScore: averageScore.toFixed(3),
      filtersApplied: filters ? Object.keys(filters).join(',') : 'none',
      trendBoost: trendSignals ? trendSignals.trendConfidence.toFixed(2) : 'n/a'
    };
    
    return {
      searchCandidates,
      trendSignals,
      activeFilters: filters,
      currentStep: 'vector_search_completed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
    
  } catch (error) {
    trace.status = 'error';
    const isAxiosError = error && typeof error === 'object' && 'response' in error;
    const isConnectionError = isAxiosError && (error as any).code === 'ECONNREFUSED';
    const is404 = isAxiosError && (error as any).response?.status === 404;
    const errorMessage = is404 || isConnectionError
      ? `Vector Search service unavailable at ${SERVICE_ENDPOINTS.vectorSearch}. Service may not be running.`
      : (error instanceof Error ? error.message : String(error));
    trace.outputSummary = `Error: ${errorMessage}`;
    
    console.warn(`[Kiko] Vector Search service unavailable, using fallback: ${errorMessage}`);
    
    // Fallback: Use query processor to get mock candidates
    // This allows the workflow to continue even if vector search is unavailable
    const fallbackCandidates: SearchCandidate[] = [];
    
    return {
      searchCandidates: fallbackCandidates,
      error: `Kiko agent (Vector Search) unavailable: ${errorMessage}. Continuing with limited results.`,
      currentStep: 'vector_search_fallback',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
  }
}

/**
 * Weave Composer - Bundle Creation
 */
export async function bundleCreationNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('weave', 'create_bundles', startTime, 'success', '', '');
  const trendSignals =
    state.trendSignals || buildTrendSignalsPayload(state.trendEnrichedQuery, state.contextualQuery);
  const maxResults = parseInt(state.metadata?.maxResults || '10', 10) || 10;
  const styleThemes = deriveStyleThemes(trendSignals);
  const maxBundles = Math.max(1, Math.min(6, Math.ceil(maxResults / 2)));

  try {
    console.log(`[Weave] Creating product bundles and looks`);

    const requestPayload: any = {
      searchCandidates: state.searchCandidates,
      styleThemes,
      maxBundles,
      trendSignals
    };

    let response;
    try {
      response = await axios.post(
        `${SERVICE_ENDPOINTS.responsePipeline}/api/v1/pipeline/bundles`,
        requestPayload
      );
    } catch (error) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const status = isAxiosError ? (error as any).response?.status : undefined;
      if (status === 404 || status === 400) {
        console.warn('[Weave] Pipeline bundles endpoint unavailable, falling back to legacy mock endpoint');
        response = await axios.post(`${SERVICE_ENDPOINTS.responsePipeline}/api/v1/create-bundles`, {
          searchCandidates: state.searchCandidates,
          trendEnrichedQuery: state.trendEnrichedQuery
        });
      } else {
        throw error;
      }
    }

    const rawBundles = response?.data?.bundles || response?.data?.lookBundles || [];
    const lookBundles: LookBundle[] = rawBundles
      .map((bundle: any) => normalizeLookBundle(bundle, state.query))
      .filter(bundle => bundle.items.length > 0);

    trace.outputSummary = `Created ${lookBundles.length} look bundles`;
    trace.metadata = {
      bundleCount: lookBundles.length.toString(),
      themes: styleThemes.join(','),
      avgCoherenceScore: lookBundles.length > 0
        ? (lookBundles.reduce((sum, b) => sum + b.coherenceScore, 0) / lookBundles.length).toFixed(3)
        : '0.000'
    };
    
    return {
      lookBundles,
      trendSignals,
      currentStep: 'bundle_creation_completed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
    
  } catch (error) {
    trace.status = 'error';
    const isAxiosError = error && typeof error === 'object' && 'response' in error;
    const isConnectionError = isAxiosError && (error as any).code === 'ECONNREFUSED';
    const is404 = isAxiosError && (error as any).response?.status === 404;
    const errorMessage = is404 || isConnectionError
      ? `Response Pipeline service unavailable at ${SERVICE_ENDPOINTS.responsePipeline}. Service may not be running.`
      : (error instanceof Error ? error.message : String(error));
    trace.outputSummary = `Error: ${errorMessage}`;
    
    console.warn(`[Weave] Response Pipeline service unavailable: ${errorMessage}`);
    
    // Fallback: Create simple bundles from candidates
    const fallbackBundles: LookBundle[] = state.searchCandidates && state.searchCandidates.length > 0
      ? [{
          bundleId: `fallback_bundle_${Date.now()}`,
          bundleName: `${state.query} Look`,
          items: state.searchCandidates.slice(0, 3),
          coherenceScore: 0.7,
          styleTheme: 'mixed',
          description: `Fallback bundle created from available candidates`
        }]
      : [];
    
    return {
      lookBundles: fallbackBundles,
      trendSignals,
      error: `Weave agent (Response Pipeline) unavailable: ${errorMessage}. Using fallback bundles.`,
      currentStep: 'bundle_creation_fallback',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
  }
}

/**
 * Judge Ranker - Scoring and Ranking
 */
export async function rankingNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('judge', 'rank_looks', startTime, 'success', '', '');
  const filters = state.activeFilters || parseFiltersFromMetadata(state.metadata);
  const userPreferences = buildUserPreferences(state.contextualQuery, filters);
  const trendSignals =
    state.trendSignals || buildTrendSignalsPayload(state.trendEnrichedQuery, state.contextualQuery);
  
  try {
    console.log(`[Judge] Scoring and ranking look bundles`);
    
    const maxResults = Math.max(
      1,
      Math.min(
        parseInt(state.metadata?.maxResults || '5', 10) || 5,
        state.lookBundles?.length || 5
      )
    );

    const requestPayload: any = {
      bundles: state.lookBundles,
      userPreferences,
      maxResults
    };

    let response;
    try {
      response = await axios.post(
        `${SERVICE_ENDPOINTS.responsePipeline}/api/v1/pipeline/rank`,
        requestPayload
      );
    } catch (error) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const status = isAxiosError ? (error as any).response?.status : undefined;
      if (status === 404 || status === 400) {
        console.warn('[Judge] Pipeline rank endpoint unavailable, falling back to legacy mock endpoint');
        response = await axios.post(`${SERVICE_ENDPOINTS.responsePipeline}/api/v1/rank-looks`, {
          lookBundles: state.lookBundles,
          trendEnrichedQuery: state.trendEnrichedQuery
        });
      } else {
        throw error;
      }
    }
    
    const rankedPayload = response?.data?.rankedLooks || response?.data?.rankedBundles || [];
    const rankedLooks: RankedLook[] = rankedPayload.map((entry: any, index: number) => {
      const lookPayload = entry.look || entry.bundle || entry;
      const lookBundle = normalizeLookBundle(lookPayload, state.query);
      const finalScore =
        entry.finalScore ??
        entry.score ??
        entry.coherenceScore ??
        lookBundle.coherenceScore ??
        0.8;
      const scoreBreakdown =
        entry.scoreBreakdown ||
        {
          coherence: lookBundle.coherenceScore ?? 0.8,
          style: entry?.rankingFactors?.styleMatch ?? 0.7,
          price: entry?.rankingFactors?.priceValue ?? 0.7,
          trend: trendSignals?.trendConfidence ?? 0.5
        };
      
      return {
        look: lookBundle,
        finalScore,
        scoreBreakdown,
        rank: entry.rank || index + 1
      };
    });
    
    trace.outputSummary = `Ranked ${rankedLooks.length} looks`;
    trace.metadata = {
      rankedCount: rankedLooks.length.toString(),
      topScore: rankedLooks[0]?.finalScore?.toFixed(3) || '0',
      preferences: Object.keys(userPreferences).join(',')
    };
    
    return {
      rankedLooks,
      trendSignals,
      activeFilters: filters,
      currentStep: 'ranking_completed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
    
  } catch (error) {
    trace.status = 'error';
    const isAxiosError = error && typeof error === 'object' && 'response' in error;
    const isConnectionError = isAxiosError && (error as any).code === 'ECONNREFUSED';
    const is404 = isAxiosError && (error as any).response?.status === 404;
    const errorMessage = is404 || isConnectionError
      ? `Response Pipeline service unavailable at ${SERVICE_ENDPOINTS.responsePipeline}. Service may not be running.`
      : (error instanceof Error ? error.message : String(error));
    trace.outputSummary = `Error: ${errorMessage}`;
    
    console.warn(`[Judge] Response Pipeline service unavailable: ${errorMessage}`);
    
    // Fallback: Simple ranking based on bundle coherence scores
    const fallbackRankedLooks: RankedLook[] = state.lookBundles
      ? state.lookBundles
          .map((bundle, index) => ({
            look: bundle,
            finalScore: bundle.coherenceScore,
            scoreBreakdown: { coherence: bundle.coherenceScore },
            rank: index + 1
          }))
          .sort((a, b) => b.finalScore - a.finalScore)
          .map((look, index) => ({ ...look, rank: index + 1 }))
      : [];
    
    return {
      rankedLooks: fallbackRankedLooks,
      trendSignals,
      error: `Judge agent (Response Pipeline) unavailable: ${errorMessage}. Using fallback ranking.`,
      currentStep: 'ranking_fallback',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
  }
}

/**
 * Aegis Guardian - Safety Validation
 */
export async function safetyValidationNode(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const startTime = Date.now();
  const trace = createTrace('aegis', 'validate_content', startTime, 'success', '', '');

  const MAX_SIMPLE_LOOKS_FOR_VALIDATION = 6;
  const candidateLooksFallback: RankedLook[] =
    (!state.rankedLooks || state.rankedLooks.length === 0) &&
    (!state.lookBundles || state.lookBundles.length === 0) &&
    state.searchCandidates && state.searchCandidates.length > 0
      ? state.searchCandidates
          .slice(0, MAX_SIMPLE_LOOKS_FOR_VALIDATION)
          .map((candidate, index) => {
            const bundle: LookBundle = {
              bundleId: candidate.product?.sku
                ? `candidate_${candidate.product.sku}`
                : `candidate_${index + 1}`,
              bundleName: candidate.product?.name || `Option ${index + 1}`,
              items: [candidate],
              coherenceScore: candidate.similarityScore || 0.7,
              styleTheme: 'single',
              description: candidate.matchReason || `Matches "${state.query}"`
            };

            return {
              look: bundle,
              finalScore: bundle.coherenceScore,
              scoreBreakdown: { coherence: bundle.coherenceScore },
              rank: index + 1
            };
          })
      : [];

  const rankedLooksInput: RankedLook[] =
    state.rankedLooks && state.rankedLooks.length > 0
      ? state.rankedLooks
      : (state.lookBundles && state.lookBundles.length > 0
          ? state.lookBundles.map((bundle, index) => ({
              look: bundle,
              finalScore: bundle.coherenceScore,
              scoreBreakdown: { coherence: bundle.coherenceScore },
              rank: index + 1
            }))
          : candidateLooksFallback);

  if (rankedLooksInput.length === 0) {
    trace.outputSummary = 'No looks to validate';
    trace.metadata = { approved: '0', rejected: '0' };
    return {
      validatedLooks: [],
      currentStep: 'safety_validation_skipped',
      executionTraces: [trace]
    };
  }

  try {
    console.log(`[Aegis] Validating ${rankedLooksInput.length} ranked looks for safety and compliance`);

    const userContext = parseUserContextFromMetadata(state.metadata);

    let response;
    try {
      response = await axios.post(
        `${SERVICE_ENDPOINTS.responsePipeline}/api/v1/pipeline/validate`,
        {
          rankedLooks: rankedLooksInput,
          userContext
        }
      );
    } catch (error) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const status = isAxiosError ? (error as any).response?.status : undefined;
      if (status === 404 || status === 400) {
        console.warn('[Aegis] Pipeline validate endpoint unavailable, falling back to legacy mock endpoint');
        response = await axios.post(`${SERVICE_ENDPOINTS.responsePipeline}/api/v1/validate-looks`, {
          rankedLooks: rankedLooksInput,
          userContext
        });
      } else {
        throw error;
      }
    }

    const approvedLooksRaw = response?.data?.approvedLooks || response?.data?.rankedLooks || [];
    const approvedLooks: RankedLook[] = approvedLooksRaw.map((item: any, index: number) => {
      const lookPayload = item.look || item.bundle || item;
      const lookBundle = normalizeLookBundle(lookPayload, state.query);
      const finalScore =
        item.finalScore ??
        item.score ??
        lookBundle.coherenceScore ??
        rankedLooksInput[index]?.finalScore ??
        0.8;

      return {
        look: lookBundle,
        finalScore,
        scoreBreakdown: item.scoreBreakdown || rankedLooksInput[index]?.scoreBreakdown || { coherence: lookBundle.coherenceScore },
        rank: item.rank || index + 1
      };
    });

    const rejectedCount = Math.max(0, rankedLooksInput.length - approvedLooks.length);

    trace.outputSummary = `Approved ${approvedLooks.length} looks`;
    trace.metadata = {
      approved: approvedLooks.length.toString(),
      rejected: rejectedCount.toString()
    };

    return {
      validatedLooks: approvedLooks,
      currentStep: 'safety_validation_completed',
      executionTraces: [trace]
    };
  } catch (error) {
    trace.status = 'error';
    const isAxiosError = error && typeof error === 'object' && 'response' in error;
    const isConnectionError = isAxiosError && (error as any).code === 'ECONNREFUSED';
    const is404 = isAxiosError && (error as any).response?.status === 404;
    const errorMessage = is404 || isConnectionError
      ? `Response Pipeline service unavailable at ${SERVICE_ENDPOINTS.responsePipeline}. Service may not be running.`
      : (error instanceof Error ? error.message : String(error));
    trace.outputSummary = `Error: ${errorMessage}`;

    console.warn(`[Aegis] Validation service unavailable: ${errorMessage}`);

    return {
      validatedLooks: rankedLooksInput,
      error: `Aegis agent (Response Pipeline) unavailable: ${errorMessage}. Continuing with unvalidated looks.`,
      currentStep: 'safety_validation_fallback',
      executionTraces: [trace]
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

    const rankedLooks = state.validatedLooks?.length
      ? state.validatedLooks
      : state.rankedLooks || [];

    if (rankedLooks.length === 0 && (!state.searchCandidates || state.searchCandidates.length === 0)) {
      trace.outputSummary = 'No results available to explain';
      trace.metadata = { resultCount: '0', success: 'false' };
      return {
        finalResponse: {
          results: [],
          executionTraces: [...state.executionTraces, trace],
          queryId: state.requestId,
          totalExecutionTimeMs: Date.now() - state.startTime,
          metadata: {
            totalResults: '0',
            searchType: 'semantic',
            agentCount: state.executionTraces.length.toString()
          },
          success: false,
          errorMessage: 'No results available to present'
        },
        currentStep: 'response_generation_completed',
        executionTraces: [trace]
      };
    }

    let response;
    try {
      response = await axios.post(`${SERVICE_ENDPOINTS.responsePipeline}/api/v1/pipeline/explain`, {
        rankedLooks,
        userQuery: state.query
      });
    } catch (error) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const status = isAxiosError ? (error as any).response?.status : undefined;
      if (status === 404 || status === 400) {
        console.warn('[Sage] Pipeline explain endpoint unavailable, falling back to legacy mock endpoint');
        response = await axios.post(`${SERVICE_ENDPOINTS.responsePipeline}/api/v1/generate-response`, {
          rankedLooks,
          trendEnrichedQuery: state.trendEnrichedQuery,
          requestId: state.requestId
        });
      } else {
        throw error;
      }
    }
    
    const explainedPayload = response?.data?.explainedLooks ||
      response?.data?.rankedLooks ||
      response?.data?.results ||
      rankedLooks;

    const results: RankedLook[] = explainedPayload.map((entry: any, index: number) => {
      if (entry.look && entry.finalScore !== undefined) {
        return {
          look: normalizeLookBundle(entry.look, state.query),
          finalScore: entry.finalScore,
          scoreBreakdown: entry.scoreBreakdown || { coherence: entry.look.coherenceScore ?? 0.8 },
          rank: entry.rank || index + 1
        };
      }

      const lookBundle = normalizeLookBundle(entry, state.query);
      return {
        look: lookBundle,
        finalScore: entry.finalScore ?? entry.score ?? lookBundle.coherenceScore ?? 0.8,
        scoreBreakdown: entry.scoreBreakdown || { coherence: lookBundle.coherenceScore ?? 0.8 },
        rank: entry.rank || index + 1
      };
    });

    const metadataFromResponse = response?.data?.metadata || {};

    const finalResponse: FinalUIResponse = {
      results,
      executionTraces: [...state.executionTraces, trace], // Include all accumulated traces plus Sage's trace
      queryId: response?.data?.queryId || state.requestId,
      totalExecutionTimeMs: response?.data?.totalExecutionTimeMs || (Date.now() - state.startTime),
      metadata: {
        ...metadataFromResponse,
        totalResults: results.length.toString(),
        searchType: metadataFromResponse?.searchType || 'semantic',
        agentCount: state.executionTraces.length.toString()
      },
      success: response?.data?.success !== false,
      errorMessage: response?.data?.errorMessage || undefined
    };
    
    trace.outputSummary = `Generated response with ${finalResponse.results.length} results`;
    trace.metadata = {
      resultCount: finalResponse.results.length.toString(),
      success: finalResponse.success.toString()
    };
    
    return {
      finalResponse,
      currentStep: 'response_generation_completed',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
    
  } catch (error) {
    trace.status = 'error';
    const isAxiosError = error && typeof error === 'object' && 'response' in error;
    const isConnectionError = isAxiosError && (error as any).code === 'ECONNREFUSED';
    const is404 = isAxiosError && (error as any).response?.status === 404;
    const errorMessage = is404 || isConnectionError
      ? `Response Pipeline service unavailable at ${SERVICE_ENDPOINTS.responsePipeline}. Service may not be running.`
      : (error instanceof Error ? error.message : String(error));
    trace.outputSummary = `Error: ${errorMessage}`;
    
    console.warn(`[Sage] Response Pipeline service unavailable: ${errorMessage}`);
    
    // Fallback: Create FinalUIResponse from rankedLooks in state
    const fallbackResults: RankedLook[] = state.validatedLooks?.length
      ? state.validatedLooks
      : (state.rankedLooks || []);
    
    const fallbackResponse: FinalUIResponse = {
      results: fallbackResults,
      executionTraces: [...state.executionTraces, trace], // Include all accumulated traces plus Sage's trace
      queryId: state.requestId,
      totalExecutionTimeMs: Date.now() - state.startTime,
      metadata: {
        totalResults: fallbackResults.length.toString(),
        searchType: 'semantic',
        agentCount: state.executionTraces.length.toString()
      },
      success: fallbackResults.length > 0,
      errorMessage: `Sage agent (Response Pipeline) unavailable: ${errorMessage}. Using fallback response.`
    };
    
    return {
      finalResponse: fallbackResponse,
      error: `Sage agent (Response Pipeline) unavailable: ${errorMessage}. Using fallback response.`,
      currentStep: 'response_generation_fallback',
      executionTraces: [trace] // Return only the new trace; reducer will accumulate
    };
  }
}
