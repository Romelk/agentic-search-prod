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
import com.agenticsearch.responsepipeline.model.Product;
import com.agenticsearch.responsepipeline.model.SearchCandidate;
import com.agenticsearch.responsepipeline.model.TrendSignals;
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
                                                int maxBundles,
                                                TrendSignals trendSignals) {
        logger.info("Creating bundles from {} candidates with themes: {}", 
            searchCandidates.size(), styleThemes);
        
        return Mono.fromCallable(() -> {
            if (searchCandidates == null || searchCandidates.isEmpty()) {
                logger.warn("No search candidates provided for bundle creation");
                return new ArrayList<LookBundle>();
            }
            
            List<SearchCandidate> preparedCandidates = prepareCandidatePool(searchCandidates, trendSignals, maxBundles);

            // Group candidates by category for better bundle creation
            Map<String, List<SearchCandidate>> candidatesByCategory =
                preparedCandidates.stream()
                    .collect(Collectors.groupingBy(
                        candidate -> candidate.getProduct().getCategory()
                    ));

            Set<String> usedSkus = new HashSet<>();
            List<LookBundle> bundles = new ArrayList<>();

            List<String> effectiveThemes = styleThemes != null && !styleThemes.isEmpty()
                ? styleThemes
                : deriveThemesFromSignals(trendSignals);
            logger.debug("Effective themes for bundling: {}", effectiveThemes);

            int perThemeLimit = Math.max(1, maxBundles / Math.max(1, effectiveThemes.size()));

            // Create bundles for each style theme
            for (String theme : effectiveThemes) {
                List<LookBundle> themeBundles = createBundlesForTheme(
                    candidatesByCategory,
                    theme,
                    Math.min(perThemeLimit, Math.max(1, maxBundles - bundles.size())),
                    trendSignals,
                    usedSkus
                );
                bundles.addAll(themeBundles);
                if (bundles.size() >= maxBundles) {
                    break;
                }
            }
            
            // If we have remaining capacity, create general bundles
            if (bundles.size() < maxBundles) {
                List<LookBundle> generalBundles = createGeneralBundles(
                    candidatesByCategory,
                    maxBundles - bundles.size(),
                    trendSignals,
                    usedSkus
                );
                bundles.addAll(generalBundles);
            }
            
            // Sort by coherence score
            bundles.sort((a, b) -> Double.compare(b.getCoherenceScore(), a.getCoherenceScore()));
            
            logger.info("Created {} look bundles", bundles.size());
            return bundles;
        });
    }

    private List<SearchCandidate> prepareCandidatePool(List<SearchCandidate> searchCandidates,
                                                       TrendSignals trendSignals,
                                                       int maxBundles) {
        // Deduplicate by SKU and pre-score by contextual relevance
        Map<String, SearchCandidate> bestBySku = new LinkedHashMap<>();
        for (SearchCandidate candidate : searchCandidates) {
            if (candidate == null || candidate.getProduct() == null) {
                continue;
            }
            String sku = candidate.getProduct().getSku();
            if (sku == null) {
                continue;
            }
            SearchCandidate existing = bestBySku.get(sku);
            if (existing == null || candidate.getSimilarityScore() > existing.getSimilarityScore()) {
                bestBySku.put(sku, candidate);
            }
        }

        Map<String, List<SearchCandidate>> byCategory = new HashMap<>();
        for (SearchCandidate candidate : bestBySku.values()) {
            String category = Optional.ofNullable(candidate.getProduct().getCategory()).orElse("unknown");
            byCategory.computeIfAbsent(category, key -> new ArrayList<>()).add(candidate);
        }

        int perCategoryLimit = Math.max(3, maxBundles * 2);
        double confidence = trendSignals != null ? Math.max(0.0, Math.min(1.0, trendSignals.getTrendConfidence())) : 0.0;

        List<SearchCandidate> limitedCandidates = new ArrayList<>();
        for (Map.Entry<String, List<SearchCandidate>> entry : byCategory.entrySet()) {
            List<SearchCandidate> scored = entry.getValue().stream()
                .sorted((a, b) -> Double.compare(
                    computeContextAwareScore(b, trendSignals, confidence),
                    computeContextAwareScore(a, trendSignals, confidence)))
                .limit(perCategoryLimit)
                .collect(Collectors.toList());
            limitedCandidates.addAll(scored);
        }

        // If we still have an excessive pool, cap to avoid combinatorial explosion
        int overallCap = Math.max(12, maxBundles * 6);
        if (limitedCandidates.size() > overallCap) {
            limitedCandidates = limitedCandidates.stream()
                .sorted((a, b) -> Double.compare(
                    computeContextAwareScore(b, trendSignals, confidence),
                    computeContextAwareScore(a, trendSignals, confidence)))
                .limit(overallCap)
                .collect(Collectors.toList());
        }

        logger.debug("Prepared {} candidates (from {} raw) after contextual filtering",
            limitedCandidates.size(), searchCandidates.size());
        return limitedCandidates;
    }

    private double computeContextAwareScore(SearchCandidate candidate,
                                            TrendSignals trendSignals,
                                            double confidence) {
        double score = candidate.getSimilarityScore();
        List<String> attributes = candidate.getMatchingAttributes();
        if (attributes != null) {
            if (attributes.stream().anyMatch(attr -> attr.startsWith("filter:"))) {
                score += 0.03;
            }
            if (attributes.stream().anyMatch(attr -> attr.startsWith("theme:"))) {
                score += 0.02;
            }
        }

        if (trendSignals == null || candidate.getProduct() == null) {
            return score;
        }

        Product product = candidate.getProduct();
        Set<String> trendingStyles = trendSignals.getTrendingStylesLower();
        if (product.getStyleTags() != null && !trendingStyles.isEmpty()) {
            long matches = product.getStyleTags().stream()
                .filter(Objects::nonNull)
                .map(tag -> tag.toLowerCase(Locale.ROOT))
                .filter(trendingStyles::contains)
                .count();
            if (matches > 0) {
                score += matches * 0.04 * confidence;
            }
        }

        if (trendSignals.getSeason() != null && product.getSeason() != null
            && product.getSeason().equalsIgnoreCase(trendSignals.getSeason())) {
            score += 0.05 * confidence;
        }

        Set<String> recommendedOccasions = trendSignals.getSeasonalRecommendationsLower();
        if (product.getOccasion() != null && recommendedOccasions.contains(product.getOccasion().toLowerCase(Locale.ROOT))) {
            score += 0.04 * confidence;
        }

        return score;
    }
    
    /**
     * Create bundles for a specific style theme
     */
    private List<LookBundle> createBundlesForTheme(Map<String, List<SearchCandidate>> candidatesByCategory,
                                                   String theme,
                                                   int maxBundles,
                                                   TrendSignals trendSignals,
                                                   Set<String> usedSkus) {
        List<LookBundle> bundles = new ArrayList<>();
        
        // Define theme-specific product combinations
        Map<String, List<String>> themeCombinations = getThemeCombinations(theme);
        
        for (Map.Entry<String, List<String>> combination : themeCombinations.entrySet()) {
            if (bundles.size() >= maxBundles) break;
            
            String combinationName = combination.getKey();
            List<String> requiredCategories = combination.getValue();
            
            LookBundle bundle = createBundleForCombination(
                candidatesByCategory,
                requiredCategories,
                theme,
                combinationName,
                trendSignals,
                usedSkus
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
                                                 int maxBundles,
                                                 TrendSignals trendSignals,
                                                 Set<String> usedSkus) {
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
                candidatesByCategory,
                combination,
                "mixed",
                "Mixed Style Look",
                trendSignals,
                usedSkus
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
                                                  String theme,
                                                  String bundleName,
                                                  TrendSignals trendSignals,
                                                  Set<String> usedSkus) {
        List<SearchCandidate> bundleItems = new ArrayList<>();
        
        // Select best candidate from each required category
        for (String category : requiredCategories) {
            List<SearchCandidate> categoryCandidates = candidatesByCategory.get(category);
            if (categoryCandidates != null && !categoryCandidates.isEmpty()) {
                SearchCandidate bestCandidate = selectBestCandidate(categoryCandidates, usedSkus, trendSignals, theme);
                
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
        if (trendSignals != null) {
            coherenceScore = Math.min(1.0, coherenceScore + trendSignals.getTrendConfidence() * 0.05);
        }
        
        // Create bundle
        String bundleId = generateBundleId(theme, bundleItems);
        String description = generateBundleDescription(bundleItems, theme);
        
        LookBundle bundle = new LookBundle(bundleId, bundleName, bundleItems, 
                                         coherenceScore, theme, description);
        
        // Calculate additional metrics
        bundle.setStyleCoherence(calculateStyleCoherence(bundleItems));
        bundle.setColorHarmony(calculateColorHarmony(bundleItems));
        bundle.setPriceRange(determinePriceRange(bundle.getTotalPrice()));

        // Mark SKUs as used to avoid duplication across bundles
        bundleItems.stream()
            .map(item -> item.getProduct().getSku())
            .filter(Objects::nonNull)
            .forEach(usedSkus::add);
        
        return bundle;
    }
    
    private List<String> deriveThemesFromSignals(TrendSignals trendSignals) {
        if (trendSignals == null) {
            return List.of("casual", "formal", "mixed");
        }

        Set<String> themes = new LinkedHashSet<>();
        Set<String> trendingStyles = trendSignals.getTrendingStylesLower();
        Set<String> seasonalRecommendations = trendSignals.getSeasonalRecommendationsLower();

        for (String style : trendingStyles) {
            String mapped = mapStyleToTheme(style);
            if (mapped != null) {
                themes.add(mapped);
            }
        }

        for (String recommendation : seasonalRecommendations) {
            if (recommendation.contains("wedding")) {
                themes.add("formal");
            } else if (recommendation.contains("party") || recommendation.contains("evening")) {
                themes.add("party");
            } else if (recommendation.contains("work") || recommendation.contains("office")) {
                themes.add("work");
            }
        }

        if (trendSignals.getSeason() != null && !trendSignals.getSeason().isBlank()) {
            themes.add(trendSignals.getSeason().toLowerCase(Locale.ROOT));
        }

        if (themes.isEmpty()) {
            themes.add("casual");
            themes.add("formal");
        }

        themes.add("mixed");
        return themes.stream().limit(4).toList();
    }

    private String mapStyleToTheme(String style) {
        String normalized = style.toLowerCase(Locale.ROOT);
        if (normalized.contains("formal") || normalized.contains("wedding") || normalized.contains("evening")) {
            return "formal";
        }
        if (normalized.contains("office") || normalized.contains("work") || normalized.contains("business")) {
            return "work";
        }
        if (normalized.contains("party") || normalized.contains("festive")) {
            return "party";
        }
        if (normalized.contains("casual") || normalized.contains("relaxed") || normalized.contains("weekend")) {
            return "casual";
        }
        if (normalized.contains("summer") || normalized.contains("beach")) {
            return "summer";
        }
        if (normalized.contains("winter") || normalized.contains("cozy")) {
            return "winter";
        }
        return null;
    }

    private SearchCandidate selectBestCandidate(List<SearchCandidate> candidates,
                                                Set<String> usedSkus,
                                                TrendSignals trendSignals,
                                                String theme) {
        SearchCandidate bestCandidate = null;
        double bestScore = Double.NEGATIVE_INFINITY;

        for (SearchCandidate candidate : candidates) {
            if (candidate == null || candidate.getProduct() == null) {
                continue;
            }
            String sku = candidate.getProduct().getSku();
            if (sku != null && usedSkus.contains(sku)) {
                continue;
            }
            double score = scoreCandidateForTheme(candidate, theme, trendSignals);
            if (score > bestScore) {
                bestScore = score;
                bestCandidate = candidate;
            }
        }

        if (bestCandidate != null) {
            augmentCandidateWithTrend(bestCandidate, theme, trendSignals);
        }

        return bestCandidate;
    }

    private double scoreCandidateForTheme(SearchCandidate candidate,
                                          String theme,
                                          TrendSignals trendSignals) {
        double score = candidate.getSimilarityScore();
        if (candidate.getProduct() == null) {
            return score;
        }

        Product product = candidate.getProduct();
        String normalizedTheme = theme != null ? theme.toLowerCase(Locale.ROOT) : "";

        if (!normalizedTheme.isBlank()) {
            String description = product.getDescription() != null
                ? product.getDescription().toLowerCase(Locale.ROOT)
                : "";
            String category = product.getCategory() != null
                ? product.getCategory().toLowerCase(Locale.ROOT)
                : "";
            String occasion = product.getOccasion() != null
                ? product.getOccasion().toLowerCase(Locale.ROOT)
                : "";

            if (description.contains(normalizedTheme) || category.contains(normalizedTheme) || occasion.contains(normalizedTheme)) {
                score += 0.05;
            }
        }

        if (trendSignals != null) {
            Set<String> trendingStyles = trendSignals.getTrendingStylesLower();
            Set<String> seasonalRecommendations = trendSignals.getSeasonalRecommendationsLower();

            if (product.getStyleTags() != null) {
                long matches = product.getStyleTags().stream()
                    .filter(Objects::nonNull)
                    .map(tag -> tag.toLowerCase(Locale.ROOT))
                    .filter(trendingStyles::contains)
                    .count();
                score += matches * 0.03;
            }

            if (trendSignals.getSeason() != null
                && product.getSeason() != null
                && product.getSeason().equalsIgnoreCase(trendSignals.getSeason())) {
                score += 0.02;
            }

            if (product.getOccasion() != null
                && seasonalRecommendations.contains(product.getOccasion().toLowerCase(Locale.ROOT))) {
                score += 0.025;
            }
        }

        return score;
    }

    private void augmentCandidateWithTrend(SearchCandidate candidate,
                                           String theme,
                                           TrendSignals trendSignals) {
        List<String> attributes = candidate.getMatchingAttributes() != null
            ? new ArrayList<>(candidate.getMatchingAttributes())
            : new ArrayList<>();
        boolean updated = false;

        if (theme != null && !theme.isBlank()) {
            attributes.add("theme:" + theme.toLowerCase(Locale.ROOT));
            updated = true;
        }

        if (trendSignals != null) {
            if (trendSignals.getSeason() != null) {
                attributes.add("trend-season");
                updated = true;
            }
            if (!trendSignals.getTrendingStyles().isEmpty()) {
                attributes.add("trend-style");
                updated = true;
            }
        }

        if (updated) {
            candidate.setMatchingAttributes(attributes.stream().distinct().toList());
            String existingReason = candidate.getMatchReason() != null ? candidate.getMatchReason() : "";
            if (!existingReason.toLowerCase(Locale.ROOT).contains("trend")) {
                candidate.setMatchReason(existingReason.isBlank()
                    ? "Aligned with current trend signals"
                    : existingReason + " · Trend aligned");
            }
        }
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

