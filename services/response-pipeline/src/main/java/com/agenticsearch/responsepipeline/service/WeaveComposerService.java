/**
 * Weave Composer Service - Bundle Creation Agent
 * 
 * Responsibilities:
 * - Combine search candidates into cohesive look bundles
 * - Analyze product compatibility and style coherence
 * - Create themed collections (casual, formal, party, etc.)
 * - Calculate bundle coherence scores
 */

package com.agenticsearch.responsepipeline.service;

import com.agenticsearch.responsepipeline.model.LookBundle;
import com.agenticsearch.responsepipeline.model.SearchCandidate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class WeaveComposerService {
    
    private static final Logger logger = LoggerFactory.getLogger(WeaveComposerService.class);
    
    /**
     * Create look bundles from search candidates
     * @param searchCandidates List of search candidates
     * @param styleThemes Preferred style themes to focus on
     * @param maxBundles Maximum number of bundles to create
     * @return Mono<List<LookBundle>> - List of curated look bundles
     */
    public Mono<List<LookBundle>> createBundles(List<SearchCandidate> searchCandidates, 
                                               List<String> styleThemes, 
                                               int maxBundles) {
        logger.info("Creating bundles from {} candidates with themes: {}", 
            searchCandidates.size(), styleThemes);
        
        return Mono.fromCallable(() -> {
            if (searchCandidates == null || searchCandidates.isEmpty()) {
                logger.warn("No search candidates provided for bundle creation");
                return new ArrayList<LookBundle>();
            }
            
            // Group candidates by category for better bundle creation
            Map<String, List<SearchCandidate>> candidatesByCategory = 
                searchCandidates.stream()
                    .collect(Collectors.groupingBy(
                        candidate -> candidate.getProduct().getCategory()
                    ));
            
            List<LookBundle> bundles = new ArrayList<>();
            
            // Create bundles for each style theme
            for (String theme : styleThemes) {
                List<LookBundle> themeBundles = createBundlesForTheme(
                    candidatesByCategory, theme, maxBundles / styleThemes.size()
                );
                bundles.addAll(themeBundles);
            }
            
            // If we have remaining capacity, create general bundles
            if (bundles.size() < maxBundles) {
                List<LookBundle> generalBundles = createGeneralBundles(
                    candidatesByCategory, maxBundles - bundles.size()
                );
                bundles.addAll(generalBundles);
            }
            
            // Sort by coherence score
            bundles.sort((a, b) -> Double.compare(b.getCoherenceScore(), a.getCoherenceScore()));
            
            logger.info("Created {} look bundles", bundles.size());
            return bundles;
        });
    }
    
    /**
     * Create bundles for a specific style theme
     */
    private List<LookBundle> createBundlesForTheme(Map<String, List<SearchCandidate>> candidatesByCategory,
                                                  String theme, int maxBundles) {
        List<LookBundle> bundles = new ArrayList<>();
        
        // Define theme-specific product combinations
        Map<String, List<String>> themeCombinations = getThemeCombinations(theme);
        
        for (Map.Entry<String, List<String>> combination : themeCombinations.entrySet()) {
            if (bundles.size() >= maxBundles) break;
            
            String combinationName = combination.getKey();
            List<String> requiredCategories = combination.getValue();
            
            LookBundle bundle = createBundleForCombination(
                candidatesByCategory, requiredCategories, theme, combinationName
            );
            
            if (bundle != null && bundle.isValid()) {
                bundles.add(bundle);
            }
        }
        
        return bundles;
    }
    
    /**
     * Create general bundles without specific themes
     */
    private List<LookBundle> createGeneralBundles(Map<String, List<SearchCandidate>> candidatesByCategory,
                                                 int maxBundles) {
        List<LookBundle> bundles = new ArrayList<>();
        
        // Create mixed bundles with different category combinations
        List<List<String>> generalCombinations = Arrays.asList(
            Arrays.asList("clothing", "accessories"),
            Arrays.asList("clothing", "shoes"),
            Arrays.asList("accessories", "shoes"),
            Arrays.asList("clothing", "accessories", "shoes")
        );
        
        for (List<String> combination : generalCombinations) {
            if (bundles.size() >= maxBundles) break;
            
            LookBundle bundle = createBundleForCombination(
                candidatesByCategory, combination, "mixed", "Mixed Style Look"
            );
            
            if (bundle != null && bundle.isValid()) {
                bundles.add(bundle);
            }
        }
        
        return bundles;
    }
    
    /**
     * Create a bundle for a specific category combination
     */
    private LookBundle createBundleForCombination(Map<String, List<SearchCandidate>> candidatesByCategory,
                                                 List<String> requiredCategories, 
                                                 String theme, String bundleName) {
        List<SearchCandidate> bundleItems = new ArrayList<>();
        
        // Select best candidate from each required category
        for (String category : requiredCategories) {
            List<SearchCandidate> categoryCandidates = candidatesByCategory.get(category);
            if (categoryCandidates != null && !categoryCandidates.isEmpty()) {
                // Select the highest scoring candidate from this category
                SearchCandidate bestCandidate = categoryCandidates.stream()
                    .max(Comparator.comparingDouble(SearchCandidate::getSimilarityScore))
                    .orElse(null);
                
                if (bestCandidate != null) {
                    bundleItems.add(bestCandidate);
                }
            }
        }
        
        if (bundleItems.size() < 2) {
            // Need at least 2 items for a meaningful bundle
            return null;
        }
        
        // Calculate coherence score
        double coherenceScore = calculateCoherenceScore(bundleItems, theme);
        
        // Create bundle
        String bundleId = generateBundleId(theme, bundleItems);
        String description = generateBundleDescription(bundleItems, theme);
        
        LookBundle bundle = new LookBundle(bundleId, bundleName, bundleItems, 
                                         coherenceScore, theme, description);
        
        // Calculate additional metrics
        bundle.setStyleCoherence(calculateStyleCoherence(bundleItems));
        bundle.setColorHarmony(calculateColorHarmony(bundleItems));
        bundle.setPriceRange(determinePriceRange(bundle.getTotalPrice()));
        
        return bundle;
    }
    
    /**
     * Calculate coherence score for a bundle
     */
    private double calculateCoherenceScore(List<SearchCandidate> items, String theme) {
        if (items.size() < 2) {
            return 0.0;
        }
        
        double baseScore = 0.5; // Base score for having multiple items
        
        // Style coherence bonus
        double styleCoherence = calculateStyleCoherence(items);
        baseScore += styleCoherence * 0.3;
        
        // Color harmony bonus
        double colorHarmony = calculateColorHarmony(items);
        baseScore += colorHarmony * 0.2;
        
        // Category diversity bonus (but not too diverse)
        double categoryDiversity = calculateCategoryDiversity(items);
        baseScore += categoryDiversity * 0.1;
        
        // Theme alignment bonus
        double themeAlignment = calculateThemeAlignment(items, theme);
        baseScore += themeAlignment * 0.2;
        
        // Price consistency bonus
        double priceConsistency = calculatePriceConsistency(items);
        baseScore += priceConsistency * 0.1;
        
        return Math.min(1.0, baseScore);
    }
    
    /**
     * Calculate style coherence within the bundle
     */
    private double calculateStyleCoherence(List<SearchCandidate> items) {
        if (items.size() < 2) {
            return 1.0;
        }
        
        // Count common style tags
        Map<String, Integer> styleTagCounts = new HashMap<>();
        
        for (SearchCandidate item : items) {
            List<String> styleTags = item.getProduct().getStyleTags();
            if (styleTags != null) {
                for (String tag : styleTags) {
                    styleTagCounts.merge(tag.toLowerCase(), 1, Integer::sum);
                }
            }
        }
        
        // Calculate coherence based on shared style tags
        int totalTags = styleTagCounts.values().stream().mapToInt(Integer::intValue).sum();
        int sharedTags = styleTagCounts.values().stream()
            .mapToInt(count -> count > 1 ? count - 1 : 0)
            .sum();
        
        return totalTags > 0 ? (double) sharedTags / totalTags : 0.0;
    }
    
    /**
     * Calculate color harmony within the bundle
     */
    private double calculateColorHarmony(List<SearchCandidate> items) {
        if (items.size() < 2) {
            return 1.0;
        }
        
        List<String> colors = items.stream()
            .map(item -> item.getProduct().getColor().toLowerCase())
            .collect(Collectors.toList());
        
        // Define color harmony rules
        Map<String, List<String>> harmoniousColors = Map.of(
            "black", Arrays.asList("white", "gray", "red", "blue"),
            "white", Arrays.asList("black", "gray", "blue", "pink"),
            "blue", Arrays.asList("white", "black", "gray", "denim"),
            "red", Arrays.asList("black", "white", "navy"),
            "gray", Arrays.asList("black", "white", "blue"),
            "brown", Arrays.asList("beige", "cream", "tan", "white")
        );
        
        int harmoniousPairs = 0;
        int totalPairs = 0;
        
        for (int i = 0; i < colors.size(); i++) {
            for (int j = i + 1; j < colors.size(); j++) {
                totalPairs++;
                String color1 = colors.get(i);
                String color2 = colors.get(j);
                
                if (color1.equals(color2) || 
                    (harmoniousColors.containsKey(color1) && 
                     harmoniousColors.get(color1).contains(color2))) {
                    harmoniousPairs++;
                }
            }
        }
        
        return totalPairs > 0 ? (double) harmoniousPairs / totalPairs : 0.0;
    }
    
    /**
     * Calculate category diversity (optimal range: not too few, not too many)
     */
    private double calculateCategoryDiversity(List<SearchCandidate> items) {
        long uniqueCategories = items.stream()
            .map(item -> item.getProduct().getCategory())
            .distinct()
            .count();
        
        // Optimal diversity is 2-4 categories
        if (uniqueCategories >= 2 && uniqueCategories <= 4) {
            return 1.0;
        } else if (uniqueCategories == 1) {
            return 0.3; // Too few categories
        } else {
            return 0.7; // Too many categories
        }
    }
    
    /**
     * Calculate theme alignment
     */
    private double calculateThemeAlignment(List<SearchCandidate> items, String theme) {
        if ("mixed".equals(theme)) {
            return 0.5; // Neutral for mixed themes
        }
        
        // Define theme-specific attributes
        Map<String, List<String>> themeAttributes = Map.of(
            "casual", Arrays.asList("comfortable", "relaxed", "everyday"),
            "formal", Arrays.asList("elegant", "sophisticated", "professional"),
            "party", Arrays.asList("bold", "festive", "glamorous"),
            "work", Arrays.asList("professional", "polished", "business"),
            "summer", Arrays.asList("light", "bright", "breathable"),
            "winter", Arrays.asList("warm", "cozy", "layered")
        );
        
        List<String> themeKeywords = themeAttributes.getOrDefault(theme, List.of());
        if (themeKeywords.isEmpty()) {
            return 0.5;
        }
        
        int matchingItems = 0;
        for (SearchCandidate item : items) {
            String description = item.getProduct().getDescription().toLowerCase();
            String category = item.getProduct().getCategory().toLowerCase();
            
            boolean matchesTheme = themeKeywords.stream()
                .anyMatch(keyword -> description.contains(keyword) || category.contains(keyword));
            
            if (matchesTheme) {
                matchingItems++;
            }
        }
        
        return (double) matchingItems / items.size();
    }
    
    /**
     * Calculate price consistency within the bundle
     */
    private double calculatePriceConsistency(List<SearchCandidate> items) {
        if (items.size() < 2) {
            return 1.0;
        }
        
        List<Double> prices = items.stream()
            .map(item -> item.getProduct().getPrice())
            .collect(Collectors.toList());
        
        double avgPrice = prices.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double maxDeviation = prices.stream()
            .mapToDouble(price -> Math.abs(price - avgPrice))
            .max()
            .orElse(0.0);
        
        // More consistent prices = higher score
        return Math.max(0.0, 1.0 - (maxDeviation / avgPrice));
    }
    
    /**
     * Get theme-specific product combinations
     */
    private Map<String, List<String>> getThemeCombinations(String theme) {
        return switch (theme.toLowerCase()) {
            case "casual" -> Map.of(
                "Casual Day Look", Arrays.asList("clothing", "shoes"),
                "Weekend Outfit", Arrays.asList("clothing", "accessories"),
                "Relaxed Style", Arrays.asList("clothing", "shoes", "accessories")
            );
            case "formal" -> Map.of(
                "Business Formal", Arrays.asList("clothing", "shoes"),
                "Evening Formal", Arrays.asList("clothing", "accessories", "shoes"),
                "Professional Look", Arrays.asList("clothing", "accessories")
            );
            case "party" -> Map.of(
                "Party Night Out", Arrays.asList("clothing", "shoes", "accessories"),
                "Festive Look", Arrays.asList("clothing", "accessories"),
                "Celebration Outfit", Arrays.asList("clothing", "shoes")
            );
            case "work" -> Map.of(
                "Office Attire", Arrays.asList("clothing", "shoes"),
                "Business Casual", Arrays.asList("clothing", "accessories"),
                "Professional Style", Arrays.asList("clothing", "shoes", "accessories")
            );
            case "summer" -> Map.of(
                "Summer Day Look", Arrays.asList("clothing", "shoes"),
                "Beach Style", Arrays.asList("clothing", "accessories"),
                "Summer Evening", Arrays.asList("clothing", "shoes", "accessories")
            );
            case "winter" -> Map.of(
                "Winter Warmth", Arrays.asList("clothing", "accessories"),
                "Cozy Winter Look", Arrays.asList("clothing", "shoes", "accessories"),
                "Layered Style", Arrays.asList("clothing", "accessories")
            );
            default -> Map.of(
                "Mixed Style Look", Arrays.asList("clothing", "accessories"),
                "Complete Outfit", Arrays.asList("clothing", "shoes", "accessories")
            );
        };
    }
    
    /**
     * Generate bundle ID
     */
    private String generateBundleId(String theme, List<SearchCandidate> items) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String itemCount = String.valueOf(items.size());
        return String.format("bundle_%s_%s_%s", theme, itemCount, timestamp.substring(timestamp.length() - 6));
    }
    
    /**
     * Generate bundle description
     */
    private String generateBundleDescription(List<SearchCandidate> items, String theme) {
        StringBuilder description = new StringBuilder();
        description.append("A ").append(theme).append(" look featuring ");
        
        List<String> itemDescriptions = items.stream()
            .map(item -> item.getProduct().getName())
            .collect(Collectors.toList());
        
        if (itemDescriptions.size() == 1) {
            description.append(itemDescriptions.get(0));
        } else if (itemDescriptions.size() == 2) {
            description.append(itemDescriptions.get(0)).append(" and ").append(itemDescriptions.get(1));
        } else {
            description.append(String.join(", ", itemDescriptions.subList(0, itemDescriptions.size() - 1)));
            description.append(", and ").append(itemDescriptions.get(itemDescriptions.size() - 1));
        }
        
        description.append(". Perfect for ").append(theme).append(" occasions.");
        
        return description.toString();
    }
    
    /**
     * Determine price range category
     */
    private String determinePriceRange(double totalPrice) {
        if (totalPrice < 50) return "budget";
        if (totalPrice < 100) return "affordable";
        if (totalPrice < 200) return "moderate";
        if (totalPrice < 500) return "premium";
        return "luxury";
    }
}

