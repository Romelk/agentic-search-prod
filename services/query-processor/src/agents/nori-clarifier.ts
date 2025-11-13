/**
 * Nori Clarifier - Dynamic Question Generation Agent
 * 
 * Responsibilities:
 * - Generate context-aware clarification questions
 * - Determine when clarification is needed
 * - Create dynamic questions based on product type
 * - Provide helpful explanations for questions
 */

import { VertexAIClient } from '../vertexai/client';
import { QueryIntent, ClarificationRequest, DynamicQuestion } from '../types';

export class NoriClarifier {
  private vertexAIClient: VertexAIClient;

  constructor(vertexAIClient: VertexAIClient) {
    this.vertexAIClient = vertexAIClient;
  }

  /**
   * Generate clarification questions based on query intent
   */
  async generateClarificationQuestions(
    queryIntent: QueryIntent,
    userContext: Record<string, string> = {}
  ): Promise<ClarificationRequest> {
    console.log(`[Nori] Generating clarification for: ${queryIntent.intentType}`);

    // Determine if clarification is needed
    const needsClarification = this.shouldClarify(queryIntent);
    
    if (!needsClarification) {
      return {
        needsClarification: false,
        questions: [],
        message: 'Your query is clear and specific enough. Proceeding with search.',
        context: queryIntent
      };
    }

    const prompt = this.buildClarificationPrompt(queryIntent, userContext);
    
    try {
      const result = await this.vertexAIClient.generateText(prompt);
      const clarification = this.parseClarificationResponse(result, queryIntent);
      
      console.log(`[Nori] Generated ${clarification.questions.length} clarification questions`);
      return clarification;
      
    } catch (error) {
      console.error('[Nori] Clarification generation failed:', error);
      
      // Fallback to rule-based clarification
      return this.fallbackClarification(queryIntent);
    }
  }

  /**
   * Determine if clarification is needed based on query intent
   */
  private shouldClarify(queryIntent: QueryIntent): boolean {
    const { intentType, confidence, attributes, detectedEntities, attributeSummary, clarificationSignals } = queryIntent;

    if (clarificationSignals) {
      if (clarificationSignals.recommended) {
        return true;
      }
      if (clarificationSignals.recommended === false && clarificationSignals.confidence >= 0.7) {
        return false;
      }
    }
    
    // High confidence queries with specific attributes don't need clarification
    if (confidence > 0.8 && Object.keys(attributes).length >= 2) {
      return false;
    }
    
    // Low confidence queries always need clarification
    if (confidence < 0.5) {
      return true;
    }
    
    // Product searches with missing key information need clarification
    if (intentType === 'product_search') {
      const category = attributes.category;
      if (!category) return true;

      if (attributeSummary) {
        const hasMissingHighImportance = attributeSummary.missing.some(attr => {
          const weight = attributeSummary.importanceWeights?.[attr] ?? 0.5;
          return weight >= 0.6;
        });
        if (hasMissingHighImportance) {
          return true;
        }
      } else {
        if (category === 'clothing' && !attributes.size && !attributes.occasion) {
          return true;
        }
        if (category === 'electronics' && !attributes.brand && !attributes.price_range) {
          return true;
        }
        if (category === 'home' && !attributes.room && !attributes.style) {
          return true;
        }
      }
    }
    
    // Comparison queries need clarification
    if (intentType === 'comparison') {
      return true;
    }
    
    // Recommendation queries need clarification
    if (intentType === 'recommendation') {
      return true;
    }
    
    return false;
  }

