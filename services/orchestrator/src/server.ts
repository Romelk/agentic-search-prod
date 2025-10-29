/**
 * Orchestrator Service - Main server for agentic search orchestration
 * 
 * Features:
 * - LangGraph-based workflow orchestration
 * - Cost tracking and kill-switch enforcement
 * - Service discovery and health checks
 * - Request tracing and monitoring
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import { createMaestroGraph, getGraphVisualization, getStateSummary } from './graphs/maestro-graph';
import { OrchestratorState } from './types';
import { createCostLimiter, CostEstimator } from '@agentic-search/cost-limiter';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Initialize cost limiter
const costLimiter = createCostLimiter({
  serviceName: 'orchestrator',
  dailyBudgetUSD: parseFloat(process.env.DAILY_BUDGET_USD || '15'),
  killSwitchEnv: 'VERTEX_AI_KILL_SWITCH'
});

// Initialize LangGraph workflow
const maestroGraph = createMaestroGraph();

// Service endpoints
const SERVICE_ENDPOINTS = {
  queryProcessor: process.env.QUERY_PROCESSOR_URL || 'http://localhost:8081',
  vectorSearch: process.env.VECTOR_SEARCH_URL || 'http://localhost:8082',
  responsePipeline: process.env.RESPONSE_PIPELINE_URL || 'http://localhost:8083'
};

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    // Check service dependencies
    const serviceHealth = await checkServiceHealth();
    
    // Get cost metrics
    const costMetrics = await costLimiter.getMetrics();
    
    res.json({
      status: 'healthy',
      timestamp: Date.now(),
      services: serviceHealth,
      costMetrics: {
        dailySpend: costMetrics.dailySpend,
        dailyBudget: costMetrics.dailyBudget,
        remainingBudget: costMetrics.remainingBudget,
        killSwitchActive: costMetrics.killSwitchActive
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: Date.now(),
      error: error.message
    });
  }
});

/**
 * Graph visualization endpoint
 */
app.get('/api/v1/graph', (req, res) => {
  try {
    const visualization = getGraphVisualization();
    res.json(visualization);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get graph visualization',
      message: error.message
    });
  }
});

/**
 * Cost metrics endpoint
 */
app.get('/api/v1/cost/metrics', async (req, res) => {
  try {
    const metrics = await costLimiter.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cost metrics',
      message: error.message
    });
  }
});

/**
 * Main search endpoint
 */
app.post('/api/v1/search', async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  try {
    const { query, maxResults = 10, filters = {}, userContext = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query is required and must be a string'
      });
    }

    // Estimate cost before proceeding
    const estimatedCost = CostEstimator.estimateSearchQueryCost(query.length);
    
    // Check if we can proceed with cost controls
    const costCheck = await costLimiter.canProceed(estimatedCost);
    if (!costCheck.allowed) {
      console.warn(`[CostControl] Request blocked: ${costCheck.reason}`);
      return res.status(429).json({
        error: 'Request blocked',
        message: costCheck.reason,
        requestId
      });
    }

    console.log(`[Orchestrator] Starting search for: "${query}" (Request: ${requestId})`);

    // Create initial state
    const initialState: OrchestratorState = {
      query,
      requestId,
      startTime,
      executionTraces: [],
      currentStep: 'START',
      estimatedCost,
      actualCost: 0,
      metadata: {
        maxResults: maxResults.toString(),
        filters: JSON.stringify(filters),
        userContext: JSON.stringify(userContext)
      }
    };

    // Execute the LangGraph workflow
    const finalState = await maestroGraph.invoke(initialState);

    // Record actual cost
    await costLimiter.recordCost(finalState.actualCost || estimatedCost);

    // Generate response
    const response = {
      uiResponse: finalState.finalResponse || {
        results: [],
        executionTraces: finalState.executionTraces,
        queryId: requestId,
        totalExecutionTimeMs: Date.now() - startTime,
        metadata: finalState.metadata,
        success: !finalState.error,
        errorMessage: finalState.error
      },
      estimatedCost: finalState.estimatedCost,
      actualCost: finalState.actualCost || estimatedCost,
      requestId,
      stateSummary: getStateSummary(finalState)
    };

    console.log(`[Orchestrator] Search completed for: "${query}" (Request: ${requestId}) - ${response.uiResponse.results.length} results`);

    res.json(response);

  } catch (error) {
    console.error(`[Orchestrator] Search failed (Request: ${requestId}):`, error);
    
    // Record cost even for failed requests
    await costLimiter.recordCost(CostEstimator.estimateSearchQueryCost(req.body.query?.length || 100));

    res.status(500).json({
      error: 'Search failed',
      message: error.message,
      requestId
    });
  }
});

