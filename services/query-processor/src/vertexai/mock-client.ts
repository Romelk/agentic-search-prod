/**
 * Mock Vertex AI Client for development
 * This allows us to continue development while we fix the real Vertex AI integration
 */

import { CostLimiter, CostEstimator } from '@agentic-search/cost-limiter';
import { VertexAIConfig } from '../types';

export class MockVertexAIClient {
  private costLimiter: CostLimiter;
  private config: VertexAIConfig;

  constructor(config: VertexAIConfig, costLimiter: CostLimiter) {
    this.config = config;
    this.costLimiter = costLimiter;
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    console.log(`[Mock] Generating text for prompt: ${prompt.substring(0, 100)}...`);
    
    // Check cost limits
    const estimatedCost = 0.002; // $0.002 per Gemini call
    if (!await this.costLimiter.canProceed(estimatedCost)) {
      throw new Error('Cost limit exceeded');
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Record cost
    await this.costLimiter.recordCost(estimatedCost);

    // Generate mock response based on prompt
    if (prompt.includes('intent') || prompt.includes('analyze')) {
      return JSON.stringify({
        intent: 'product_search',
        entities: ['blue', 'dress'],
        attributes: {
          color: 'blue',
          category: 'dress',
          occasion: 'casual'
        },
        confidence: 0.85
      });
    }

    if (prompt.includes('clarification') || prompt.includes('question')) {
      return JSON.stringify({
        questions: [
          {
            type: 'single_choice',
            question: 'What\'s your preferred budget range?',
            options: ['Under $50', '$50-$100', '$100-$200', '$200+']
          }
        ]
      });
    }

    if (prompt.includes('context') || prompt.includes('environment')) {
      return JSON.stringify({
        context: {
          season: 'spring',
          weather: 'mild',
          location: 'urban',
          timeOfDay: 'afternoon'
        }
      });
    }

    if (prompt.includes('trend') || prompt.includes('style')) {
      return JSON.stringify({
        trends: {
          colors: ['pastel', 'earth tones'],
          styles: ['minimalist', 'vintage'],
          patterns: ['floral', 'geometric']
        }
      });
    }

    // Default response
    return JSON.stringify({
      result: 'Mock response generated',
      timestamp: new Date().toISOString()
    });
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    console.log(`[Mock] Generating embeddings for ${texts.length} texts`);
    
    // Check cost limits
    const estimatedCost = texts.length * 0.0001; // $0.0001 per embedding
    if (!await this.costLimiter.canProceed(estimatedCost)) {
      throw new Error('Cost limit exceeded');
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Record cost
    await this.costLimiter.recordCost(estimatedCost);

    // Generate mock embeddings (768-dimensional vectors)
    return texts.map(() => {
      const embedding = [];
      for (let i = 0; i < 768; i++) {
        embedding.push(Math.random() * 2 - 1);
      }
      return embedding;
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  async healthCheck(): Promise<boolean> {
    console.log('[Mock] Health check - always healthy');
    return true;
  }
}

export function createMockVertexAIClient(config: VertexAIConfig, costLimiter: CostLimiter): MockVertexAIClient {
  return new MockVertexAIClient(config, costLimiter);
}
