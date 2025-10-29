// Real API service for production backend
import axios from 'axios';
import { SearchResponse, RankedLook, LookBundle, SearchCandidate, Product, Question, AgentExecutionTrace } from '../types';

const API_BASE_URL = 'http://localhost:3003';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SearchRequest {
  query: string;
  filters?: {
    category?: string;
    priceRange?: [number, number];
    brand?: string;
    color?: string;
    size?: string;
    occasion?: string;
    season?: string;
  };
  maxResults?: number;
}

export interface SearchApiResponse {
  uiResponse: {
    results: RankedLook[];
    executionTraces: AgentExecutionTrace[];
    queryId: string;
    totalExecutionTimeMs: number;
    metadata: {
      totalResults: number;
      searchType: string;
      agentCount: number;
    };
    success: boolean;
    errorMessage: string | null;
  };
  estimatedCost: number;
  actualCost: number;
  requestId: string;
  stateSummary: {
    requestId: string;
    currentStep: string;
    query: string;
    hasClarification: boolean;
    candidateCount: number;
    bundleCount: number;
    finalResultCount: number;
    estimatedCost: number;
    actualCost: number;
    executionTime: number;
    error: string | null;
    traces: any[];
  };
}

export const searchApi = {
  async search(request: SearchRequest): Promise<SearchApiResponse> {
    try {
      console.log('[API] Sending search request:', request);
      const response = await api.post('/api/v1/search', request);
      console.log('[API] Search response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  },

  async getHealth(): Promise<{ status: string }> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('[API] Health check error:', error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  },

  async submitFeedback(bundleId: string, feedback: { rating: number; comment?: string }): Promise<void> {
    try {
      console.log('[API] Submitting feedback:', { bundleId, feedback });
      // For now, just log the feedback since we don't have a feedback endpoint yet
      console.log('Feedback submitted:', { bundleId, feedback });
    } catch (error) {
      console.error('[API] Feedback error:', error);
      throw new Error(`Feedback submission failed: ${error.message}`);
    }
  }
};

// Helper function to convert API response to frontend format
export function convertApiResponseToSearchResponse(apiResponse: SearchApiResponse): SearchResponse {
  return {
    results: apiResponse.uiResponse.results,
    executionTraces: apiResponse.uiResponse.executionTraces,
    queryId: apiResponse.uiResponse.queryId,
    totalExecutionTimeMs: apiResponse.uiResponse.totalExecutionTimeMs,
    metadata: {
      totalResults: apiResponse.uiResponse.metadata.totalResults,
      searchType: apiResponse.uiResponse.metadata.searchType,
      agentCount: apiResponse.uiResponse.metadata.agentCount,
    },
    success: apiResponse.uiResponse.success,
    errorMessage: apiResponse.uiResponse.errorMessage,
  };
}

