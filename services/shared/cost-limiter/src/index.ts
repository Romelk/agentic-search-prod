/**
 * Cost Limiter - Production-grade cost control for Vertex AI services
 * 
 * Features:
 * - Kill-switch for emergency cost control
 * - Per-service daily budgets
 * - Redis-backed rate limiting
 * - Cost tracking and metrics
 */

import Redis from 'ioredis';

export interface CostLimiterConfig {
  redisUrl?: string;
  serviceName: string;
  dailyBudgetUSD: number;
  killSwitchEnv?: string;
}

export interface CostMetrics {
  serviceName: string;
  dailySpend: number;
  dailyBudget: number;
  remainingBudget: number;
  queryCount: number;
  killSwitchActive: boolean;
  lastReset: Date;
}

export class CostLimiter {
  private redis: Redis;
  private config: CostLimiterConfig;
  private readonly REDIS_KEY_PREFIX = 'cost:';
  private readonly QUERY_COUNT_KEY_PREFIX = 'queries:';

  constructor(config: CostLimiterConfig) {
    this.config = config;
    this.redis = new Redis(config.redisUrl || 'redis://localhost:6379');
    
    // Handle Redis connection errors
    this.redis.on('error', (err) => {
      console.error('[CostLimiter] Redis connection error:', err);
    });
  }

  /**
   * Check if a request can proceed based on cost controls
   * @param estimatedCostUSD Estimated cost of the operation in USD
   * @returns True if request can proceed, false if blocked
   */
  async canProceed(estimatedCostUSD: number): Promise<{allowed: boolean; reason?: string}> {
    // Check 1: Kill-switch
    if (this.isKillSwitchActive()) {
      return {
        allowed: false,
        reason: 'KILL_SWITCH_ACTIVE: Vertex AI operations are disabled'
      };
    }

    // Check 2: Daily budget
    const currentSpend = await this.getDailySpend();
    const projectedSpend = currentSpend + estimatedCostUSD;

    if (projectedSpend > this.config.dailyBudgetUSD) {
      return {
        allowed: false,
        reason: `BUDGET_EXCEEDED: Daily budget of $${this.config.dailyBudgetUSD} would be exceeded. Current: $${currentSpend.toFixed(4)}, Projected: $${projectedSpend.toFixed(4)}`
      };
    }

    // Check 3: Per-query cost limit (prevent single expensive queries)
    const MAX_QUERY_COST = 0.50; // $0.50 per query max
    if (estimatedCostUSD > MAX_QUERY_COST) {
      return {
        allowed: false,
        reason: `QUERY_TOO_EXPENSIVE: Estimated cost $${estimatedCostUSD.toFixed(4)} exceeds limit of $${MAX_QUERY_COST}`
      };
    }

    return { allowed: true };
  }

  /**
   * Record actual cost after operation completes
   * @param actualCostUSD Actual cost incurred in USD
   */
  async recordCost(actualCostUSD: number): Promise<void> {
    const key = this.getCostKey();
    const currentSpend = await this.getDailySpend();
    const newSpend = currentSpend + actualCostUSD;

    // Store with expiry of 24 hours
    await this.redis.setex(key, 86400, newSpend.toString());

    // Increment query count
    await this.incrementQueryCount();

    // Log for monitoring
    console.log(`[CostLimiter] ${this.config.serviceName}: Recorded $${actualCostUSD.toFixed(4)} cost. Total today: $${newSpend.toFixed(4)}`);

    // Check if we're approaching budget limit
    const utilizationPercent = (newSpend / this.config.dailyBudgetUSD) * 100;
    if (utilizationPercent > 90) {
      console.warn(`[CostLimiter] ⚠️  WARNING: ${this.config.serviceName} at ${utilizationPercent.toFixed(1)}% of daily budget!`);
    }
  }

  /**
   * Get current daily spend
   */
  async getDailySpend(): Promise<number> {
    const key = this.getCostKey();
    const value = await this.redis.get(key);
    return value ? parseFloat(value) : 0;
  }

  /**
   * Get cost metrics for monitoring
   */
  async getMetrics(): Promise<CostMetrics> {
    const dailySpend = await this.getDailySpend();
    const queryCount = await this.getQueryCount();

    return {
      serviceName: this.config.serviceName,
      dailySpend,
      dailyBudget: this.config.dailyBudgetUSD,
      remainingBudget: Math.max(0, this.config.dailyBudgetUSD - dailySpend),
      queryCount,
      killSwitchActive: this.isKillSwitchActive(),
      lastReset: this.getLastResetTime()
    };
  }

