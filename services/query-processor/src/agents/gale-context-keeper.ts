/**
 * Gale Context Keeper - Environmental Context Enrichment Agent
 * 
 * Responsibilities:
 * - Add environmental context (weather, season, location)
 * - Enhance queries with temporal context
 * - Consider user's current situation
 * - Provide location-aware recommendations
 */

import { VertexAIClient } from '../vertexai/client';
import { ClarifiedQuery, ContextualQuery } from '../types';

export class GaleContextKeeper {
  private vertexAIClient: VertexAIClient;

  constructor(vertexAIClient: VertexAIClient) {
    this.vertexAIClient = vertexAIClient;
  }

  /**
   * Enrich clarified query with environmental context
   */
  async enrichContext(clarifiedQuery: ClarifiedQuery): Promise<ContextualQuery> {
    const originalQuery = clarifiedQuery.intent.originalQuery;
    console.log(`[Gale] Enriching context for: ${originalQuery}`);

    try {
      // Extract location and season from query text first
      const extractedContext = this.extractContextFromQuery(originalQuery);
      
      // Get environmental context (will use extracted values if available)
      const environmentalContext = await this.getEnvironmentalContext(extractedContext);
      
      const contextualQuery: ContextualQuery = {
        clarified: clarifiedQuery,
        location: environmentalContext.location,
        weather: environmentalContext.weather,
        season: environmentalContext.season,
        timeOfDay: environmentalContext.timeOfDay,
        environmentalContext: environmentalContext.additional
      };

      console.log(`[Gale] Context enrichment complete: ${environmentalContext.season}, ${environmentalContext.weather}, location: ${environmentalContext.location}`);
      return contextualQuery;

    } catch (error) {
      console.error('[Gale] Context enrichment failed:', error);
      
      // Fallback to basic context
      return this.fallbackContextEnrichment(clarifiedQuery);
    }
  }

  /**
   * Extract location and season from query text
   */
  private extractContextFromQuery(query: string): { location?: string; season?: string } {
    const queryLower = query.toLowerCase();
    const extracted: { location?: string; season?: string } = {};
    
    // Common location keywords
    const locations = [
      'india', 'usa', 'united states', 'uk', 'united kingdom', 'canada', 'australia',
      'france', 'germany', 'spain', 'italy', 'japan', 'china', 'brazil', 'mexico',
      'dubai', 'singapore', 'thailand', 'indonesia', 'philippines', 'malaysia',
      'new york', 'london', 'paris', 'tokyo', 'mumbai', 'delhi', 'bangalore'
    ];
    
    for (const loc of locations) {
      if (queryLower.includes(loc)) {
        extracted.location = loc.charAt(0).toUpperCase() + loc.slice(1);
        break;
      }
    }
    
    // Season keywords
    const seasons = ['summer', 'winter', 'spring', 'fall', 'autumn'];
    for (const season of seasons) {
      if (queryLower.includes(season)) {
        extracted.season = season;
        break;
      }
    }
    
    return extracted;
  }

  /**
   * Get environmental context using AI and system information
   */
  private async getEnvironmentalContext(extracted?: { location?: string; season?: string }): Promise<{
    location: string;
    weather: string;
    season: string;
    timeOfDay: string;
    additional: Record<string, string>;
  }> {
    const currentDate = new Date();
    
    // Use extracted season from query, or fallback to current season
    const season = extracted?.season || this.getCurrentSeason(currentDate);
    const timeOfDay = this.getTimeOfDay(currentDate);
    
    // Use extracted location from query, or environment variable, or default
    const location = extracted?.location || process.env.USER_LOCATION || 'Unknown';
    
    // Get weather based on extracted season (or current season)
    const weather = this.getWeatherForSeason(season, timeOfDay);
    
    // Use AI to enhance context understanding
    const prompt = this.buildContextPrompt(location, season, weather, timeOfDay);
    
    try {
      const result = await this.vertexAIClient.generateText(prompt);
      const additional = this.parseContextResponse(result);
      
      return {
        location,
        weather,
        season,
        timeOfDay,
        additional
      };
      
    } catch (error) {
      console.warn('[Gale] AI context enhancement failed, using basic context');
      
      return {
        location,
        weather,
        season,
        timeOfDay,
        additional: {
          context_note: `Basic context for ${season} ${timeOfDay}`,
          recommendations: 'Consider seasonal appropriateness'
        }
      };
    }
  }

