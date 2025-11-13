/**
 * Kiko Curator Service - Vector Search with Vertex AI Matching Engine
 * 
 * Responsibilities:
 * - Semantic vector search against Vertex AI Matching Engine
 * - Query embedding generation
 * - Result ranking and filtering
 * - Cost tracking and optimization
 */

package com.agenticsearch.vectorsearch.service;

import com.agenticsearch.vectorsearch.config.CostGuard;
import com.agenticsearch.vectorsearch.config.VertexAIConfig;
import com.agenticsearch.vectorsearch.model.Product;
import com.agenticsearch.vectorsearch.model.SearchCandidate;
import com.agenticsearch.vectorsearch.model.TrendSignals;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.google.cloud.aiplatform.v1.FindNeighborsRequest;
import com.google.cloud.aiplatform.v1.FindNeighborsResponse;
import com.google.cloud.aiplatform.v1.FindNeighborsResponse.NearestNeighbors;
import com.google.cloud.aiplatform.v1.FindNeighborsResponse.Neighbor;
import com.google.cloud.aiplatform.v1.IndexDatapoint;
import com.google.cloud.aiplatform.v1.MatchServiceClient;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class KikoCuratorService {
    
    private static final Logger logger = LoggerFactory.getLogger(KikoCuratorService.class);
    private static final double TREND_STYLE_WEIGHT = 0.05;
    private static final double TREND_SEASON_WEIGHT = 0.04;
    private static final double TREND_OCCASION_WEIGHT = 0.03;
    
    private final MatchServiceClient matchServiceClient;
    private final VertexAIConfig vertexAIConfig;
    private final CostGuard costGuard;
    private final CircuitBreaker circuitBreaker;
    private final VertexAIEmbeddingsClient embeddingsClient;
    private final Cache<String, List<Float>> embeddingCache;
    private final Cache<String, List<SearchCandidate>> resultCache;
    private final long maxResultsCap;
    private final boolean trendWeightingEnabled;
    
    @Autowired
    public KikoCuratorService(MatchServiceClient matchServiceClient,
                             VertexAIConfig vertexAIConfig,
                             CostGuard costGuard,
                             CircuitBreaker circuitBreaker,
                             VertexAIEmbeddingsClient embeddingsClient,
                             @Value("${vector-search.cache.embedding-ttl-seconds:900}") long embeddingCacheTtlSeconds,
                             @Value("${vector-search.cache.embedding-max-size:500}") long embeddingCacheMaxSize,
                             @Value("${vector-search.cache.results-ttl-seconds:180}") long resultCacheTtlSeconds,
                             @Value("${vector-search.cache.results-max-size:200}") long resultCacheMaxSize,
                             @Value("${vector-search.max-results-cap:50}") long maxResultsCap,
                             @Value("${vector-search.trend-weighting.enabled:true}") boolean trendWeightingEnabled) {
        this.matchServiceClient = matchServiceClient;
        this.vertexAIConfig = vertexAIConfig;
        this.costGuard = costGuard;
        this.circuitBreaker = circuitBreaker;
        this.embeddingsClient = embeddingsClient;
        this.embeddingCache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(Math.max(60, embeddingCacheTtlSeconds)))
            .maximumSize(Math.max(50, embeddingCacheMaxSize))
            .build();
        this.resultCache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(Math.max(30, resultCacheTtlSeconds)))
            .maximumSize(Math.max(25, resultCacheMaxSize))
            .build();
        this.maxResultsCap = maxResultsCap;
        this.trendWeightingEnabled = trendWeightingEnabled;
    }
    
    /**
     * Perform semantic vector search
     * @param query The search query
     * @param maxResults Maximum number of results to return
     * @param filters Optional filters to apply
     * @return Mono<List<SearchCandidate>> - List of search candidates
     */
    public Mono<List<SearchCandidate>> searchSemantic(String query, 
                                                     int maxResults, 
                                                     Map<String, String> filters,
                                                     TrendSignals trendSignals) {
        int cappedResults = (int) Math.min(maxResults, maxResultsCap);
        logger.info("Starting semantic search for query: '{}' with max results: {}", query, cappedResults);
        
        // Estimate cost
        double estimatedCost = costGuard.estimateQueryCost(1);
        String cacheKey = buildResultCacheKey(query, cappedResults, filters, trendSignals);
        
        List<SearchCandidate> cached = resultCache.getIfPresent(cacheKey);
        if (cached != null) {
            logger.debug("Returning cached vector search results for '{}'", query);
            return Mono.just(cloneCandidates(cached));
        }
        
        return costGuard.canProceed(estimatedCost)
            .flatMap(canProceed -> {
                if (!canProceed) {
                    logger.warn("Search blocked by cost controls");
                    return Mono.error(new RuntimeException("Search blocked by cost controls"));
                }
                
                return performVectorSearch(query, cappedResults, filters, trendSignals)
                    .doOnSuccess(candidates -> {
                        logger.info("Search completed successfully. Found {} candidates", candidates.size());
                        // Record cost
                        costGuard.recordCost(estimatedCost).subscribe();
                        resultCache.put(cacheKey, Collections.unmodifiableList(cloneCandidates(candidates)));
                    })
                    .doOnError(error -> {
                        logger.error("Search failed: {}", error.getMessage());
                        // Still record cost for failed requests
                        costGuard.recordCost(estimatedCost).subscribe();
                    });
            })
            .subscribeOn(Schedulers.boundedElastic());
    }
    
    /**
     * Perform the actual vector search using Vertex AI Matching Engine
     */
    private Mono<List<SearchCandidate>> performVectorSearch(String query,
                                                           int maxResults, 
                                                           Map<String, String> filters,
                                                           TrendSignals trendSignals) {
        return Mono.fromCallable(() -> {
            try {
                FindNeighborsRequest request = buildFindNeighborsRequest(
                    query,
                    maxResults,
                    filters,
                    trendSignals
                );
                
                // Execute search with circuit breaker protection
                return circuitBreaker.executeSupplier(() -> {
                    try {
                        FindNeighborsResponse response = matchServiceClient.findNeighbors(request);
                        return processSearchResponse(response, filters, trendSignals, query);
                    } catch (Exception e) {
                        logger.error("Vertex AI Matching Engine call failed: {}", e.getMessage());
                        throw new RuntimeException("Vector search failed", e);
                    }
                });
                
            } catch (Exception e) {
                logger.error("Vector search execution failed: {}", e.getMessage());
                throw new RuntimeException("Vector search failed", e);
            }
        });
    }
    
    /**
     * Build the request payload for the Matching Engine findNeighbors API
     */
    private FindNeighborsRequest buildFindNeighborsRequest(String query,
                                                           int maxResults,
                                                           Map<String, String> filters,
                                                           TrendSignals trendSignals) {
        IndexDatapoint datapoint = createQueryDatapoint(query, filters, trendSignals);

        FindNeighborsRequest.Query queryPayload = FindNeighborsRequest.Query.newBuilder()
            .setDatapoint(datapoint)
            .setNeighborCount(Math.max(1, maxResults))
            .build();

        return FindNeighborsRequest.newBuilder()
            .setIndexEndpoint(vertexAIConfig.getEndpointResourceName())
            .setDeployedIndexId(vertexAIConfig.getDeployedIndexId())
            .addQueries(queryPayload)
            .setReturnFullDatapoint(true)
            .build();
    }

    /**
     * Create a datapoint embedding from the text query
     */
    private IndexDatapoint createQueryDatapoint(String query,
                                                Map<String, String> filters,
                                                TrendSignals trendSignals) {
        logger.debug("Creating embedding vector for query: '{}'", query);
        List<Float> embedding = getQueryEmbedding(query, filters, trendSignals);
        return IndexDatapoint.newBuilder()
            .setDatapointId(Integer.toHexString(Objects.hash(query, embedding.size())))
            .addAllFeatureVector(embedding)
            .build();
    }
    
    private List<Float> getQueryEmbedding(String query,
                                          Map<String, String> filters,
                                          TrendSignals trendSignals) {
        String augmentedQuery = buildAugmentedQuery(query, filters, trendSignals);
        String normalized = augmentedQuery.trim().toLowerCase(Locale.ROOT);
        List<Float> cached = embeddingCache.getIfPresent(normalized);
        if (cached != null) {
            return cached;
        }
        
        try {
            List<Float> vector = embeddingsClient.embedText(augmentedQuery);
            List<Float> immutableVector = List.copyOf(vector);
            embeddingCache.put(normalized, immutableVector);
            return immutableVector;
        } catch (Exception ex) {
            logger.warn("Embedding generation via Vertex AI failed, using deterministic fallback: {}", ex.getMessage());
            List<Float> fallback = generateMockVector(normalized);
            List<Float> immutableFallback = List.copyOf(fallback);
            embeddingCache.put(normalized, immutableFallback);
            return immutableFallback;
        }
    }
    
    /**
     * Process the search response from Vertex AI Matching Engine
     */
    private List<SearchCandidate> processSearchResponse(FindNeighborsResponse response,
                                                       Map<String, String> filters,
                                                       TrendSignals trendSignals,
                                                       String query) {
        List<SearchCandidate> candidates = new ArrayList<>();
        
        if (response.getNearestNeighborsCount() == 0) {
            logger.warn("No search results returned from Vertex AI Matching Engine");
            return candidates;
        }
        
        NearestNeighbors nearestNeighbors = response.getNearestNeighbors(0); // First query

        for (Neighbor neighbor : nearestNeighbors.getNeighborsList()) {
            try {
                if (!neighbor.hasDatapoint()) {
                    logger.debug("Skipping neighbor without datapoint payload");
                    continue;
                }
                // Extract product data from the datapoint
                Product product = extractProductFromDatapoint(neighbor.getDatapoint());
                
                if (product != null && passesFilters(product, filters)) {
                    double baseSimilarity = 1.0 - Math.min(1.0, neighbor.getDistance());
                    List<String> matchingAttributes = extractMatchingAttributes(query, product, filters);
                    SearchCandidate candidate = new SearchCandidate(
                        product,
                        baseSimilarity,
                        matchingAttributes,
                        generateMatchReason(product, baseSimilarity)
                    );
                    candidates.add(candidate);
                }
                
            } catch (Exception e) {
                logger.warn("Failed to process search result: {}", e.getMessage());
            }
        }
        
        applyTrendWeighting(candidates, trendSignals);
        
        logger.info("Processed {} search candidates", candidates.size());
        return candidates;
    }
    
    /**
     * Extract product data from Vertex AI datapoint
     * In a real implementation, this would deserialize from the stored metadata
     */
    private Product extractProductFromDatapoint(IndexDatapoint datapoint) {
        String datapointId = datapoint.getDatapointId();
        logger.debug("Extracting product from datapoint: {}", datapointId);

        Map<String, String> metadata = new HashMap<>();
        List<String> styleTags = new ArrayList<>();

        datapoint.getRestrictsList().forEach(restriction -> {
            String namespace = restriction.getNamespace().toLowerCase(Locale.ROOT);
            if (restriction.getAllowListCount() > 0) {
                // Capture first allow-list entry as metadata value
                String value = restriction.getAllowList(0);
                metadata.put(namespace, value);

                if (namespace.contains("style") || namespace.contains("tag")) {
                    styleTags.addAll(restriction.getAllowListList());
                }
            }
        });

        datapoint.getNumericRestrictsList().forEach(restriction -> {
            String namespace = restriction.getNamespace().toLowerCase(Locale.ROOT);
            double numericValue = restriction.hasValueDouble()
                ? restriction.getValueDouble()
                : restriction.hasValueFloat()
                    ? restriction.getValueFloat()
                    : restriction.hasValueInt()
                        ? restriction.getValueInt()
                        : Double.NaN;
            if (!Double.isNaN(numericValue)) {
                metadata.put(namespace, Double.toString(numericValue));
            }
        });

        Product product = new Product();
        product.setSku(metadata.getOrDefault("sku", datapointId));
        product.setName(metadata.getOrDefault("name", "Vector Result " + datapointId));
        product.setDescription(metadata.getOrDefault("description", "Result generated from semantic similarity search"));
        product.setPrice(parseDoubleSafe(metadata.get("price"), 0.0));
        product.setCurrency(metadata.getOrDefault("currency", "USD"));
        product.setCategory(metadata.getOrDefault("category", ""));
        product.setSubcategory(metadata.getOrDefault("subcategory", ""));
        product.setBrand(metadata.getOrDefault("brand", ""));
        product.setColor(metadata.getOrDefault("color", ""));
        product.setSize(metadata.getOrDefault("size", ""));
        product.setMaterial(metadata.getOrDefault("material", ""));
        product.setSeason(metadata.getOrDefault("season", ""));
        product.setGender(metadata.getOrDefault("gender", ""));
        product.setOccasion(metadata.getOrDefault("occasion", ""));
        product.setImageUrl(metadata.getOrDefault("image_url", metadata.getOrDefault("imageurl", "")));
        product.setStockStatus(metadata.getOrDefault("stock_status", "in_stock"));
        product.setRating(parseDoubleSafe(metadata.get("rating"), 0.0));
        product.setPopularityScore(parseDoubleSafe(metadata.get("popularity_score"), 0.0));
        product.setStyleTags(!styleTags.isEmpty() ? new ArrayList<>(styleTags) : new ArrayList<>());

        return product;
    }
    
    private double parseDoubleSafe(String value, double defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
    
    /**
     * Check if product passes the given filters
     */
    private boolean passesFilters(Product product, Map<String, String> filters) {
        if (filters == null || filters.isEmpty()) {
            return true;
        }
        
        for (Map.Entry<String, String> filter : filters.entrySet()) {
            String key = filter.getKey().toLowerCase();
            String value = filter.getValue().toLowerCase();
            
            switch (key) {
                case "category":
                    if (!product.getCategory().toLowerCase().contains(value)) {
                        return false;
                    }
                    break;
                case "brand":
                    if (!product.getBrand().toLowerCase().contains(value)) {
                        return false;
                    }
                    break;
                case "color":
                    if (!product.getColor().toLowerCase().contains(value)) {
                        return false;
                    }
                    break;
                case "occasion":
                    if (product.getOccasion() == null || !product.getOccasion().toLowerCase().contains(value)) {
                        return false;
                    }
                    break;
                case "size":
                    if (!product.getSize().toLowerCase().contains(value)) {
                        return false;
                    }
                    break;
                case "max_price":
                    try {
                        double maxPrice = Double.parseDouble(value);
                        if (product.getPrice() > maxPrice) {
                            return false;
                        }
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid max_price filter: {}", value);
                    }
                    break;
                case "min_price":
                    try {
                        double minPrice = Double.parseDouble(value);
                        if (product.getPrice() < minPrice) {
                            return false;
                        }
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid min_price filter: {}", value);
                    }
                    break;
            }
        }
        
        return true;
    }
    
    private List<String> extractMatchingAttributes(String query, Product product, Map<String, String> filters) {
        List<String> attributes = new ArrayList<>();
        if (product == null) {
            return attributes;
        }
        
        String normalizedQuery = query != null ? query.toLowerCase(Locale.ROOT) : "";
        
        if (product.getColor() != null && normalizedQuery.contains(product.getColor().toLowerCase(Locale.ROOT))) {
            attributes.add("color");
        }
        if (product.getCategory() != null && normalizedQuery.contains(product.getCategory().toLowerCase(Locale.ROOT))) {
            attributes.add("category");
        }
        if (product.getBrand() != null && normalizedQuery.contains(product.getBrand().toLowerCase(Locale.ROOT))) {
            attributes.add("brand");
        }
        if (product.getOccasion() != null && normalizedQuery.contains(product.getOccasion().toLowerCase(Locale.ROOT))) {
            attributes.add("occasion");
        }
        
        if (filters != null) {
            filters.forEach((key, value) -> {
                if (value == null) {
                    return;
                }
                String normalizedValue = value.toLowerCase(Locale.ROOT);
                switch (key.toLowerCase(Locale.ROOT)) {
                    case "category":
                        if (product.getCategory() != null && product.getCategory().toLowerCase(Locale.ROOT).contains(normalizedValue)) {
                            attributes.add("filter:category");
                        }
                        break;
                    case "brand":
                        if (product.getBrand() != null && product.getBrand().toLowerCase(Locale.ROOT).contains(normalizedValue)) {
                            attributes.add("filter:brand");
                        }
                        break;
                    case "color":
                        if (product.getColor() != null && product.getColor().toLowerCase(Locale.ROOT).contains(normalizedValue)) {
                            attributes.add("filter:color");
                        }
                        break;
                    case "occasion":
                        if (product.getOccasion() != null && product.getOccasion().toLowerCase(Locale.ROOT).contains(normalizedValue)) {
                            attributes.add("filter:occasion");
                        }
                        break;
                    default:
                        break;
                }
            });
        }
        
        return attributes.stream().distinct().collect(Collectors.toList());
    }
    
    /**
     * Generate a match reason for the search candidate
     */
    private String generateMatchReason(Product product, double similarity) {
        double boundedSimilarity = Math.max(0, Math.min(1, similarity));
        
        if (boundedSimilarity > 0.9) {
            return "Excellent match based on semantic similarity";
        } else if (boundedSimilarity > 0.7) {
            return "Good match based on semantic similarity";
        } else if (boundedSimilarity > 0.5) {
            return "Reasonable match based on semantic similarity";
        } else {
            return "Related product based on semantic similarity";
        }
    }
    
    /**
     * Get service health status
     */
    public Mono<Boolean> isHealthy() {
        return Mono.fromCallable(() -> {
            try {
                // Build a lightweight request to validate configuration (without executing it)
                IndexDatapoint datapoint = IndexDatapoint.newBuilder()
                    .setDatapointId("health-check")
                    .addFeatureVector(0.0f)
                    .build();

                FindNeighborsRequest.newBuilder()
                    .setIndexEndpoint(vertexAIConfig.getEndpointResourceName())
                    .setDeployedIndexId(vertexAIConfig.getDeployedIndexId())
                    .addQueries(
                        FindNeighborsRequest.Query.newBuilder()
                            .setDatapoint(datapoint)
                            .setNeighborCount(1)
                            .build()
                    )
                    .setReturnFullDatapoint(false)
                    .build();
                
                return circuitBreaker.getState() == CircuitBreaker.State.CLOSED;
            } catch (Exception e) {
                logger.warn("Health check failed: {}", e.getMessage());
                return false;
            }
        });
    }
    
    private String buildResultCacheKey(String query, int maxResults, Map<String, String> filters, TrendSignals trendSignals) {
        StringBuilder builder = new StringBuilder(query == null ? "" : query.trim().toLowerCase(Locale.ROOT));
        builder.append("|").append(maxResults);
        if (filters != null && !filters.isEmpty()) {
            String filtersFingerprint = filters.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> entry.getKey().toLowerCase(Locale.ROOT) + "=" + entry.getValue().toLowerCase(Locale.ROOT))
                .collect(Collectors.joining("&"));
            builder.append("|filters=").append(filtersFingerprint);
        }
        if (trendSignals != null) {
            builder.append("|trend=").append(trendSignals.cacheFingerprint());
        }
        return builder.toString();
    }
    
    private List<SearchCandidate> cloneCandidates(List<SearchCandidate> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }
        return candidates.stream()
            .map(this::cloneCandidate)
            .collect(Collectors.toList());
    }
    
    private SearchCandidate cloneCandidate(SearchCandidate candidate) {
        Product productClone = candidate.getProduct() != null ? cloneProduct(candidate.getProduct()) : null;
        List<String> attributesClone = candidate.getMatchingAttributes() != null
            ? new ArrayList<>(candidate.getMatchingAttributes())
            : new ArrayList<>();
        return new SearchCandidate(
            productClone,
            candidate.getSimilarityScore(),
            attributesClone,
            candidate.getMatchReason()
        );
    }
    
    private Product cloneProduct(Product product) {
        Product clone = new Product();
        clone.setSku(product.getSku());
        clone.setName(product.getName());
        clone.setDescription(product.getDescription());
        clone.setPrice(product.getPrice());
        clone.setCurrency(product.getCurrency());
        clone.setCategory(product.getCategory());
        clone.setSubcategory(product.getSubcategory());
        clone.setBrand(product.getBrand());
        clone.setColor(product.getColor());
        clone.setSize(product.getSize());
        clone.setMaterial(product.getMaterial());
        clone.setStyleTags(product.getStyleTags() != null ? new ArrayList<>(product.getStyleTags()) : null);
        clone.setSeason(product.getSeason());
        clone.setGender(product.getGender());
        clone.setOccasion(product.getOccasion());
        clone.setImageUrl(product.getImageUrl());
        clone.setStockStatus(product.getStockStatus());
        clone.setRating(product.getRating());
        clone.setPopularityScore(product.getPopularityScore());
        return clone;
    }
    
    private void applyTrendWeighting(List<SearchCandidate> candidates, TrendSignals trendSignals) {
        if (!trendWeightingEnabled || trendSignals == null || candidates.isEmpty()) {
            candidates.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));
            return;
        }
        
        double confidence = Math.max(0.0, Math.min(1.0, trendSignals.getTrendConfidence()));
        if (confidence <= 0.0) {
            candidates.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));
            return;
        }
        
        Set<String> trendingStyles = trendSignals.getTrendingStylesLower();
        Set<String> seasonalRecommendations = trendSignals.getSeasonalRecommendationsLower();
        String normalizedSeason = trendSignals.getSeason() != null
            ? trendSignals.getSeason().toLowerCase(Locale.ROOT)
            : "";
        
        for (SearchCandidate candidate : candidates) {
            Product product = candidate.getProduct();
            if (product == null) {
                continue;
            }
            
            double boost = 0.0;
            List<String> attributes = candidate.getMatchingAttributes() != null
                ? new ArrayList<>(candidate.getMatchingAttributes())
                : new ArrayList<>();
            
            List<String> styleTags = product.getStyleTags();
            if (styleTags != null && !styleTags.isEmpty() && !trendingStyles.isEmpty()) {
                long matches = styleTags.stream()
                    .map(tag -> tag.toLowerCase(Locale.ROOT))
                    .filter(trendingStyles::contains)
                    .count();
                if (matches > 0) {
                    boost += matches * TREND_STYLE_WEIGHT;
                    attributes.add("trend-style");
                }
            }
            
            if (!normalizedSeason.isBlank() && product.getSeason() != null
                && product.getSeason().toLowerCase(Locale.ROOT).equals(normalizedSeason)) {
                boost += TREND_SEASON_WEIGHT;
                attributes.add("trend-season");
            }
            
            if (!seasonalRecommendations.isEmpty() && product.getOccasion() != null
                && seasonalRecommendations.contains(product.getOccasion().toLowerCase(Locale.ROOT))) {
                boost += TREND_OCCASION_WEIGHT;
                attributes.add("trend-occasion");
            }
            
            if (boost > 0.0) {
                double adjustedScore = Math.min(1.0, candidate.getSimilarityScore() + (boost * confidence));
                candidate.setSimilarityScore(adjustedScore);
                candidate.setMatchingAttributes(attributes.stream().distinct().collect(Collectors.toList()));
                candidate.setMatchReason(enrichMatchReason(candidate.getMatchReason(),
                    "Boosted by current trend signals"));
            }
        }
        
        candidates.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));
    }
    
    private String enrichMatchReason(String original, String addition) {
        if (addition == null || addition.isBlank()) {
            return original;
        }
        if (original == null || original.isBlank()) {
            return addition;
        }
        if (original.toLowerCase(Locale.ROOT).contains(addition.toLowerCase(Locale.ROOT))) {
            return original;
        }
        return original + " · " + addition;
    }
    
    private String buildAugmentedQuery(String query,
                                       Map<String, String> filters,
                                       TrendSignals trendSignals) {
        StringBuilder builder = new StringBuilder(query == null ? "" : query.trim());

        if (filters != null && !filters.isEmpty()) {
            String filtersContext = filters.entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isBlank())
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> entry.getKey().toLowerCase(Locale.ROOT) + ":" + entry.getValue().toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(", "));
            if (!filtersContext.isBlank()) {
                builder.append(" | filters: ").append(filtersContext);
            }
        }

        if (trendSignals != null) {
            if (!trendSignals.getTrendingStyles().isEmpty()) {
                builder.append(" | trending styles: ").append(String.join(", ", trendSignals.getTrendingStyles()));
            }
            if (!trendSignals.getSeasonalRecommendations().isEmpty()) {
                builder.append(" | recommended occasions: ").append(String.join(", ", trendSignals.getSeasonalRecommendations()));
            }
            if (trendSignals.getSeason() != null && !trendSignals.getSeason().isBlank()) {
                builder.append(" | season: ").append(trendSignals.getSeason());
            }
            if (trendSignals.getLocation() != null && !trendSignals.getLocation().isBlank()) {
                builder.append(" | location: ").append(trendSignals.getLocation());
            }
            if (trendSignals.getContextualMetadata() != null && !trendSignals.getContextualMetadata().isEmpty()) {
                String contextual = trendSignals.getContextualMetadata().entrySet().stream()
                    .filter(entry -> entry.getKey() != null && entry.getValue() != null)
                    .sorted(Map.Entry.comparingByKey())
                    .map(entry -> entry.getKey().toLowerCase(Locale.ROOT) + ":" + entry.getValue().toLowerCase(Locale.ROOT))
                    .collect(Collectors.joining(", "));
                if (!contextual.isBlank()) {
                    builder.append(" | context: ").append(contextual);
                }
            }
        }

        return builder.toString();
    }
    
    /**
     * Generate a mock vector for deterministic fallback
     */
    private List<Float> generateMockVector(String query) {
        List<Float> vector = new ArrayList<>();
        int hash = Math.abs(query.hashCode());
        for (int i = 0; i < 768; i++) {
            float value = (float) Math.sin(hash + i * 0.1) * 0.5f;
            vector.add(value);
        }
        return vector;
    }
    
}