  /**
   * Reset daily counters (usually called automatically by Redis TTL)
   */
  async resetDaily(): Promise<void> {
    const costKey = this.getCostKey();
    const queryKey = this.getQueryCountKey();
    
    await this.redis.del(costKey);
    await this.redis.del(queryKey);
    
    console.log(`[CostLimiter] Daily counters reset for ${this.config.serviceName}`);
  }

  /**
   * Check if kill-switch is active
   */
  private isKillSwitchActive(): boolean {
    const envVar = this.config.killSwitchEnv || 'VERTEX_AI_KILL_SWITCH';
    const value = process.env[envVar];
    return value === 'true' || value === '1';
  }

  /**
   * Increment query count
   */
  private async incrementQueryCount(): Promise<void> {
    const key = this.getQueryCountKey();
    await this.redis.incr(key);
    await this.redis.expire(key, 86400); // 24 hours
  }

  /**
   * Get query count for today
   */
  private async getQueryCount(): Promise<number> {
    const key = this.getQueryCountKey();
    const value = await this.redis.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Get Redis key for cost tracking
   */
  private getCostKey(): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${this.REDIS_KEY_PREFIX}${this.config.serviceName}:${date}`;
  }

  /**
   * Get Redis key for query count
   */
  private getQueryCountKey(): string {
    const date = new Date().toISOString().split('T')[0];
    return `${this.QUERY_COUNT_KEY_PREFIX}${this.config.serviceName}:${date}`;
  }

  /**
   * Get last reset time (start of current day)
   */
  private getLastResetTime(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

/**
 * Estimate cost for Vertex AI operations
 */
export class CostEstimator {
  // Pricing as of January 2025 (approximate)
  private static readonly GEMINI_2_0_FLASH_INPUT_COST = 0.075 / 1_000_000; // $0.075 per 1M tokens
  private static readonly GEMINI_2_0_FLASH_OUTPUT_COST = 0.30 / 1_000_000; // $0.30 per 1M tokens
  private static readonly TEXT_EMBEDDING_COST = 0.02 / 1_000_000; // $0.02 per 1M tokens
  private static readonly MATCHING_ENGINE_QUERY_COST = 0.50 / 1000; // $0.50 per 1000 queries

  /**
   * Estimate cost for a Gemini API call
   * @param inputTokens Approximate input tokens
   * @param outputTokens Approximate output tokens
   */
  static estimateGeminiCost(inputTokens: number, outputTokens: number = 500): number {
    const inputCost = inputTokens * this.GEMINI_2_0_FLASH_INPUT_COST;
    const outputCost = outputTokens * this.GEMINI_2_0_FLASH_OUTPUT_COST;
    return inputCost + outputCost;
  }

  /**
   * Estimate cost for embedding generation
   * @param textLength Approximate text length in characters
   */
  static estimateEmbeddingCost(textLength: number): number {
    // Rough estimate: 1 token ≈ 4 characters
    const tokens = Math.ceil(textLength / 4);
    return tokens * this.TEXT_EMBEDDING_COST;
  }

  /**
   * Estimate cost for Matching Engine query
   */
  static estimateMatchingEngineCost(): number {
    return this.MATCHING_ENGINE_QUERY_COST;
  }

  /**
   * Estimate cost for a typical search query
   * @param queryLength Length of user query
   */
  static estimateSearchQueryCost(queryLength: number): number {
    // Typical search involves:
    // 1. Gemini call for intent extraction (input: query + prompt ~500 tokens, output: ~200 tokens)
    const geminiCost = this.estimateGeminiCost(500 + Math.ceil(queryLength / 4), 200);
    
    // 2. Embedding generation for query (~100 chars)
    const embeddingCost = this.estimateEmbeddingCost(queryLength);
    
    // 3. Matching Engine query
    const matchingEngineCost = this.estimateMatchingEngineCost();
    
    // 4. Additional Gemini call for clarification questions (~300 tokens input, ~400 output)
    const clarificationCost = this.estimateGeminiCost(300, 400);
    
    return geminiCost + embeddingCost + matchingEngineCost + clarificationCost;
  }
}

// Export singleton factory
export function createCostLimiter(config: CostLimiterConfig): CostLimiter {
  return new CostLimiter(config);
}