/**
 * Clarification endpoint (for frontend to get questions)
 */
app.post('/api/v1/clarify', async (req, res) => {
  const requestId = uuidv4();
  
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query is required'
      });
    }

    console.log(`[Orchestrator] Getting clarification for: "${query}"`);

    // Create state for clarification only
    const initialState: OrchestratorState = {
      query,
      requestId,
      startTime: Date.now(),
      executionTraces: [],
      currentStep: 'START',
      estimatedCost: 0,
      actualCost: 0,
      metadata: {}
    };

    // Run only the query intent and clarification steps
    const state = await maestroGraph.invoke(initialState, {
      recursionLimit: 2 // Only run query_intent and clarification nodes
    });

    if (state.clarificationRequest) {
      res.json(state.clarificationRequest);
    } else {
      res.json({
        needsClarification: false,
        questions: [],
        message: 'No clarification needed for this query',
        context: state.queryIntent
      });
    }

  } catch (error) {
    console.error(`[Orchestrator] Clarification failed:`, error);
    res.status(500).json({
      error: 'Clarification failed',
      message: error.message,
      requestId
    });
  }
});

/**
 * Service discovery endpoint
 */
app.get('/api/v1/services', (req, res) => {
  res.json({
    endpoints: SERVICE_ENDPOINTS,
    status: 'configured'
  });
});

/**
 * Check health of dependent services
 */
async function checkServiceHealth(): Promise<Record<string, string>> {
  const health: Record<string, string> = {};
  
  for (const [serviceName, url] of Object.entries(SERVICE_ENDPOINTS)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      health[serviceName] = response.data.status || 'unknown';
    } catch (error) {
      health[serviceName] = 'unhealthy';
    }
  }
  
  return health;
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('[Orchestrator] Received SIGTERM, shutting down gracefully...');
  
  try {
    await costLimiter.close();
    console.log('[Orchestrator] Cost limiter closed');
  } catch (error) {
    console.error('[Orchestrator] Error closing cost limiter:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Orchestrator] Received SIGINT, shutting down gracefully...');
  
  try {
    await costLimiter.close();
    console.log('[Orchestrator] Cost limiter closed');
  } catch (error) {
    console.error('[Orchestrator] Error closing cost limiter:', error);
  }
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Orchestrator service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search API: http://localhost:${PORT}/api/v1/search`);
  console.log(`📈 Graph visualization: http://localhost:${PORT}/api/v1/graph`);
  console.log(`💰 Cost metrics: http://localhost:${PORT}/api/v1/cost/metrics`);
  
  // Log configuration
  console.log('\n📋 Configuration:');
  console.log(`  - Kill switch: ${process.env.VERTEX_AI_KILL_SWITCH || 'false'}`);
  console.log(`  - Daily budget: $${process.env.DAILY_BUDGET_USD || '15'}`);
  console.log(`  - Query Processor: ${SERVICE_ENDPOINTS.queryProcessor}`);
  console.log(`  - Vector Search: ${SERVICE_ENDPOINTS.vectorSearch}`);
  console.log(`  - Response Pipeline: ${SERVICE_ENDPOINTS.responsePipeline}`);
});

export default app;

