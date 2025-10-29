/**
 * LangGraph Workflow Tests
 * Tests the Maestro orchestration graph with mocked services
 */

import { createMaestroGraph, getGraphVisualization } from '../src/graphs/maestro-graph';
import { OrchestratorState } from '../src/types';

// Mock axios for service calls
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Maestro Graph Tests', () => {
  let graph: any;

  beforeEach(() => {
    graph = createMaestroGraph();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful service responses
    mockedAxios.post.mockResolvedValue({
      data: {
        intent: {
          originalQuery: 'test query',
          intentType: 'product_search',
          detectedEntities: ['product'],
          attributes: {},
          tone: 'neutral',
          confidence: 0.9,
          timestamp: Date.now()
        },
        clarification: {
          needsClarification: false,
          questions: [],
          message: 'No clarification needed',
          context: {}
        }
      }
    });
  });

  describe('Graph Structure', () => {
    test('should create graph with correct nodes', () => {
      const visualization = getGraphVisualization();
      
      expect(visualization.nodes).toHaveLength(10); // START, 8 agents, END
      expect(visualization.nodes.map(n => n.id)).toContain('query_intent');
      expect(visualization.nodes.map(n => n.id)).toContain('clarification');
      expect(visualization.nodes.map(n => n.id)).toContain('vector_search');
      expect(visualization.nodes.map(n => n.id)).toContain('response_generation');
    });

    test('should have correct edges', () => {
      const visualization = getGraphVisualization();
      
      expect(visualization.edges).toHaveLength(11);
      expect(visualization.edges.find(e => e.from === 'START' && e.to === 'query_intent')).toBeDefined();
      expect(visualization.edges.find(e => e.from === 'query_intent' && e.to === 'context_enrichment')).toBeDefined();
    });
  });

  describe('Workflow Execution', () => {
    test('should execute complete workflow without clarification', async () => {
      const initialState: OrchestratorState = {
        query: 'I need a blue shirt',
        requestId: 'test-123',
        startTime: Date.now(),
        executionTraces: [],
        currentStep: 'START',
        estimatedCost: 0.05,
        actualCost: 0,
        metadata: {}
      };

      // Mock all service responses
      mockedAxios.post
        .mockResolvedValueOnce({
          data: {
            intent: {
              originalQuery: 'I need a blue shirt',
              intentType: 'product_search',
              detectedEntities: ['shirt', 'blue'],
              attributes: { color: 'blue', category: 'clothing' },
              tone: 'neutral',
              confidence: 0.95,
              timestamp: Date.now()
            },
            clarification: {
              needsClarification: false,
              questions: [],
              message: 'Query is clear',
              context: {}
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            clarified: {
              intent: {},
              clarifications: {},
              inferredPreferences: ['blue', 'shirt'],
              needsMoreInfo: false
            },
            location: 'unknown',
            weather: 'unknown',
            season: 'spring',
            timeOfDay: 'day',
            environmentalContext: {}
          }
        })
        .mockResolvedValueOnce({
          data: {
            contextual: {},
            trendingStyles: ['casual'],
            seasonalRecommendations: ['spring colors'],
            trendConfidence: 0.8
          }
        })
        .mockResolvedValueOnce({
          data: {
            candidates: [
              {
                product: {
                  sku: 'SHIRT-001',
                  name: 'Blue Cotton Shirt',
                  description: 'Comfortable blue cotton shirt',
                  price: 29.99,
                  currency: 'USD',
                  category: 'clothing',
                  brand: 'TestBrand',
                  color: 'blue',
                  size: 'M',
                  material: 'cotton',
                  styleTags: ['casual'],
                  season: 'spring',
                  gender: 'unisex',
                  occasion: 'casual',
                  imageUrl: 'http://example.com/shirt.jpg',
                  stockStatus: 'in_stock',
                  rating: 4.5,
                  popularityScore: 0.8
                },
                similarityScore: 0.95,
                matchingAttributes: ['color', 'category'],
                matchReason: 'Perfect match for blue shirt request'
              }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            bundles: [
              {
                bundleId: 'bundle-001',
                bundleName: 'Casual Blue Look',
                items: [],
                coherenceScore: 0.9,
                styleTheme: 'casual',
                description: 'A casual blue shirt look'
              }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            rankedLooks: [
              {
                look: {
                  bundleId: 'bundle-001',
                  bundleName: 'Casual Blue Look',
                  items: [],
                  coherenceScore: 0.9,
                  styleTheme: 'casual',
                  description: 'A casual blue shirt look'
                },
                finalScore: 0.95,
                scoreBreakdown: { similarity: 0.95, coherence: 0.9 },
                rank: 1
              }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            results: [],
            executionTraces: [],
            queryId: 'test-123',
            totalExecutionTimeMs: 1000,
            metadata: {},
            success: true
          }
        });

      const result = await graph.invoke(initialState);

      expect(result.queryIntent).toBeDefined();
      expect(result.queryIntent.intentType).toBe('product_search');
      expect(result.clarificationRequest.needsClarification).toBe(false);
      expect(result.searchCandidates).toHaveLength(1);
      expect(result.lookBundles).toHaveLength(1);
      expect(result.rankedLooks).toHaveLength(1);
      expect(result.finalResponse).toBeDefined();
      expect(result.finalResponse.success).toBe(true);
    });

    test('should handle clarification workflow', async () => {
      const initialState: OrchestratorState = {
        query: 'I need something for a party',
        requestId: 'test-456',
        startTime: Date.now(),
        executionTraces: [],
        currentStep: 'START',
        estimatedCost: 0.05,
        actualCost: 0,
        metadata: {}
      };

      // Mock response that needs clarification
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          intent: {
            originalQuery: 'I need something for a party',
            intentType: 'product_search',
            detectedEntities: ['party'],
            attributes: { occasion: 'party' },
            tone: 'neutral',
            confidence: 0.6,
            timestamp: Date.now()
          },
          clarification: {
            needsClarification: true,
            questions: [
              {
                question: 'What type of party is it?',
                questionType: 'occasion',
                options: ['casual', 'formal', 'cocktail'],
                contextExplanation: 'This helps us recommend appropriate clothing',
                required: true,
                priority: 1
              }
            ],
            message: 'We need more details to help you',
            context: {}
          }
        }
      });

      const result = await graph.invoke(initialState);

      expect(result.clarificationRequest.needsClarification).toBe(true);
      expect(result.clarificationRequest.questions).toHaveLength(1);
      expect(result.clarificationRequest.questions[0].question).toBe('What type of party is it?');
    });

    test('should handle service errors gracefully', async () => {
      const initialState: OrchestratorState = {
        query: 'test query',
        requestId: 'test-error',
        startTime: Date.now(),
        executionTraces: [],
        currentStep: 'START',
        estimatedCost: 0.05,
        actualCost: 0,
        metadata: {}
      };

      // Mock service error
      mockedAxios.post.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await graph.invoke(initialState);

      expect(result.error).toContain('Ivy agent failed');
      expect(result.currentStep).toBe('query_intent_failed');
      expect(result.executionTraces).toHaveLength(1);
      expect(result.executionTraces[0].status).toBe('error');
    });
  });

  describe('Cost Tracking', () => {
    test('should track estimated and actual costs', async () => {
      const initialState: OrchestratorState = {
        query: 'test query',
        requestId: 'test-cost',
        startTime: Date.now(),
        executionTraces: [],
        currentStep: 'START',
        estimatedCost: 0.05,
        actualCost: 0,
        metadata: {}
      };

      // Mock successful responses
      mockedAxios.post.mockResolvedValue({
        data: {
          intent: {
            originalQuery: 'test query',
            intentType: 'product_search',
            detectedEntities: [],
            attributes: {},
            tone: 'neutral',
            confidence: 0.9,
            timestamp: Date.now()
          },
          clarification: {
            needsClarification: false,
            questions: [],
            message: 'No clarification needed',
            context: {}
          }
        }
      });

      const result = await graph.invoke(initialState);

      expect(result.estimatedCost).toBe(0.05);
      expect(result.executionTraces.length).toBeGreaterThan(0);
    });
  });
});

