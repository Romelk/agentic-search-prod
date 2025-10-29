/**
 * Sage Explainer Service - Explanation Generation Agent
 * 
 * Responsibilities:
 * - Generate friendly explanations for recommendations
 * - Create "Why this works" rationales
 * - Provide styling tips and advice
 * - Explain color coordination and style choices
 */

package com.agenticsearch.responsepipeline.service;

import com.agenticsearch.responsepipeline.model.RankedLook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;

@Service
public class SageExplainerService {
    
    private static final Logger logger = LoggerFactory.getLogger(SageExplainerService.class);
    
    /**
     * Generate explanations for ranked looks
     * @param rankedLooks List of ranked looks to explain
     * @param userQuery Original user query for context
     * @return Mono<List<RankedLook>> - List of looks with explanations added
     */
    public Mono<List<RankedLook>> generateExplanations(List<RankedLook> rankedLooks, String userQuery) {
        logger.info("Generating explanations for {} ranked looks", rankedLooks.size());
        
        return Mono.fromCallable(() -> {
            List<RankedLook> explainedLooks = new ArrayList<>();
            
            for (RankedLook rankedLook : rankedLooks) {
                RankedLook explainedLook = generateExplanationForLook(rankedLook, userQuery);
                explainedLooks.add(explainedLook);
            }
            
            logger.info("Generated explanations for {} looks", explainedLooks.size());
            return explainedLooks;
        });
    }
    
    /**
     * Generate explanation for a single ranked look
     */
    private RankedLook generateExplanationForLook(RankedLook rankedLook, String userQuery) {
        // Create a copy to avoid modifying the original
        RankedLook explainedLook = new RankedLook(
            rankedLook.getLook(), 
            rankedLook.getFinalScore(), 
            rankedLook.getScoreBreakdown(), 
            rankedLook.getRank()
        );
        
        // Copy other properties
        explainedLook.setConfidence(rankedLook.getConfidence());
        explainedLook.setRecommendationReason(rankedLook.getRecommendationReason());
        explainedLook.setUserPreferenceMatch(rankedLook.getUserPreferenceMatch());
        explainedLook.setTrendAlignment(rankedLook.getTrendAlignment());
        
        // Generate comprehensive explanation
        String explanation = generateComprehensiveExplanation(rankedLook, userQuery);
        
        // Add explanation to the look (assuming we add this field to RankedLook)
        // For now, we'll enhance the recommendation reason
        String enhancedReason = rankedLook.getRecommendationReason() + 
            "\n\n" + explanation;
        explainedLook.setRecommendationReason(enhancedReason);
        
        return explainedLook;
    }
    
    /**
     * Generate comprehensive explanation for a look
     */
    private String generateComprehensiveExplanation(RankedLook rankedLook, String userQuery) {
        StringBuilder explanation = new StringBuilder();
        
        // Style theme explanation
        explanation.append(generateStyleThemeExplanation(rankedLook));
        
        // Color coordination explanation
        explanation.append(generateColorExplanation(rankedLook));
        
        // Item combination explanation
        explanation.append(generateCombinationExplanation(rankedLook));
        
        // Occasion appropriateness
        explanation.append(generateOccasionExplanation(rankedLook, userQuery));
        
        // Styling tips
        explanation.append(generateStylingTips(rankedLook));
        
        // Price value explanation
        explanation.append(generateValueExplanation(rankedLook));
        
        return explanation.toString();
    }
    
    /**
     * Generate style theme explanation
     */
    private String generateStyleThemeExplanation(RankedLook rankedLook) {
        String theme = rankedLook.getLook().getStyleTheme();
        double coherenceScore = rankedLook.getLook().getCoherenceScore();
        
        return String.format(
            "✨ **%s Style**: This %s look creates a cohesive aesthetic. " +
            "The items work together harmoniously (%.0f%% coherence), creating a polished appearance that's perfect for %s occasions.\n\n",
            capitalizeFirst(theme),
            theme,
            coherenceScore * 100,
            theme
        );
    }
    
    /**
     * Generate color coordination explanation
     */
    private String generateColorExplanation(RankedLook rankedLook) {
        double colorHarmony = rankedLook.getLook().getColorHarmony();
        List<String> colors = extractColors(rankedLook.getLook());
        
        String colorDescription;
        if (colorHarmony > 0.8) {
            colorDescription = "The color palette is beautifully coordinated with complementary tones";
        } else if (colorHarmony > 0.6) {
            colorDescription = "The colors work well together with good harmony";
        } else {
            colorDescription = "The color combination creates an interesting contrast";
        }
        
        return String.format(
            "🎨 **Color Harmony**: %s. Featured colors include %s, creating a %s effect.\n\n",
            colorDescription,
            String.join(", ", colors),
            colorHarmony > 0.7 ? "sophisticated" : "bold"
        );
    }
    
    /**
     * Generate item combination explanation
     */
    private String generateCombinationExplanation(RankedLook rankedLook) {
        var items = rankedLook.getLook().getItems();
        String itemCount = String.valueOf(items.size());
        String priceRange = rankedLook.getLook().getPriceRange();
        
        StringBuilder combination = new StringBuilder();
        combination.append(String.format(
            "👗 **Perfect Combination**: This %s-piece ensemble includes:\n",
            itemCount
        ));
        
        for (int i = 0; i < items.size(); i++) {
            var item = items.get(i);
            String category = capitalizeFirst(item.getProduct().getCategory());
            String name = item.getProduct().getName();
            combination.append(String.format("   %d. %s - %s\n", i + 1, category, name));
        }
        
        combination.append(String.format(
            "\nThe %s price point offers excellent value while maintaining quality and style.\n\n",
            priceRange
        ));
        
        return combination.toString();
    }
    
