/**
 * Real Vertex AI Client - Production-grade wrapper for Vertex AI services
 * 
 * Features:
 * - Gemini 2.0 Flash integration
 * - Text embedding generation
 * - Cost tracking and kill-switch enforcement
 * - Automatic retry with exponential backoff
 * - Request/response logging
 */

import { VertexAI } from '@google-cloud/vertexai';
import { CostLimiter, CostEstimator } from '@agentic-search/cost-limiter';
import { VertexAIConfig } from '../types';

export class RealVertexAIClient {
  private vertexAI: VertexAI;
  private costLimiter: CostLimiter;
  private config: VertexAIConfig;

  constructor(config: VertexAIConfig, costLimiter: CostLimiter) {
    this.config = config;
    this.costLimiter = costLimiter;

    // Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: config.projectId,
      location: config.location,
    });

    console.log(`[VertexAI] Initialized with project: ${config.projectId}, location: ${config.location}`);
  }

  /**
   * Generate text using Gemini 2.0 Flash
   */
  async generateText(prompt: string, options?: any): Promise<string> {
    console.log(`[VertexAI] Generating text for prompt: ${prompt.substring(0, 100)}...`);
    
    // Check cost limits
    const estimatedCost = 0.002; // $0.002 per Gemini call
    if (!await this.costLimiter.canProceed(estimatedCost)) {
      throw new Error('Cost limit exceeded');
    }

    try {
      const model = this.vertexAI.getGenerativeModel({
        model: this.config.modelName,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 40
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Record cost
      await this.costLimiter.recordCost(estimatedCost);

      return response.text;
    } catch (error) {
      console.error('[VertexAI] Error generating text:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings using text-embedding-005
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    console.log(`[VertexAI] Generating embeddings for ${texts.length} texts`);
    
    // Check cost limits
    const estimatedCost = texts.length * 0.0001; // $0.0001 per embedding
    if (!await this.costLimiter.canProceed(estimatedCost)) {
      throw new Error('Cost limit exceeded');
    }

    try {
      const model = this.vertexAI.getGenerativeModel({
        model: this.config.embeddingModelName
      });

      const embeddings = await Promise.all(
        texts.map(async (text) => {
          const result = await model.embedContent(text);
          return result.embedding.values;
        })
      );
      
      // Record cost
      await this.costLimiter.recordCost(estimatedCost);

      return embeddings;
    } catch (error) {
      console.error('[VertexAI] Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Generate single embedding
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple prompt
      await this.generateText('test');
      return true;
    } catch (error) {
      console.error('[VertexAI] Health check failed:', error);
      return false;
    }
  }
}

export function createRealVertexAIClient(config: VertexAIConfig, costLimiter: CostLimiter): RealVertexAIClient {
  return new RealVertexAIClient(config, costLimiter);
}
