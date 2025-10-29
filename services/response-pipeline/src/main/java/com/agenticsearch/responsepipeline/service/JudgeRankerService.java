/**
 * Judge Ranker Service - Ranking and Scoring Agent
 * 
 * Responsibilities:
 * - Score and rank look bundles
 * - Apply business rules and user preferences
 * - Calculate final recommendation scores
 * - Determine confidence levels
 */

package com.agenticsearch.responsepipeline.service;

import com.agenticsearch.responsepipeline.model.LookBundle;
import com.agenticsearch.responsepipeline.model.RankedLook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class JudgeRankerService {
    
    private static final Logger logger = LoggerFactory.getLogger(JudgeRankerService.class);
    
    /**
     * Rank look bundles based on multiple scoring criteria
     * @param bundles List of look bundles to rank
     * @param userPreferences User preferences and context
     * @param maxResults Maximum number of ranked results to return
     * @return Mono<List<RankedLook>> - List of ranked and scored looks
     */
    public Mono<List<RankedLook>> rankBundles(List<LookBundle> bundles, 
                                            Map<String, Object> userPreferences, 
                                            int maxResults) {
        logger.info("Ranking {} bundles with user preferences: {}", 
            bundles.size(), userPreferences);
        
        return Mono.fromCallable(() -> {
            if (bundles == null || bundles.isEmpty()) {
                logger.warn("No bundles provided for ranking");
                return new ArrayList<RankedLook>();
            }
            
            List<RankedLook> rankedLooks = new ArrayList<>();
            
            for (LookBundle bundle : bundles) {
                if (!bundle.isValid()) {
                    logger.debug("Skipping invalid bundle: {}", bundle.getBundleId());
                    continue;
                }
                
                RankedLook rankedLook = rankSingleBundle(bundle, userPreferences);
                if (rankedLook != null) {
                    rankedLooks.add(rankedLook);
                }
            }
            
            // Sort by final score (highest first)
            rankedLooks.sort((a, b) -> Double.compare(b.getFinalScore(), a.getFinalScore()));
            
            // Assign ranks
            for (int i = 0; i < rankedLooks.size(); i++) {
                rankedLooks.get(i).setRank(i + 1);
            }
            
            // Limit results
            if (rankedLooks.size() > maxResults) {
                rankedLooks = rankedLooks.subList(0, maxResults);
            }
            
            logger.info("Ranked {} looks, returning top {}", bundles.size(), rankedLooks.size());
            return rankedLooks;
        });
    }
    
    /**
     * Rank a single bundle
     */
    private RankedLook rankSingleBundle(LookBundle bundle, Map<String, Object> userPreferences) {
        Map<String, Double> scoreBreakdown = new HashMap<>();
        
        // Core scoring components
        double coherenceScore = bundle.getCoherenceScore();
        double styleScore = calculateStyleScore(bundle, userPreferences);
        double priceScore = calculatePriceScore(bundle, userPreferences);
        double qualityScore = calculateQualityScore(bundle);
        double trendScore = calculateTrendScore(bundle, userPreferences);
        double userPreferenceScore = calculateUserPreferenceScore(bundle, userPreferences);
        
        // Store individual scores
        scoreBreakdown.put("coherence", coherenceScore);
        scoreBreakdown.put("style", styleScore);
        scoreBreakdown.put("price", priceScore);
        scoreBreakdown.put("quality", qualityScore);
        scoreBreakdown.put("trend", trendScore);
        scoreBreakdown.put("user_preference", userPreferenceScore);
        
        // Calculate weighted final score
        double finalScore = calculateWeightedScore(scoreBreakdown, userPreferences);
        
        // Calculate confidence
        double confidence = calculateConfidence(scoreBreakdown, bundle);
        
        // Generate recommendation reason
        String recommendationReason = generateRecommendationReason(scoreBreakdown, bundle);
        
        RankedLook rankedLook = new RankedLook(bundle, finalScore, scoreBreakdown, 0);
        rankedLook.setConfidence(confidence);
        rankedLook.setRecommendationReason(recommendationReason);
        rankedLook.setUserPreferenceMatch(userPreferenceScore);
        rankedLook.setTrendAlignment(trendScore);
        
        return rankedLook;
    }
    
    /**
     * Calculate style score based on user preferences
     */
    private double calculateStyleScore(LookBundle bundle, Map<String, Object> userPreferences) {
        double baseScore = bundle.getStyleCoherence();
        
        // Check for preferred style themes
        String preferredTheme = (String) userPreferences.getOrDefault("preferred_theme", "");
        if (!preferredTheme.isEmpty() && preferredTheme.equalsIgnoreCase(bundle.getStyleTheme())) {
            baseScore += 0.2; // Bonus for matching preferred theme
        }
        
        // Check for preferred colors
        @SuppressWarnings("unchecked")
        List<String> preferredColors = (List<String>) userPreferences.getOrDefault("preferred_colors", List.of());
        if (!preferredColors.isEmpty()) {
            double colorMatchScore = calculateColorMatchScore(bundle, preferredColors);
            baseScore += colorMatchScore * 0.3;
        }
        
        // Check for preferred brands
        @SuppressWarnings("unchecked")
        List<String> preferredBrands = (List<String>) userPreferences.getOrDefault("preferred_brands", List.of());
        if (!preferredBrands.isEmpty()) {
            double brandMatchScore = calculateBrandMatchScore(bundle, preferredBrands);
            baseScore += brandMatchScore * 0.2;
        }
        
        return Math.min(1.0, baseScore);
    }
    
    /**
     * Calculate price score based on user budget
     */
    private double calculatePriceScore(LookBundle bundle, Map<String, Object> userPreferences) {
        double totalPrice = bundle.getTotalPrice();
        
        // Get budget preferences
        Double maxBudget = (Double) userPreferences.get("max_budget");
        Double preferredBudget = (Double) userPreferences.get("preferred_budget");
        
        if (maxBudget != null && totalPrice > maxBudget) {
            return 0.0; // Over budget = zero score
        }
        
        if (preferredBudget != null) {
            // Score higher when closer to preferred budget
            double budgetDifference = Math.abs(totalPrice - preferredBudget);
            double budgetRatio = preferredBudget > 0 ? budgetDifference / preferredBudget : 1.0;
            return Math.max(0.0, 1.0 - budgetRatio);
        }
        
        // Default scoring based on price range
        String priceRange = bundle.getPriceRange();
        return switch (priceRange) {
            case "budget" -> 0.8;
            case "affordable" -> 0.9;
            case "moderate" -> 1.0;
            case "premium" -> 0.7;
            case "luxury" -> 0.5;
            default -> 0.5;
        };
    }
    
    /**
     * Calculate quality score based on product ratings and popularity
     */
    private double calculateQualityScore(LookBundle bundle) {
        if (bundle.getItems() == null || bundle.getItems().isEmpty()) {
            return 0.0;
        }
        
        double totalRating = 0.0;
        double totalPopularity = 0.0;
        int itemCount = bundle.getItems().size();
        
        for (var item : bundle.getItems()) {
            totalRating += item.getProduct().getRating();
            totalPopularity += item.getProduct().getPopularityScore();
        }
        
        double avgRating = totalRating / itemCount;
        double avgPopularity = totalPopularity / itemCount;
        
        // Normalize rating (assuming 0-5 scale)
        double normalizedRating = Math.min(1.0, avgRating / 5.0);
        
        // Combine rating and popularity (weighted)
        return (normalizedRating * 0.7) + (avgPopularity * 0.3);
    }
    
    /**
     * Calculate trend score based on current trends
     */
    private double calculateTrendScore(LookBundle bundle, Map<String, Object> userPreferences) {
        double baseScore = 0.5; // Neutral base score
        
        // Check for seasonal trends
        String currentSeason = (String) userPreferences.getOrDefault("current_season", "");
        if (!currentSeason.isEmpty() && currentSeason.equalsIgnoreCase(bundle.getStyleTheme())) {
            baseScore += 0.3;
        }
        
        // Check for occasion trends
        String occasion = (String) userPreferences.getOrDefault("occasion", "");
        if (!occasion.isEmpty()) {
            double occasionMatch = calculateOccasionMatch(bundle, occasion);
            baseScore += occasionMatch * 0.2;
        }
        
        // Check for trending colors (mock implementation)
        List<String> trendingColors = Arrays.asList("navy", "forest green", "terracotta", "cream");
        double trendingColorScore = calculateTrendingColorScore(bundle, trendingColors);
        baseScore += trendingColorScore * 0.1;
        
        return Math.min(1.0, baseScore);
    }
    
    /**
     * Calculate user preference match score
     */
    private double calculateUserPreferenceScore(LookBundle bundle, Map<String, Object> userPreferences) {
        double score = 0.5; // Base score
        
        // Check for specific preferences
        String preferredStyle = (String) userPreferences.getOrDefault("preferred_style", "");
        if (!preferredStyle.isEmpty() && bundle.getStyleTheme().toLowerCase().contains(preferredStyle.toLowerCase())) {
            score += 0.2;
        }
        
        String preferredOccasion = (String) userPreferences.getOrDefault("preferred_occasion", "");
        if (!preferredOccasion.isEmpty() && bundle.getDescription().toLowerCase().contains(preferredOccasion.toLowerCase())) {
            score += 0.2;
        }
        
        // Check for size preferences
        String preferredSize = (String) userPreferences.getOrDefault("preferred_size", "");
        if (!preferredSize.isEmpty()) {
            double sizeMatchScore = calculateSizeMatchScore(bundle, preferredSize);
            score += sizeMatchScore * 0.1;
        }
        
        return Math.min(1.0, score);
    }
    
    /**
     * Calculate weighted final score
     */
    private double calculateWeightedScore(Map<String, Double> scoreBreakdown, Map<String, Object> userPreferences) {
        // Default weights
        Map<String, Double> weights = new HashMap<>(Map.of(
            "coherence", 0.25,
            "style", 0.20,
            "price", 0.20,
            "quality", 0.15,
            "trend", 0.10,
            "user_preference", 0.10
        ));
        
        // Adjust weights based on user preferences
        String priority = (String) userPreferences.getOrDefault("priority", "balanced");
        switch (priority.toLowerCase()) {
            case "price" -> {
                weights.put("price", 0.40);
                weights.put("coherence", 0.20);
                weights.put("style", 0.15);
                weights.put("quality", 0.10);
                weights.put("trend", 0.10);
                weights.put("user_preference", 0.05);
            }
            case "style" -> {
                weights.put("style", 0.35);
                weights.put("coherence", 0.25);
                weights.put("price", 0.15);
                weights.put("quality", 0.10);
                weights.put("trend", 0.10);
                weights.put("user_preference", 0.05);
            }
            case "quality" -> {
                weights.put("quality", 0.30);
                weights.put("coherence", 0.25);
                weights.put("style", 0.20);
                weights.put("price", 0.15);
                weights.put("trend", 0.05);
                weights.put("user_preference", 0.05);
            }
        }
        
        // Calculate weighted sum
        double finalScore = 0.0;
        for (Map.Entry<String, Double> entry : scoreBreakdown.entrySet()) {
            String component = entry.getKey();
            double score = entry.getValue();
            double weight = weights.getOrDefault(component, 0.0);
            finalScore += score * weight;
        }
        
        return Math.min(1.0, finalScore);
    }
    
    /**
     * Calculate confidence score
     */
    private double calculateConfidence(Map<String, Double> scoreBreakdown, LookBundle bundle) {
        // Higher confidence when scores are more consistent
        double scoreVariance = calculateScoreVariance(scoreBreakdown);
        double baseConfidence = 1.0 - scoreVariance;
        
        // Bonus for complete bundles (more items = higher confidence)
        double completenessBonus = Math.min(0.2, bundle.getItemCount() * 0.05);
        
        // Bonus for high coherence
        double coherenceBonus = bundle.getCoherenceScore() * 0.1;
        
        return Math.min(1.0, baseConfidence + completenessBonus + coherenceBonus);
    }
    
    /**
     * Generate recommendation reason
     */
    private String generateRecommendationReason(Map<String, Double> scoreBreakdown, LookBundle bundle) {
        List<String> reasons = new ArrayList<>();
        
        // Find top scoring components
        String topComponent = scoreBreakdown.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse("overall");
        
        double topScore = scoreBreakdown.getOrDefault(topComponent, 0.0);
        
        if (topScore > 0.8) {
            reasons.add(String.format("Excellent %s score (%.1f%%)", topComponent, topScore * 100));
        } else if (topScore > 0.6) {
            reasons.add(String.format("Good %s score (%.1f%%)", topComponent, topScore * 100));
        }
        
        // Add specific reasons based on scores
        if (scoreBreakdown.getOrDefault("price", 0.0) > 0.8) {
            reasons.add("Great value for money");
        }
        if (scoreBreakdown.getOrDefault("style", 0.0) > 0.8) {
            reasons.add("Perfect style match");
        }
        if (scoreBreakdown.getOrDefault("quality", 0.0) > 0.8) {
            reasons.add("High-quality items");
        }
        
        // Add bundle-specific reasons
        if (bundle.getCoherenceScore() > 0.8) {
            reasons.add("Items work well together");
        }
        if (bundle.getColorHarmony() > 0.7) {
            reasons.add("Beautiful color coordination");
        }
        
        if (reasons.isEmpty()) {
            return "Well-rounded look with good overall appeal";
        }
        
        return String.join(", ", reasons);
    }
    
    // Helper methods
    private double calculateColorMatchScore(LookBundle bundle, List<String> preferredColors) {
        if (preferredColors.isEmpty()) return 0.0;
        
        int matchingItems = 0;
        for (var item : bundle.getItems()) {
            String itemColor = item.getProduct().getColor().toLowerCase();
            if (preferredColors.stream().anyMatch(pref -> 
                itemColor.contains(pref.toLowerCase()) || pref.toLowerCase().contains(itemColor))) {
                matchingItems++;
            }
        }
        
        return (double) matchingItems / bundle.getItems().size();
    }
    
    private double calculateBrandMatchScore(LookBundle bundle, List<String> preferredBrands) {
        if (preferredBrands.isEmpty()) return 0.0;
        
        int matchingItems = 0;
        for (var item : bundle.getItems()) {
            String itemBrand = item.getProduct().getBrand().toLowerCase();
            if (preferredBrands.stream().anyMatch(pref -> 
                itemBrand.contains(pref.toLowerCase()) || pref.toLowerCase().contains(itemBrand))) {
                matchingItems++;
            }
        }
        
        return (double) matchingItems / bundle.getItems().size();
    }
    
    private double calculateOccasionMatch(LookBundle bundle, String occasion) {
        String bundleDescription = bundle.getDescription().toLowerCase();
        String bundleTheme = bundle.getStyleTheme().toLowerCase();
        String occasionLower = occasion.toLowerCase();
        
        return bundleDescription.contains(occasionLower) || bundleTheme.contains(occasionLower) ? 1.0 : 0.0;
    }
    
    private double calculateTrendingColorScore(LookBundle bundle, List<String> trendingColors) {
        int trendingItems = 0;
        for (var item : bundle.getItems()) {
            String itemColor = item.getProduct().getColor().toLowerCase();
            if (trendingColors.stream().anyMatch(trending -> 
                itemColor.contains(trending.toLowerCase()))) {
                trendingItems++;
            }
        }
        
        return (double) trendingItems / bundle.getItems().size();
    }
    
    private double calculateSizeMatchScore(LookBundle bundle, String preferredSize) {
        int matchingItems = 0;
        for (var item : bundle.getItems()) {
            String itemSize = item.getProduct().getSize();
            if (itemSize != null && itemSize.equalsIgnoreCase(preferredSize)) {
                matchingItems++;
            }
        }
        
        return (double) matchingItems / bundle.getItems().size();
    }
    
    private double calculateScoreVariance(Map<String, Double> scores) {
        if (scores.isEmpty()) return 0.0;
        
        double mean = scores.values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double variance = scores.values().stream()
            .mapToDouble(score -> Math.pow(score - mean, 2))
            .average()
            .orElse(0.0);
        
        return Math.sqrt(variance);
    }
}

