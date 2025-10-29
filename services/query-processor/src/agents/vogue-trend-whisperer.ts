/**
 * Vogue Trend Whisperer - Trend Analysis Agent
 * 
 * Responsibilities:
 * - Analyze current fashion and style trends
 * - Provide seasonal style recommendations
 * - Consider trending colors, patterns, and styles
 * - Enhance queries with trend-aware insights
 */

import { VertexAIClient } from '../vertexai/client';
import { ContextualQuery, TrendEnrichedQuery } from '../types';

export class VogueTrendWhisperer {
  private vertexAIClient: VertexAIClient;

  constructor(vertexAIClient: VertexAIClient) {
    this.vertexAIClient = vertexAIClient;
  }

  /**
   * Enrich contextual query with trend analysis
   */
  async enrichTrends(contextualQuery: ContextualQuery): Promise<TrendEnrichedQuery> {
    console.log(`[Vogue] Analyzing trends for: ${contextualQuery.clarified.intent.originalQuery}`);

    try {
      const prompt = this.buildTrendAnalysisPrompt(contextualQuery);
      const result = await this.vertexAIClient.generateText(prompt);
      const trendData = this.parseTrendResponse(result.text);

      const trendEnrichedQuery: TrendEnrichedQuery = {
        contextual: contextualQuery,
        trendingStyles: trendData.trendingStyles,
        seasonalRecommendations: trendData.seasonalRecommendations,
        trendConfidence: trendData.trendConfidence
      };

      console.log(`[Vogue] Trend analysis complete: ${trendData.trendingStyles.length} trending styles`);
      return trendEnrichedQuery;

    } catch (error) {
      console.error('[Vogue] Trend analysis failed:', error);
      
      // Fallback to basic trend analysis
      return this.fallbackTrendAnalysis(contextualQuery);
    }
  }

  /**
   * Build prompt for trend analysis
   */
  private buildTrendAnalysisPrompt(contextualQuery: ContextualQuery): string {
    const { clarified, season, weather, timeOfDay } = contextualQuery;
    const { intent, clarifications } = clarified;
    
    return `You are Vogue, an expert fashion and style trend analyst. Analyze current trends and provide style recommendations based on the query context.

Query Context:
- Original Query: "${intent.originalQuery}"
- Intent Type: ${intent.intentType}
- Category: ${intent.attributes.category || 'unknown'}
- Season: ${season}
- Weather: ${weather}
- Time of Day: ${timeOfDay}
- User Clarifications: ${JSON.stringify(clarifications)}

Provide trend analysis and recommendations. Respond with JSON:

{
  "trendingStyles": [
    {
      "style": "style_name",
      "description": "brief description",
      "relevance": "high|medium|low",
      "seasonal_fit": "perfect|good|moderate"
    }
  ],
  "seasonalRecommendations": [
    {
      "recommendation": "specific recommendation",
      "reasoning": "why this works for the season",
      "confidence": 0.8
    }
  ],
  "trendConfidence": 0.85,
  "trendInsights": {
    "color_trends": ["trending colors"],
    "pattern_trends": ["trending patterns"],
    "style_trends": ["trending styles"],
    "material_trends": ["trending materials"]
  },
  "contextualAdvice": "Specific advice based on the query and current trends"
}

Guidelines:
- Focus on current 2025 trends
- Consider seasonal appropriateness
- Match trends to the user's query intent
- Provide practical, actionable recommendations
- Consider the category (clothing, accessories, etc.)
- Balance trendiness with versatility

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Parse AI response for trend data
   */
  private parseTrendResponse(response: string): {
    trendingStyles: string[];
    seasonalRecommendations: string[];
    trendConfidence: number;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Extract trending styles as strings
      const trendingStyles = (parsed.trendingStyles || []).map((style: any) => 
        typeof style === 'string' ? style : style.style || 'Unknown Style'
      );
      
      // Extract seasonal recommendations
      const seasonalRecommendations = (parsed.seasonalRecommendations || []).map((rec: any) =>
        typeof rec === 'string' ? rec : rec.recommendation || 'General recommendation'
      );
      
      return {
        trendingStyles,
        seasonalRecommendations,
        trendConfidence: Math.max(0, Math.min(1, parsed.trendConfidence || 0.7))
      };
      
    } catch (error) {
      console.warn('[Vogue] Failed to parse trend response:', error);
      
      return {
        trendingStyles: ['classic', 'modern'],
        seasonalRecommendations: ['Consider seasonal colors and materials'],
        trendConfidence: 0.5
      };
    }
  }

  /**
   * Fallback trend analysis using rule-based approach
   */
  private fallbackTrendAnalysis(contextualQuery: ContextualQuery): TrendEnrichedQuery {
    const { season, clarified } = contextualQuery;
    const category = clarified.intent.attributes.category;
    
    // Basic trend analysis based on season and category
    const trendingStyles = this.getSeasonalTrends(season, category);
    const seasonalRecommendations = this.getSeasonalRecommendations(season, category);
    
    return {
      contextual: contextualQuery,
      trendingStyles,
      seasonalRecommendations,
      trendConfidence: 0.6
    };
  }

  /**
   * Get seasonal trends based on season and category
   */
  private getSeasonalTrends(season: string, category?: string): string[] {
    const trends: Record<string, Record<string, string[]>> = {
      spring: {
        clothing: ['light layers', 'pastel colors', 'floral patterns', 'breathable fabrics'],
        accessories: ['light scarves', 'canvas bags', 'sunglasses', 'minimalist jewelry'],
        general: ['spring colors', 'lightweight materials', 'fresh styles']
      },
      summer: {
        clothing: ['bright colors', 'light fabrics', 'flowy styles', 'summer dresses'],
        accessories: ['wide-brim hats', 'beach bags', 'sandals', 'statement jewelry'],
        general: ['summer vibes', 'vacation-ready', 'cool and comfortable']
      },
      fall: {
        clothing: ['earth tones', 'layering pieces', 'cozy sweaters', 'transitional styles'],
        accessories: ['boots', 'cozy scarves', 'structured bags', 'warm accessories'],
        general: ['autumn colors', 'cozy textures', 'transitional pieces']
      },
      winter: {
        clothing: ['dark colors', 'warm layers', 'cozy knits', 'winter coats'],
        accessories: ['warm gloves', 'winter boots', 'knit accessories', 'statement coats'],
        general: ['winter essentials', 'warm and cozy', 'holiday styles']
      }
    };
    
    const seasonTrends = trends[season] || trends.winter;
    return seasonTrends[category || 'general'] || seasonTrends.general;
  }

  /**
   * Get seasonal recommendations
   */
  private getSeasonalRecommendations(season: string, category?: string): string[] {
    const recommendations: Record<string, string[]> = {
      spring: [
        'Embrace light layers for changing temperatures',
        'Try pastel colors for a fresh spring look',
        'Consider breathable fabrics like cotton and linen'
      ],
      summer: [
        'Opt for lightweight, breathable materials',
        'Choose bright, cheerful colors',
        'Consider sun protection in your styling'
      ],
      fall: [
        'Layer pieces for temperature changes',
        'Embrace rich earth tones',
        'Mix textures for visual interest'
      ],
      winter: [
        'Focus on warmth and comfort',
        'Choose rich, deep colors',
        'Layer strategically for both style and warmth'
      ]
    };
    
    return recommendations[season] || recommendations.winter;
  }
}

/**
 * Factory function
 */
export function createVogueTrendWhisperer(vertexAIClient: VertexAIClient): VogueTrendWhisperer {
  return new VogueTrendWhisperer(vertexAIClient);
}