  /**
   * Build the prompt for clarification generation
   */
  private buildClarificationPrompt(
    queryIntent: QueryIntent, 
    userContext: Record<string, string>
  ): string {
    const { intentType, attributes, detectedEntities, confidence, attributeSummary, clarificationSignals } = queryIntent;
    
    return `You are Nori, an expert at generating helpful clarification questions for e-commerce searches. 

Based on this query analysis, generate 1-3 targeted clarification questions to help the user find exactly what they're looking for.

Query Analysis:
- Intent: ${intentType}
- Confidence: ${confidence}
- Detected Entities: ${detectedEntities.join(', ')}
- Extracted Attributes: ${JSON.stringify(attributes)}
- Attribute Summary: ${JSON.stringify(attributeSummary || {
      required: [],
      provided: Object.keys(attributes || {}),
      missing: []
    })}
- Clarification Signals: ${JSON.stringify(clarificationSignals || {
      recommended: false,
      reasons: []
    })}
- User Context: ${JSON.stringify(userContext)}

Guidelines:
1. Ask questions that will significantly improve search results
2. Make questions specific to the product category
3. Provide helpful context explanations
4. Give 3-4 relevant options for each question
5. Prioritize questions by importance (1 = most important)
6. Don't ask for information already provided

Respond with JSON:
{
  "needsClarification": true,
  "questions": [
    {
      "question": "What's your budget range?",
      "questionType": "budget",
      "options": ["Under $50", "$50-100", "$100-200", "$200+"],
      "contextExplanation": "This helps us show you products within your price range",
      "required": true,
      "priority": 1
    }
  ],
  "message": "To help you find the perfect match, I'd like to ask a few quick questions:"
}

Question types to consider:
- budget: Price range preferences
- size: Clothing/footwear sizes
- style: Fashion style preferences  
- occasion: When/where will you use this
- brand: Brand preferences
- color: Color preferences
- material: Material preferences
- room: For home items, which room
- features: For electronics, specific features needed
- age_group: For age-appropriate items
- season: Seasonal preferences

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Parse the AI response into ClarificationRequest
   */
  private parseClarificationResponse(response: string, queryIntent: QueryIntent): ClarificationRequest {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and format questions
      const questions: DynamicQuestion[] = (parsed.questions || []).map((q: any, index: number) => ({
        question: q.question || `Question ${index + 1}`,
        questionType: q.questionType || 'general',
        options: Array.isArray(q.options) ? q.options : ['Option 1', 'Option 2'],
        contextExplanation: q.contextExplanation || 'This helps us provide better recommendations',
        required: Boolean(q.required),
        priority: Math.max(1, Math.min(5, q.priority || index + 1))
      })).sort((a: DynamicQuestion, b: DynamicQuestion) => a.priority - b.priority);

      return {
        needsClarification: Boolean(parsed.needsClarification),
        questions,
        message: parsed.message || 'I need some additional information to help you better.',
        context: queryIntent
      };
      
    } catch (error) {
      console.warn('[Nori] Failed to parse AI response, using fallback:', error);
      return this.fallbackClarification(queryIntent);
    }
  }

  /**
   * Fallback clarification using rule-based approach
   */
  private fallbackClarification(queryIntent: QueryIntent): ClarificationRequest {
    const { attributes, confidence, attributeSummary, clarificationSignals } = queryIntent;
    const questions: DynamicQuestion[] = [];

    const missing = attributeSummary?.missing || [];

    // Budget question for most product searches
    if (confidence < 0.7 || (!attributes.price_range && missing.includes('price_range'))) {
      questions.push({
        question: 'What\'s your budget range?',
        questionType: 'budget',
        options: ['Under $50', '$50-100', '$100-200', '$200-500', '$500+'],
        contextExplanation: 'This helps us show you products within your price range',
        required: true,
        priority: 1
      });
    }

    // Category-specific questions
    if (attributes.category === 'clothing') {
      if (!attributes.size && (missing.length === 0 || missing.includes('size'))) {
        questions.push({
          question: 'What size are you looking for?',
          questionType: 'size',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          contextExplanation: 'This ensures we show you items in your size',
          required: true,
          priority: 2
        });
      }
      
      if (!attributes.color && (missing.length === 0 || missing.includes('color'))) {
        questions.push({
          question: 'Do you have a preferred color?',
          questionType: 'color',
          options: ['No preference', 'Black', 'White', 'Blue', 'Red', 'Green'],
          contextExplanation: 'Color helps us match your style preferences',
          required: false,
          priority: 2
        });
      }

      if (!attributes.occasion && (missing.length === 0 || missing.includes('occasion'))) {
        questions.push({
          question: 'What occasion is this for?',
          questionType: 'occasion',
          options: ['Casual', 'Work', 'Party', 'Formal', 'Exercise', 'Travel'],
          contextExplanation: 'This helps us suggest appropriate styles',
          required: false,
          priority: 3
        });
      }
    }

    if (attributes.category === 'electronics' && !attributes.brand) {
      questions.push({
        question: 'Do you have a brand preference?',
        questionType: 'brand',
        options: ['No preference', 'Apple', 'Samsung', 'Sony', 'Other'],
        contextExplanation: 'This helps us show you products from preferred brands',
        required: false,
        priority: 2
      });
    }

    if (clarificationSignals?.suggestedQuestions) {
      clarificationSignals.suggestedQuestions
        .filter(sq => !questions.some(q => q.questionType === sq.questionType))
        .forEach((sq) => {
          questions.push({
            question: `Could you share your preference for ${sq.attribute}?`,
            questionType: sq.questionType || sq.attribute,
            options: ['No preference'],
            contextExplanation: sq.rationale || 'This helps us narrow down the best options',
            required: false,
            priority: Math.max(1, Math.min(5, sq.priority))
          });
        });
    }

    return {
      needsClarification: questions.length > 0,
      questions,
      message: questions.length > 0 
        ? 'To help you find the perfect match, I\'d like to ask a few quick questions:'
        : 'Your query is clear. Proceeding with search.',
      context: queryIntent
    };
  }
}

/**
 * Factory function
 */
export function createNoriClarifier(vertexAIClient: VertexAIClient): NoriClarifier {
  return new NoriClarifier(vertexAIClient);
}

