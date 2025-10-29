/**
 * Type definitions for the query processor service
 * Generated from Protobuf schemas
 */

export interface QueryIntent {
  originalQuery: string;
  intentType: string;
  detectedEntities: string[];
  attributes: Record<string, string>;
  tone: string;
  confidence: number;
  timestamp: number;
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

// Request/Response types for API endpoints
export interface AnalyzeIntentRequest {
  query: string;
  userContext?: Record<string, string>;
}

export interface AnalyzeIntentResponse {
  intent: QueryIntent;
  clarification: ClarificationRequest;
}

export interface EnrichContextRequest {
  clarifiedQuery: ClarifiedQuery;
}

export interface EnrichContextResponse {
  contextualQuery: ContextualQuery;
}

export interface EnrichTrendsRequest {
  contextualQuery: ContextualQuery;
}

export interface EnrichTrendsResponse {
  trendEnrichedQuery: TrendEnrichedQuery;
}

// Vertex AI Configuration
export interface VertexAIConfig {
  projectId: string;
  location: string;
  modelName: string;
  embeddingModelName: string;
}

// Cost tracking
export interface CostMetrics {
  serviceName: string;
  dailySpend: number;
  dailyBudget: number;
  remainingBudget: number;
  queryCount: number;
  killSwitchActive: boolean;
  lastReset: Date;
}