  /**
   * Build prompt for AI context enhancement
   */
  private buildContextPrompt(
    location: string,
    season: string,
    weather: string,
    timeOfDay: string
  ): string {
    return `You are Gale, an expert at understanding environmental and situational context for product recommendations.

Current Context:
- Location: ${location}
- Season: ${season}
- Weather: ${weather}
- Time of Day: ${timeOfDay}

Provide additional contextual insights that would help with product recommendations. Respond with JSON:

{
  "seasonal_recommendations": ["recommendation1", "recommendation2"],
  "weather_considerations": ["consideration1", "consideration2"],
  "time_considerations": ["consideration1", "consideration2"],
  "location_insights": ["insight1", "insight2"],
  "context_note": "Brief summary of the current context",
  "recommendations": "General recommendations based on context"
}

Guidelines:
- Focus on how context affects product choices
- Consider seasonal appropriateness
- Think about weather-related needs
- Consider time-of-day usage patterns
- Keep insights practical and actionable

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Parse AI response for additional context
   */
  private parseContextResponse(response: string): Record<string, string> {
    try {
      // Handle undefined or null response
      if (!response || typeof response !== 'string') {
        console.log('[Gale] Invalid response format, using fallback');
        return this.basicContextFallback();
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        seasonal_recommendations: JSON.stringify(parsed.seasonal_recommendations || []),
        weather_considerations: JSON.stringify(parsed.weather_considerations || []),
        time_considerations: JSON.stringify(parsed.time_considerations || []),
        location_insights: JSON.stringify(parsed.location_insights || []),
        context_note: parsed.context_note || 'Context-enhanced recommendations',
        recommendations: parsed.recommendations || 'Consider environmental factors'
      };
      
    } catch (error) {
      console.warn('[Gale] Failed to parse context response:', error);
      
      return this.basicContextFallback();
    }
  }

  /**
   * Get current season based on date
   */
  private getCurrentSeason(date: Date): string {
    const month = date.getMonth() + 1; // 1-12
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  /**
   * Get time of day based on current time
   */
  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get weather based on season (more appropriate for the season)
   */
  private getWeatherForSeason(season: string, timeOfDay: string): string {
    const weatherMap: Record<string, string[]> = {
      spring: ['sunny', 'partly_cloudy', 'light_rain', 'windy'],
      summer: ['sunny', 'hot', 'humid', 'partly_cloudy'],
      fall: ['cool', 'cloudy', 'rainy', 'windy'],
      winter: ['cold', 'snowy', 'cloudy', 'clear'],
      autumn: ['cool', 'cloudy', 'rainy', 'windy']
    };
    
    const weathers = weatherMap[season.toLowerCase()] || ['mild'];
    // Use first weather option as default (most common for season)
    // In production, you'd integrate with weather API
    return weathers[0];
  }

  /**
   * Fallback context enrichment
   */
  private fallbackContextEnrichment(clarifiedQuery: ClarifiedQuery): ContextualQuery {
    const currentDate = new Date();
    const season = this.getCurrentSeason(currentDate);
    const timeOfDay = this.getTimeOfDay(currentDate);
    
    return {
      clarified: clarifiedQuery,
      location: 'Unknown',
      weather: 'mild',
      season,
      timeOfDay,
      environmentalContext: {
        context_note: `Basic context: ${season} ${timeOfDay}`,
        recommendations: 'Consider seasonal appropriateness'
      }
    };
  }

  private basicContextFallback(): Record<string, string> {
    return {
      context_note: 'Basic environmental context applied',
      recommendations: 'Consider seasonal and weather factors'
    };
  }
}

/**
 * Factory function
 */
export function createGaleContextKeeper(vertexAIClient: VertexAIClient): GaleContextKeeper {
  return new GaleContextKeeper(vertexAIClient);
}
