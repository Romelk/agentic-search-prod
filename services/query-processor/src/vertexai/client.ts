import { CostLimiter } from '@agentic-search/cost-limiter';
import { VertexAIConfig } from '../types';
import { RealVertexAIClient, createRealVertexAIClient } from './real-client';

export type VertexAIClient = RealVertexAIClient;

export function createVertexAIClient(config: VertexAIConfig, costLimiter: CostLimiter): VertexAIClient {
  return createRealVertexAIClient(config, costLimiter);
}
