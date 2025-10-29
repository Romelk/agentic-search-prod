/**
 * Vertex AI Client - Production-grade wrapper for Vertex AI services
 * 
 * Features:
 * - Gemini 2.0 Flash integration
 * - Text embedding generation
 * - Cost tracking and kill-switch enforcement
 * - Automatic retry with exponential backoff
 * - Request/response logging
 */

import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { CostLimiter, CostEstimator } from '@agentic-search/cost-limiter';
import { VertexAIConfig } from '../types';

export class VertexAIClient {
  private vertexAI: VertexAI;
  private geminiModel: GenerativeModel;
  private embeddingModel: EmbeddingModel;
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

    // Initialize models
    this.geminiModel = this.vertexAI.getGenerativeModel({
      model: config.modelName,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.1,
        topP: 0.8,
      },
    });

    this.embeddingModel = this.vertexAI.getEmbeddingModel({
      model: config.embeddingModelName,
    });

    console.log(`[VertexAI] Initialized with project: ${config.projectId}, location: ${config.location}`);
  }

  /**
   * Generate text using Gemini 2.0 Flash
   */
  async generateText(
    prompt: string,
    maxRetries: number = 3
  ): Promise<{ text: string; usage: any; cost: number }> {
    const startTime = Date.now();
    
    // Estimate cost before making the call
    const estimatedCost = CostEstimator.estimateGeminiCost(
      Math.ceil(prompt.length / 4), // Rough token estimation
      500 // Default output tokens
    );

    // Check cost controls
    const costCheck = await this.costLimiter.canProceed(estimatedCost);
    if (!costCheck.allowed) {
      throw new Error(`Vertex AI call blocked: ${costCheck.reason}`);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[VertexAI] Gemini call attempt ${attempt}/${maxRetries} (${prompt.length} chars)`);

        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Calculate actual cost (rough estimation)
        const actualCost = CostEstimator.estimateGeminiCost(
          Math.ceil(prompt.length / 4),
          Math.ceil(text.length / 4)
        );

        // Record cost
        await this.costLimiter.recordCost(actualCost);

        const executionTime = Date.now() - startTime;
        console.log(`[VertexAI] Gemini call successful (${executionTime}ms, $${actualCost.toFixed(4)})`);

        return {
          text,
          usage: {
            inputTokens: Math.ceil(prompt.length / 4),
            outputTokens: Math.ceil(text.length / 4),
            totalTokens: Math.ceil(prompt.length / 4) + Math.ceil(text.length / 4),
          },
          cost: actualCost,
        };

      } catch (error) {
        lastError = error as Error;
        console.warn(`[VertexAI] Gemini call attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`[VertexAI] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.error(`[VertexAI] Gemini call failed after ${maxRetries} attempts`);
    throw new Error(`Vertex AI call failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Generate embeddings using text-embedding-005
   */
  async generateEmbeddings(
    texts: string[],
    maxRetries: number = 3
  ): Promise<{ embeddings: number[][]; usage: any; cost: number }> {
    const startTime = Date.now();
    
    // Estimate cost
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
    const estimatedCost = CostEstimator.estimateEmbeddingCost(totalChars);

    // Check cost controls
    const costCheck = await this.costLimiter.canProceed(estimatedCost);
    if (!costCheck.allowed) {
      throw new Error(`Vertex AI call blocked: ${costCheck.reason}`);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[VertexAI] Embedding generation attempt ${attempt}/${maxRetries} (${texts.length} texts, ${totalChars} chars)`);

        const result = await this.embeddingModel.embedContent(texts);
        const embeddings = result.embeddings.map(emb => emb.values);

        // Calculate actual cost
        const actualCost = CostEstimator.estimateEmbeddingCost(totalChars);

        // Record cost
        await this.costLimiter.recordCost(actualCost);

        const executionTime = Date.now() - startTime;
        console.log(`[VertexAI] Embedding generation successful (${executionTime}ms, $${actualCost.toFixed(4)})`);

        return {
          embeddings,
          usage: {
            inputTexts: texts.length,
            totalCharacters: totalChars,
            embeddingDimensions: embeddings[0]?.length || 0,
          },
          cost: actualCost,
        };

      } catch (error) {
        lastError = error as Error;
        console.warn(`[VertexAI] Embedding generation attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`[VertexAI] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[VertexAI] Embedding generation failed after ${maxRetries} attempts`);
    throw new Error(`Vertex AI embedding generation failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Generate a single embedding for a text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.generateEmbeddings([text]);
    return result.embeddings[0];
  }

  /**
   * Check if Vertex AI is available (health check)
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try a simple generation to test connectivity
      const result = await this.generateText('Hello, are you working?');
      return result.text.length > 0;
    } catch (error) {
      console.warn('[VertexAI] Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      geminiModel: this.config.modelName,
      embeddingModel: this.config.embeddingModelName,
      projectId: this.config.projectId,
      location: this.config.location,
    };
  }
}

/**
 * Factory function to create Vertex AI client
 */
export function createVertexAIClient(config: VertexAIConfig, costLimiter: CostLimiter): VertexAIClient {
  return new VertexAIClient(config, costLimiter);
}
