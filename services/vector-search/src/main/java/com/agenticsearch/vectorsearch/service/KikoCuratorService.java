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
import com.google.cloud.aiplatform.v1.MatchServiceClient;
import com.google.cloud.aiplatform.v1.MatchRequest;
import com.google.cloud.aiplatform.v1.MatchResponse;
import com.google.cloud.aiplatform.v1.IndexDatapoint;
import com.google.cloud.aiplatform.v1.FindNeighborsRequest;
import com.google.cloud.aiplatform.v1.FindNeighborsResponse;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class KikoCuratorService {
    
    private static final Logger logger = LoggerFactory.getLogger(KikoCuratorService.class);
    
    private final MatchServiceClient matchServiceClient;
    private final VertexAIConfig vertexAIConfig;
    private final CostGuard costGuard;
    private final CircuitBreaker circuitBreaker;
    
    @Autowired
    public KikoCuratorService(MatchServiceClient matchServiceClient,
                             VertexAIConfig vertexAIConfig,
                             CostGuard costGuard,
                             CircuitBreaker circuitBreaker) {
        this.matchServiceClient = matchServiceClient;
        this.vertexAIConfig = vertexAIConfig;
        this.costGuard = costGuard;
        this.circuitBreaker = circuitBreaker;
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
                                                     Map<String, String> filters) {
        logger.info("Starting semantic search for query: '{}' with max results: {}", query, maxResults);
        
        // Estimate cost
        double estimatedCost = costGuard.estimateQueryCost(1);
        
        return costGuard.canProceed(estimatedCost)
            .flatMap(canProceed -> {
                if (!canProceed) {
                    logger.warn("Search blocked by cost controls");
                    return Mono.error(new RuntimeException("Search blocked by cost controls"));
                }
                
                return performVectorSearch(query, maxResults, filters)
                    .doOnSuccess(candidates -> {
                        logger.info("Search completed successfully. Found {} candidates", candidates.size());
                        // Record cost
                        costGuard.recordCost(estimatedCost).subscribe();
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
                                                           Map<String, String> filters) {
        return Mono.fromCallable(() -> {
            try {
                // Create match request
                MatchRequest matchRequest = MatchRequest.newBuilder()
                    .setIndexEndpoint(vertexAIConfig.getEndpointResourceName())
                    .setDeployedIndexId(vertexAIConfig.getDeployedIndexId())
                    .addQueries(createQueryVector(query))
                    .setTopK(maxResults)
                    .build();
                
                // Execute search with circuit breaker protection
                return circuitBreaker.executeSupplier(() -> {
                    try {
                        MatchResponse response = matchServiceClient.match(matchRequest);
                        return processSearchResponse(response, filters);
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
     * Create a query vector from the text query
     * Note: In a real implementation, this would call Vertex AI Embeddings API
     * For now, we'll simulate with a mock vector
     */
    private IndexDatapoint createQueryVector(String query) {
        // Mock implementation - in production, this would:
        // 1. Call Vertex AI Embeddings API to generate embeddings
        // 2. Convert the query text to a 768-dimensional vector
        
        logger.debug("Creating query vector for: '{}'", query);
        
        // Generate a mock 768-dimensional vector based on query hash
        // This is just for demonstration - real implementation would use embeddings
        List<Float> mockVector = generateMockVector(query);
        
        return IndexDatapoint.newBuilder()
            .setDatapointId(query.hashCode() + "_query")
            .addAllFeatureVector(mockVector)
            .build();
    }
    
    /**
     * Generate a mock vector for demonstration purposes
     * In production, this would be replaced with actual embeddings from Vertex AI
     */
    private List<Float> generateMockVector(String query) {
        List<Float> vector = new ArrayList<>();
        int hash = Math.abs(query.hashCode());
        
        // Generate 768 dimensions (standard for text-embedding-005)
        for (int i = 0; i < 768; i++) {
            // Create deterministic but varied values based on hash and position
            float value = (float) Math.sin(hash + i * 0.1) * 0.5f;
            vector.add(value);
        }
        
        return vector;
    }
    
    /**
     * Process the search response from Vertex AI Matching Engine
     */
    private List<SearchCandidate> processSearchResponse(MatchResponse response, 
                                                       Map<String, String> filters) {
        List<SearchCandidate> candidates = new ArrayList<>();
        
        if (response.getNearestNeighborsCount() == 0) {
            logger.warn("No search results returned from Vertex AI Matching Engine");
            return candidates;
        }
        
        var nearestNeighbors = response.getNearestNeighbors(0); // First query
        
        for (var neighbor : nearestNeighbors.getNeighborsList()) {
            try {
                // Extract product data from the datapoint
                Product product = extractProductFromDatapoint(neighbor.getDatapoint());
                
                if (product != null && passesFilters(product, filters)) {
                    SearchCandidate candidate = new SearchCandidate(
                        product,
                        (double) neighbor.getDistance(),
                        extractMatchingAttributes(product),
                        generateMatchReason(product, neighbor.getDistance())
                    );
                    
                    candidates.add(candidate);
                }
                
            } catch (Exception e) {
                logger.warn("Failed to process search result: {}", e.getMessage());
            }
        }
        
        // Sort by similarity score (lower distance = higher similarity)
        candidates.sort((a, b) -> Double.compare(a.getSimilarityScore(), b.getSimilarityScore()));
        
        logger.info("Processed {} search candidates", candidates.size());
        return candidates;
    }
    
    /**
     * Extract product data from Vertex AI datapoint
     * In a real implementation, this would deserialize from the stored metadata
     */
    private Product extractProductFromDatapoint(IndexDatapoint datapoint) {
        try {
            // Mock implementation - in production, this would:
            // 1. Extract metadata from the datapoint
            // 2. Deserialize the product data
            // 3. Return a Product object
            
            String datapointId = datapoint.getDatapointId();
            logger.debug("Extracting product from datapoint: {}", datapointId);
            
            // Create a mock product for demonstration
            Product product = new Product();
            product.setSku(datapointId);
            product.setName("Mock Product " + datapointId);
            product.setDescription("A mock product for demonstration purposes");
            product.setPrice(29.99);
            product.setCurrency("USD");
            product.setCategory("clothing");
            product.setBrand("MockBrand");
            product.setColor("blue");
            product.setSize("M");
            product.setRating(4.5);
            product.setPopularityScore(0.8);
            
            return product;
            
        } catch (Exception e) {
            logger.error("Failed to extract product from datapoint: {}", e.getMessage());
            return null;
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
    
    /**
     * Extract matching attributes for the search candidate
     */
    private List<String> extractMatchingAttributes(Product product) {
        List<String> attributes = new ArrayList<>();
        
        if (product.getCategory() != null) {
            attributes.add("category:" + product.getCategory());
        }
        if (product.getBrand() != null) {
            attributes.add("brand:" + product.getBrand());
        }
        if (product.getColor() != null) {
            attributes.add("color:" + product.getColor());
        }
        if (product.getSize() != null) {
            attributes.add("size:" + product.getSize());
        }
        
        return attributes;
    }
    
    /**
     * Generate a match reason for the search candidate
     */
    private String generateMatchReason(Product product, float distance) {
        double similarity = Math.max(0, 1 - distance); // Convert distance to similarity
        
        if (similarity > 0.9) {
            return "Excellent match based on semantic similarity";
        } else if (similarity > 0.7) {
            return "Good match based on semantic similarity";
        } else if (similarity > 0.5) {
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
                // Check if we can create a basic request (without executing it)
                MatchRequest.newBuilder()
                    .setIndexEndpoint(vertexAIConfig.getEndpointResourceName())
                    .setDeployedIndexId(vertexAIConfig.getDeployedIndexId())
                    .build();
                
                return circuitBreaker.getState() == CircuitBreaker.State.CLOSED;
            } catch (Exception e) {
                logger.warn("Health check failed: {}", e.getMessage());
                return false;
            }
        });
    }
}

