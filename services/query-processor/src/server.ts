/**
 * Query Processor Service - AI Agents for Query Understanding
 * 
 * Features:
 * - Ivy Interpreter: Query intent analysis
 * - Nori Clarifier: Dynamic question generation
 * - Gale Context Keeper: Environmental context enrichment
 * - Vogue Trend Whisperer: Trend analysis
 * - Vertex AI integration with cost controls
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { createCostLimiter, CostEstimator } from '@agentic-search/cost-limiter';
import { createMockVertexAIClient } from './vertexai/mock-client';
import { createRealVertexAIClient } from './vertexai/real-client';
import { createIvyInterpreter } from './agents/ivy-interpreter';
import { createNoriClarifier } from './agents/nori-clarifier';
import { createGaleContextKeeper } from './agents/gale-context-keeper';
import { createVogueTrendWhisperer } from './agents/vogue-trend-whisperer';
import { 
  AnalyzeIntentRequest, 
  AnalyzeIntentResponse,
  EnrichContextRequest,
  EnrichContextResponse,
  EnrichTrendsRequest,
  EnrichTrendsResponse,
  VertexAIConfig 
} from './types';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Initialize services
const costLimiter = createCostLimiter({
  serviceName: 'query-processor',
  dailyBudgetUSD: parseFloat(process.env.DAILY_BUDGET_USD || '5'),
  killSwitchEnv: 'VERTEX_AI_KILL_SWITCH'
});

const vertexAIConfig: VertexAIConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'future-of-search',
  location: process.env.GCP_REGION || 'us-central1',
  modelName: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  embeddingModelName: process.env.EMBEDDING_MODEL || 'text-embedding-005'
};

const vertexAIClient = createRealVertexAIClient(vertexAIConfig, costLimiter);

// Initialize agents
const ivyInterpreter = createIvyInterpreter(vertexAIClient);
const noriClarifier = createNoriClarifier(vertexAIClient);
const galeContextKeeper = createGaleContextKeeper(vertexAIClient);
const vogueTrendWhisperer = createVogueTrendWhisperer(vertexAIClient);

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    // Check Vertex AI connectivity
    const vertexAIHealthy = await vertexAIClient.healthCheck();
    
    // Get cost metrics
    const costMetrics = await costLimiter.getMetrics();
    
    res.json({
      status: vertexAIHealthy ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      services: {
        vertexAI: vertexAIHealthy ? 'healthy' : 'unhealthy',
        costLimiter: 'healthy',
        agents: {
          ivy: 'ready',
          nori: 'ready',
          gale: 'ready',
          vogue: 'ready'
        }
      },
      costMetrics: {
        dailySpend: costMetrics.dailySpend,
        dailyBudget: costMetrics.dailyBudget,
        remainingBudget: costMetrics.remainingBudget,
        killSwitchActive: costMetrics.killSwitchActive
      },
      configuration: {
        projectId: vertexAIConfig.projectId,
        location: vertexAIConfig.location,
        geminiModel: vertexAIConfig.modelName,
        embeddingModel: vertexAIConfig.embeddingModelName
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
 * Analyze query intent (Ivy + Nori)
 */
app.post('/api/v1/analyze-intent', async (req, res) => {
  try {
    const request: AnalyzeIntentRequest = req.body;
    
    if (!request.query || typeof request.query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query is required and must be a string'
      });
    }

    console.log(`[QueryProcessor] Analyzing intent for: "${request.query}"`);

    // Step 1: Analyze query intent with Ivy
    const queryIntent = await ivyInterpreter.analyzeQueryIntent(request);
    
    // Step 2: Generate clarification questions with Nori
    const clarificationRequest = await noriClarifier.generateClarificationQuestions(
      queryIntent, 
      request.userContext || {}
    );

    const response: AnalyzeIntentResponse = {
      intent: queryIntent,
      clarification: clarificationRequest
    };

    console.log(`[QueryProcessor] Intent analysis complete: ${queryIntent.intentType}, needs clarification: ${clarificationRequest.needsClarification}`);

    res.json(response);

  } catch (error) {
    console.error('[QueryProcessor] Intent analysis failed:', error);
    res.status(500).json({
      error: 'Intent analysis failed',
      message: error.message
    });
  }
});

/**
 * Enrich context (Gale)
 */