    /**
     * Generate occasion appropriateness explanation
     */
    private String generateOccasionExplanation(RankedLook rankedLook, String userQuery) {
        String theme = rankedLook.getLook().getStyleTheme();
        String occasion = extractOccasionFromQuery(userQuery);
        
        if (occasion.isEmpty()) {
            occasion = mapThemeToOccasion(theme);
        }
        
        return String.format(
            "🎯 **Perfect For**: This look is ideal for %s. " +
            "The %s styling ensures you'll feel confident and appropriately dressed for the occasion.\n\n",
            occasion,
            theme
        );
    }
    
    /**
     * Generate styling tips
     */
    private String generateStylingTips(RankedLook rankedLook) {
        String theme = rankedLook.getLook().getStyleTheme();
        List<String> tips = getStylingTipsForTheme(theme);
        
        StringBuilder stylingTips = new StringBuilder("💡 **Styling Tips**:\n");
        for (String tip : tips) {
            stylingTips.append("   • ").append(tip).append("\n");
        }
        stylingTips.append("\n");
        
        return stylingTips.toString();
    }
    
    /**
     * Generate value explanation
     */
    private String generateValueExplanation(RankedLook rankedLook) {
        double totalPrice = rankedLook.getLook().getTotalPrice();
        double qualityScore = rankedLook.getScoreBreakdown().getOrDefault("quality", 0.0);
        String priceRange = rankedLook.getLook().getPriceRange();
        
        String valueDescription;
        if (qualityScore > 0.8 && totalPrice < 150) {
            valueDescription = "This look offers exceptional value with high-quality pieces at an affordable price";
        } else if (qualityScore > 0.6) {
            valueDescription = "You get great quality and style for the investment";
        } else {
            valueDescription = "This look provides good style value for the price range";
        }
        
        return String.format(
            "💰 **Value**: %s. At $%.2f total, this %s ensemble gives you a complete, coordinated look that's worth the investment.\n\n",
            valueDescription,
            totalPrice,
            priceRange
        );
    }
    
    // Helper methods
    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
    
    private List<String> extractColors(RankedLook.LookBundle look) {
        return look.getItems().stream()
            .map(item -> item.getProduct().getColor())
            .distinct()
            .limit(3) // Limit to 3 main colors
            .toList();
    }
    
    private String extractOccasionFromQuery(String query) {
        String queryLower = query.toLowerCase();
        
        if (queryLower.contains("party") || queryLower.contains("night out")) {
            return "evening parties and social events";
        } else if (queryLower.contains("work") || queryLower.contains("office")) {
            return "professional settings and business meetings";
        } else if (queryLower.contains("wedding") || queryLower.contains("formal")) {
            return "formal events and special occasions";
        } else if (queryLower.contains("casual") || queryLower.contains("weekend")) {
            return "casual outings and weekend activities";
        } else if (queryLower.contains("date") || queryLower.contains("dinner")) {
            return "date nights and dinner outings";
        } else if (queryLower.contains("vacation") || queryLower.contains("travel")) {
            return "travel and vacation activities";
        }
        
        return "";
    }
    
    private String mapThemeToOccasion(String theme) {
        return switch (theme.toLowerCase()) {
            case "casual" -> "casual outings and everyday wear";
            case "formal" -> "formal events and business occasions";
            case "party" -> "evening parties and social gatherings";
            case "work" -> "professional settings and office environments";
            case "summer" -> "warm weather activities and summer events";
            case "winter" -> "cold weather occasions and winter activities";
            default -> "various occasions";
        };
    }
    
    private List<String> getStylingTipsForTheme(String theme) {
        return switch (theme.toLowerCase()) {
            case "casual" -> Arrays.asList(
                "Layer pieces for versatility",
                "Choose comfortable, breathable fabrics",
                "Accessorize with simple, understated pieces",
                "Mix textures for visual interest"
            );
            case "formal" -> Arrays.asList(
                "Ensure proper fit and tailoring",
                "Choose classic, timeless pieces",
                "Keep accessories minimal and elegant",
                "Pay attention to color coordination"
            );
            case "party" -> Arrays.asList(
                "Add statement accessories for impact",
                "Choose bold colors or patterns",
                "Consider the venue's dress code",
                "Balance bold pieces with neutral ones"
            );
            case "work" -> Arrays.asList(
                "Maintain a professional appearance",
                "Choose appropriate hemlines and necklines",
                "Invest in quality, wrinkle-resistant fabrics",
                "Keep colors business-appropriate"
            );
            case "summer" -> Arrays.asList(
                "Choose lightweight, breathable materials",
                "Opt for lighter colors and pastels",
                "Protect from sun with appropriate accessories",
                "Consider layering for temperature changes"
            );
            case "winter" -> Arrays.asList(
                "Layer for warmth and style",
                "Choose rich, deep colors",
                "Invest in quality outerwear",
                "Add texture with knits and wool"
            );
            default -> Arrays.asList(
                "Mix and match pieces for versatility",
                "Choose colors that complement your skin tone",
                "Invest in quality basics",
                "Accessorize to complete the look"
            );
        };
    }
}

