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
    console.log(`[Gale] Enriching context for: ${clarifiedQuery.intent.originalQuery}`);

    try {
      // Get environmental context
      const environmentalContext = await this.getEnvironmentalContext();
      
      const contextualQuery: ContextualQuery = {
        clarified: clarifiedQuery,
        location: environmentalContext.location,
        weather: environmentalContext.weather,
        season: environmentalContext.season,
        timeOfDay: environmentalContext.timeOfDay,
        environmentalContext: environmentalContext.additional
      };

      console.log(`[Gale] Context enrichment complete: ${environmentalContext.season}, ${environmentalContext.weather}`);
      return contextualQuery;

    } catch (error) {
      console.error('[Gale] Context enrichment failed:', error);
      
      // Fallback to basic context
      return this.fallbackContextEnrichment(clarifiedQuery);
    }
  }

  /**
   * Get environmental context using AI and system information
   */
  private async getEnvironmentalContext(): Promise<{
    location: string;
    weather: string;
    season: string;
    timeOfDay: string;
    additional: Record<string, string>;
  }> {
    const currentDate = new Date();
    const season = this.getCurrentSeason(currentDate);
    const timeOfDay = this.getTimeOfDay(currentDate);
    
    // Try to get location from environment or use default
    const location = process.env.USER_LOCATION || 'Unknown';
    
    // For now, use mock weather data (in production, integrate with weather API)
    const weather = this.getMockWeather(season, timeOfDay);
    
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
        return this.createFallbackContext();
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
      
      return {
        context_note: 'Basic environmental context applied',
        recommendations: 'Consider seasonal and weather factors'
      };
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
   * Get mock weather based on season and time
   */
  private getMockWeather(season: string, timeOfDay: string): string {
    const weatherMap: Record<string, string[]> = {
      spring: ['sunny', 'partly_cloudy', 'light_rain', 'windy'],
      summer: ['sunny', 'hot', 'humid', 'partly_cloudy'],
      fall: ['cool', 'cloudy', 'rainy', 'windy'],
      winter: ['cold', 'snowy', 'cloudy', 'clear']
    };
    
    const weathers = weatherMap[season] || ['mild'];
    return weathers[Math.floor(Math.random() * weathers.length)];
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
}

/**
 * Factory function
 */
export function createGaleContextKeeper(vertexAIClient: VertexAIClient): GaleContextKeeper {
  return new GaleContextKeeper(vertexAIClient);
}
