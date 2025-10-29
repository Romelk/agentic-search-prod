/**
 * Ivy Interpreter - Query Intent Analysis Agent
 * 
 * Responsibilities:
 * - Analyze user queries to understand intent
 * - Extract entities and attributes
 * - Determine query complexity and confidence
 * - Identify missing information for clarification
 */

import { VertexAIClient } from '../vertexai/client';
import { QueryIntent, AnalyzeIntentRequest } from '../types';

export class IvyInterpreter {
  private vertexAIClient: VertexAIClient;

  constructor(vertexAIClient: VertexAIClient) {
    this.vertexAIClient = vertexAIClient;
  }

  /**
   * Analyze query intent using Gemini 2.0 Flash
   */
  async analyzeQueryIntent(request: AnalyzeIntentRequest): Promise<QueryIntent> {
    const { query, userContext = {} } = request;
    
    console.log(`[Ivy] Analyzing query intent: "${query}"`);

    const prompt = this.buildIntentAnalysisPrompt(query, userContext);
    
    try {
      const result = await this.vertexAIClient.generateText(prompt);
      const intent = this.parseIntentResponse(result.text, query);
      
      console.log(`[Ivy] Intent analysis complete: ${intent.intentType} (confidence: ${intent.confidence})`);
      return intent;
      
    } catch (error) {
      console.error('[Ivy] Intent analysis failed:', error);
      
      // Fallback to basic analysis
      return this.fallbackIntentAnalysis(query);
    }
  }

  /**
   * Build the prompt for intent analysis
   */
  private buildIntentAnalysisPrompt(query: string, userContext: Record<string, string>): string {
    return `You are Ivy, an expert query interpreter for an e-commerce search system. Analyze the following user query and extract structured information.

Query: "${query}"
User Context: ${JSON.stringify(userContext)}

Please analyze this query and respond with a JSON object containing:

{
  "intentType": "product_search|comparison|recommendation|question|other",
  "detectedEntities": ["entity1", "entity2"],
  "attributes": {
    "category": "clothing|electronics|home|etc",
    "subcategory": "shirts|dresses|cameras|etc", 
    "color": "blue|red|black|etc",
    "size": "S|M|L|XL|etc",
    "brand": "brand_name",
    "price_range": "under_50|50_100|100_200|200_500|500_plus",
    "occasion": "casual|formal|party|work|etc",
    "season": "spring|summer|fall|winter",
    "material": "cotton|silk|leather|etc",
    "style": "vintage|modern|classic|etc"
  },
  "tone": "casual|formal|urgent|exploratory",
  "confidence": 0.95,
  "missingInformation": ["color", "size", "budget"],
  "complexity": "simple|medium|complex",
  "reasoning": "Brief explanation of your analysis"
}

Guidelines:
- Be precise with intentType classification
- Extract ALL relevant entities and attributes
- Identify what information is missing for a complete search
- Assess confidence based on query clarity
- Consider user context when available
- Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Parse the AI response into QueryIntent
   */
  private parseIntentResponse(response: string, originalQuery: string): QueryIntent {
    try {
      // Handle undefined or null response
      if (!response || typeof response !== 'string') {
        console.log('[Ivy] Invalid response format, using fallback');
        return this.createFallbackIntent(originalQuery);
      }

      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        originalQuery,
        intentType: parsed.intentType || 'product_search',
        detectedEntities: parsed.detectedEntities || [],
        attributes: parsed.attributes || {},
        tone: parsed.tone || 'neutral',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        timestamp: Date.now(),
      };
      
    } catch (error) {
      console.warn('[Ivy] Failed to parse AI response, using fallback:', error);
      return this.fallbackIntentAnalysis(originalQuery);
    }
  }

  /**
   * Fallback intent analysis using rule-based approach
   */
  private fallbackIntentAnalysis(query: string): QueryIntent {
    const queryLower = query.toLowerCase();
    
    // Basic entity detection
    const entities = [];
    const attributes: Record<string, string> = {};
    
    // Color detection
    const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey'];
    for (const color of colors) {
      if (queryLower.includes(color)) {
        entities.push(color);
        attributes.color = color;
        break;
      }
    }
    
    // Category detection
    const categories = {
      clothing: ['shirt', 'dress', 'pants', 'jeans', 'jacket', 'coat', 'sweater', 't-shirt', 'skirt', 'shorts'],
      electronics: ['phone', 'laptop', 'camera', 'tablet', 'computer', 'headphones', 'speaker'],
      home: ['furniture', 'chair', 'table', 'bed', 'sofa', 'lamp', 'mirror'],
      accessories: ['bag', 'purse', 'watch', 'jewelry', 'belt', 'scarf', 'hat']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (queryLower.includes(keyword)) {
          entities.push(keyword);
          attributes.category = category;
          break;
        }
      }
    }
    
    // Size detection
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large'];
    for (const size of sizes) {
      if (queryLower.includes(size)) {
        entities.push(size);
        attributes.size = size;
        break;
      }
    }
    
    // Intent type detection
    let intentType = 'product_search';
    if (queryLower.includes('compare') || queryLower.includes('vs')) {
      intentType = 'comparison';
    } else if (queryLower.includes('recommend') || queryLower.includes('suggest')) {
      intentType = 'recommendation';
    } else if (queryLower.includes('?') || queryLower.includes('what') || queryLower.includes('how')) {
      intentType = 'question';
    }
    
    // Confidence based on specificity
    let confidence = 0.3; // Base confidence
    if (entities.length > 0) confidence += 0.2;
    if (attributes.category) confidence += 0.3;
    if (attributes.color) confidence += 0.2;
    
    return {
      originalQuery: query,
      intentType,
      detectedEntities: entities,
      attributes,
      tone: 'neutral',
      confidence: Math.min(confidence, 0.9),
      timestamp: Date.now(),
    };
  }
}

/**
 * Factory function
 */
export function createIvyInterpreter(vertexAIClient: VertexAIClient): IvyInterpreter {
  return new IvyInterpreter(vertexAIClient);
}
