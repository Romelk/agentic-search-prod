/**
 * Type definitions for the orchestrator service
 * Generated from Protobuf schemas
 */

export interface SearchRequest {
  query: string;
  maxResults?: number;
  filters?: Record<string, string>;
  userContext?: Record<string, string>;
}

export interface SearchResponse {
  uiResponse: FinalUIResponse;
  estimatedCost: number;
  requestId: string;
}

export interface FinalUIResponse {
  results: RankedLook[];
  executionTraces: AgentExecutionTrace[];
  queryId: string;
  totalExecutionTimeMs: number;
  metadata: Record<string, string>;
  success: boolean;
  errorMessage?: string;
}

export interface RankedLook {
  look: LookBundle;
  finalScore: number;
  scoreBreakdown: Record<string, number>;
  rank: number;
}

export interface LookBundle {
  bundleId: string;
  bundleName: string;
  items: SearchCandidate[];
  coherenceScore: number;
  styleTheme: string;
  description: string;
}

export interface SearchCandidate {
  product: Product;
  similarityScore: number;
  matchingAttributes: string[];
  matchReason: string;
}

export interface Product {
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subcategory: string;
  brand: string;
  color: string;
  size: string;
  material: string;
  styleTags: string[];
  season: string;
  gender: string;
  occasion: string;
  imageUrl: string;
  stockStatus: string;
  rating: number;
  popularityScore: number;
}

export interface AgentExecutionTrace {
  agentName: string;
  action: string;
  startTime: number;
  endTime: number;
  executionTimeMs: number;
  status: 'success' | 'error' | 'timeout';
  inputSummary: string;
  outputSummary: string;
  metadata: Record<string, string>;
}

export interface ClarificationRequest {
  needsClarification: boolean;
  questions: DynamicQuestion[];
  message: string;
  context: QueryIntent;
}

export interface DynamicQuestion {
  question: string;
  questionType: string;
  options: string[];
  contextExplanation: string;
  required: boolean;
  priority: number;
}

export interface QueryIntent {
  originalQuery: string;
  intentType: string;
  detectedEntities: string[];
  attributes: Record<string, string>;
  tone: string;
  confidence: number;
  timestamp: number;
  attributeSummary?: AttributeSummary;
  clarificationSignals?: ClarificationSignals;
}

export interface AttributeSummary {
  required: string[];
  provided: string[];
  missing: string[];
  optional?: string[];
  inferred?: string[];
  importanceWeights?: Record<string, number>;
}

export interface ClarifiedQuery {
  intent: QueryIntent;
  clarifications: Record<string, string>;
  inferredPreferences: string[];
  needsMoreInfo: boolean;
}

export interface ContextualQuery {
  clarified: ClarifiedQuery;
  location: string;
  weather: string;
  season: string;
  timeOfDay: string;
  environmentalContext: Record<string, string>;
}

export interface TrendEnrichedQuery {
  contextual: ContextualQuery;
  trendingStyles: string[];
  seasonalRecommendations: string[];
  trendConfidence: number;
}

export interface TrendSignals {
  trendingStyles: string[];
  seasonalRecommendations: string[];
  trendConfidence: number;
  season?: string;
  location?: string;
  timeOfDay?: string;
  metadata?: Record<string, string>;
}

export interface ClarificationSignals {
  recommended: boolean;
  confidence: number;
  reasons: string[];
  suggestedQuestions?: SuggestedClarification[];
}

export interface SuggestedClarification {
  attribute: string;
  questionType: string;
  rationale: string;
  priority: number;
}

// LangGraph State Interface
export interface OrchestratorState {
  // Input
  query: string;
  requestId: string;
  startTime: number;
  
  // Agent outputs
  queryIntent?: QueryIntent;
  clarificationRequest?: ClarificationRequest;
  clarifiedQuery?: ClarifiedQuery;
  contextualQuery?: ContextualQuery;
  trendEnrichedQuery?: TrendEnrichedQuery;
  trendSignals?: TrendSignals;
  searchCandidates?: SearchCandidate[];
  lookBundles?: LookBundle[];
  rankedLooks?: RankedLook[];
  validatedLooks?: RankedLook[];
  finalResponse?: FinalUIResponse;
  
  // Execution tracking
  executionTraces: AgentExecutionTrace[];
  currentStep: string;
  error?: string;
  
  // Cost tracking
  estimatedCost: number;
  actualCost: number;
  
  // Metadata
  metadata: Record<string, any>;
  activeFilters?: Record<string, string>;
}

// Service endpoints
export interface ServiceEndpoints {
  queryProcessor: string;
  vectorSearch: string;
  responsePipeline: string;
}

// Configuration
export interface OrchestratorConfig {
  serviceEndpoints: ServiceEndpoints;
  timeout: number;
  maxRetries: number;
  costLimiterConfig: {
    serviceName: string;
    dailyBudgetUSD: number;
  };
}