app.post('/api/v1/enrich-context', async (req, res) => {
  try {
    const request: EnrichContextRequest = req.body;
    
    if (!request.clarifiedQuery) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'clarifiedQuery is required'
      });
    }

    console.log(`[QueryProcessor] Enriching context for: "${request.clarifiedQuery.intent.originalQuery}"`);

    // Enrich with environmental context using Gale
    const contextualQuery = await galeContextKeeper.enrichContext(request.clarifiedQuery);

    const response: EnrichContextResponse = {
      contextualQuery
    };

    console.log(`[QueryProcessor] Context enrichment complete: ${contextualQuery.season}, ${contextualQuery.weather}`);

    res.json(response);

  } catch (error) {
    console.error('[QueryProcessor] Context enrichment failed:', error);
    res.status(500).json({
      error: 'Context enrichment failed',
      message: error.message
    });
  }
});

/**
 * Enrich trends (Vogue)
 */
app.post('/api/v1/enrich-trends', async (req, res) => {
  try {
    const request: EnrichTrendsRequest = req.body;
    
    if (!request.contextualQuery) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'contextualQuery is required'
      });
    }

    console.log(`[QueryProcessor] Analyzing trends for: "${request.contextualQuery.clarified.intent.originalQuery}"`);

    // Enrich with trend analysis using Vogue
    const trendEnrichedQuery = await vogueTrendWhisperer.enrichTrends(request.contextualQuery);

    const response: EnrichTrendsResponse = {
      trendEnrichedQuery
    };

    console.log(`[QueryProcessor] Trend analysis complete: ${trendEnrichedQuery.trendingStyles.length} trending styles`);

    res.json(response);

  } catch (error) {
    console.error('[QueryProcessor] Trend analysis failed:', error);
    res.status(500).json({
      error: 'Trend analysis failed',
      message: error.message
    });
  }
});

/**
 * Generate embeddings endpoint
 */
app.post('/api/v1/embeddings', async (req, res) => {
  try {
    const { texts } = req.body;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'texts array is required'
      });
    }

    console.log(`[QueryProcessor] Generating embeddings for ${texts.length} texts`);

    // Generate embeddings using Vertex AI
    const result = await vertexAIClient.generateEmbeddings(texts);

    res.json({
      embeddings: result.embeddings,
      usage: result.usage,
      cost: result.cost
    });

  } catch (error) {
    console.error('[QueryProcessor] Embedding generation failed:', error);
    res.status(500).json({
      error: 'Embedding generation failed',
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
 * Agent status endpoint
 */
app.get('/api/v1/agents/status', (req, res) => {
  res.json({
    agents: {
      ivy: {
        name: 'Ivy Interpreter',
        status: 'ready',
        description: 'Query intent analysis and entity extraction'
      },
      nori: {
        name: 'Nori Clarifier',
        status: 'ready',
        description: 'Dynamic clarification question generation'
      },
      gale: {
        name: 'Gale Context Keeper',
        status: 'ready',
        description: 'Environmental and contextual enrichment'
      },
      vogue: {
        name: 'Vogue Trend Whisperer',
        status: 'ready',
        description: 'Fashion and style trend analysis'
      }
    },
    vertexAI: {
      status: 'connected',
      model: vertexAIConfig.modelName,
      embeddingModel: vertexAIConfig.embeddingModelName
    }
  });
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('[QueryProcessor] Received SIGTERM, shutting down gracefully...');
  
  try {
    await costLimiter.close();
    console.log('[QueryProcessor] Cost limiter closed');
  } catch (error) {
    console.error('[QueryProcessor] Error closing cost limiter:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[QueryProcessor] Received SIGINT, shutting down gracefully...');
  
  try {
    await costLimiter.close();
    console.log('[QueryProcessor] Cost limiter closed');
  } catch (error) {
    console.error('[QueryProcessor] Error closing cost limiter:', error);
  }
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 Query Processor service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧠 Intent analysis: http://localhost:${PORT}/api/v1/analyze-intent`);
  console.log(`🌍 Context enrichment: http://localhost:${PORT}/api/v1/enrich-context`);
  console.log(`✨ Trend analysis: http://localhost:${PORT}/api/v1/enrich-trends`);
  console.log(`🔢 Embeddings: http://localhost:${PORT}/api/v1/embeddings`);
  console.log(`💰 Cost metrics: http://localhost:${PORT}/api/v1/cost/metrics`);
  
  // Log configuration
  console.log('\n📋 Configuration:');
  console.log(`  - Kill switch: ${process.env.VERTEX_AI_KILL_SWITCH || 'false'}`);
  console.log(`  - Daily budget: $${process.env.DAILY_BUDGET_USD || '5'}`);
  console.log(`  - GCP Project: ${vertexAIConfig.projectId}`);
  console.log(`  - GCP Region: ${vertexAIConfig.location}`);
  console.log(`  - Gemini Model: ${vertexAIConfig.modelName}`);
  console.log(`  - Embedding Model: ${vertexAIConfig.embeddingModelName}`);
});

export default app;
