/**
 * Search Controller - REST endpoints for vector search operations
 * 
 * Endpoints:
 * - POST /api/v1/search/semantic - Semantic vector search
 * - GET /api/v1/search/health - Health check
 * - GET /api/v1/search/cost/metrics - Cost metrics
 */

package com.agenticsearch.vectorsearch.controller;

import com.agenticsearch.vectorsearch.config.CostGuard;
import com.agenticsearch.vectorsearch.model.SearchCandidate;
import com.agenticsearch.vectorsearch.model.TrendSignals;
import com.agenticsearch.vectorsearch.service.KikoCuratorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
@CrossOrigin(origins = "*")
public class SearchController {
    
    private static final Logger logger = LoggerFactory.getLogger(SearchController.class);
    
    private final KikoCuratorService kikoCuratorService;
    private final CostGuard costGuard;
    
    @Autowired
    public SearchController(KikoCuratorService kikoCuratorService, CostGuard costGuard) {
        this.kikoCuratorService = kikoCuratorService;
        this.costGuard = costGuard;
    }
    
    /**
     * Semantic vector search endpoint
     */
    @PostMapping("/semantic")
    public Mono<ResponseEntity<SearchResponse>> searchSemantic(@RequestBody SearchRequest request) {
        logger.info("Received semantic search request: {}", request);
        
        // Validate request
        if (request.getQuery() == null || request.getQuery().trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest()
                .body(new SearchResponse("Query is required", null, 0.0)));
        }
        
        int maxResults = request.getMaxResults() != null ? request.getMaxResults() : 10;
        Map<String, String> filters = request.getFilters() != null ? request.getFilters() : new HashMap<>();
        TrendSignals trendSignals = request.resolveTrendSignals();
        
        return kikoCuratorService.searchSemantic(request.getQuery(), maxResults, filters, trendSignals)
            .map(candidates -> {
                double estimatedCost = costGuard.estimateQueryCost(1);
                
                SearchResponse response = new SearchResponse(
                    "Search completed successfully",
                    candidates,
                    estimatedCost
                );
                
                logger.info("Search completed. Found {} candidates", candidates.size());
                return ResponseEntity.ok(response);
            })
            .onErrorResume(error -> {
                logger.error("Search failed: {}", error.getMessage());
                
                SearchResponse errorResponse = new SearchResponse(
                    "Search failed: " + error.getMessage(),
                    null,
                    0.0
                );
                
                return Mono.just(ResponseEntity.internalServerError().body(errorResponse));
            });
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<HealthResponse>> health() {
        return kikoCuratorService.isHealthy()
            .map(healthy -> {
                HealthResponse response = new HealthResponse();
                response.setStatus(healthy ? "healthy" : "unhealthy");
                response.setTimestamp(System.currentTimeMillis());
                response.setService("vector-search");
                response.setVersion("1.0.0");
                
                return ResponseEntity.ok(response);
            })
            .onErrorReturn(ResponseEntity.internalServerError()
                .body(new HealthResponse("unhealthy", System.currentTimeMillis(), "vector-search", "1.0.0")));
    }
    
    /**
     * Cost metrics endpoint
     */
    @GetMapping("/cost/metrics")
    public Mono<ResponseEntity<CostGuard.CostMetrics>> getCostMetrics() {
        return costGuard.getMetrics()
            .map(ResponseEntity::ok)
            .onErrorReturn(ResponseEntity.internalServerError().body(null));
    }
    
    /**
     * Service status endpoint
     */
    @GetMapping("/status")
    public Mono<ResponseEntity<ServiceStatus>> getStatus() {
        return kikoCuratorService.isHealthy()
            .map(healthy -> {
                ServiceStatus status = new ServiceStatus();
                status.setServiceName("Kiko Curator");
                status.setStatus(healthy ? "ready" : "unhealthy");
                status.setDescription("Vector similarity search via Vertex AI Matching Engine");
                status.setCapabilities(List.of(
                    "Semantic vector search",
                    "Vertex AI Matching Engine integration",
                    "Cost-controlled queries",
                    "Filter-based search",
                    "Circuit breaker protection"
                ));
                
                return ResponseEntity.ok(status);
            });
    }
    
    /**
     * Search request model
     */
    public static class SearchRequest {
        private String query;
        private Integer maxResults;
        private Map<String, String> filters;
        private TrendEnrichedQueryPayload trendEnrichedQuery;
        private TrendSignals trendSignals;
        
        // Constructors
        public SearchRequest() {}
        
        public SearchRequest(String query, Integer maxResults, Map<String, String> filters) {
            this.query = query;
            this.maxResults = maxResults;
            this.filters = filters;
        }
        
        // Getters and Setters
        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
        
        public Integer getMaxResults() { return maxResults; }
        public void setMaxResults(Integer maxResults) { this.maxResults = maxResults; }
        
        public Map<String, String> getFilters() { return filters; }
        public void setFilters(Map<String, String> filters) { this.filters = filters; }
        
        public TrendEnrichedQueryPayload getTrendEnrichedQuery() { return trendEnrichedQuery; }
        public void setTrendEnrichedQuery(TrendEnrichedQueryPayload trendEnrichedQuery) { this.trendEnrichedQuery = trendEnrichedQuery; }
        
        public TrendSignals getTrendSignals() { return trendSignals; }
        public void setTrendSignals(TrendSignals trendSignals) { this.trendSignals = trendSignals; }
        
        public TrendSignals resolveTrendSignals() {
            if (trendSignals != null) {
                return trendSignals;
            }
            if (trendEnrichedQuery != null) {
                return trendEnrichedQuery.toTrendSignals();
            }
            return null;
        }
        
        @Override
        public String toString() {
            return "SearchRequest{" +
                "query='" + query + '\'' +
                ", maxResults=" + maxResults +
                ", filters=" + filters +
                ", trendEnrichedQuery=" + (trendEnrichedQuery != null ? "present" : "absent") +
                '}';
        }
        
        @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
        public static class TrendEnrichedQueryPayload {
            private List<String> trendingStyles;
            private List<String> seasonalRecommendations;
            private Double trendConfidence;
            private ContextualPayload contextual;
            
            public List<String> getTrendingStyles() { return trendingStyles != null ? trendingStyles : List.of(); }
            public void setTrendingStyles(List<String> trendingStyles) { this.trendingStyles = trendingStyles; }
            
            public List<String> getSeasonalRecommendations() { return seasonalRecommendations != null ? seasonalRecommendations : List.of(); }
            public void setSeasonalRecommendations(List<String> seasonalRecommendations) { this.seasonalRecommendations = seasonalRecommendations; }
            
            public Double getTrendConfidence() { return trendConfidence; }
            public void setTrendConfidence(Double trendConfidence) { this.trendConfidence = trendConfidence; }
            
            public ContextualPayload getContextual() { return contextual; }
            public void setContextual(ContextualPayload contextual) { this.contextual = contextual; }
            
            public TrendSignals toTrendSignals() {
                TrendSignals signals = new TrendSignals();
                signals.setTrendingStyles(new ArrayList<>(getTrendingStyles()));
                signals.setSeasonalRecommendations(new ArrayList<>(getSeasonalRecommendations()));
                signals.setTrendConfidence(trendConfidence != null ? trendConfidence : 0.0);
                if (contextual != null) {
                    signals.setLocation(contextual.getLocation());
                    signals.setSeason(contextual.getSeason());
                    signals.setTimeOfDay(contextual.getTimeOfDay());
                    signals.setContextualMetadata(contextual.getEnvironmentalContext());
                }
                return signals;
            }
        }
        
        @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
        public static class ContextualPayload {
            private String location;
            private String season;
            private String timeOfDay;
            private Map<String, String> environmentalContext;
            
            public String getLocation() { return location; }
            public void setLocation(String location) { this.location = location; }
            
            public String getSeason() { return season; }
            public void setSeason(String season) { this.season = season; }
            
            public String getTimeOfDay() { return timeOfDay; }
            public void setTimeOfDay(String timeOfDay) { this.timeOfDay = timeOfDay; }
            
            public Map<String, String> getEnvironmentalContext() { return environmentalContext != null ? environmentalContext : Map.of(); }
            public void setEnvironmentalContext(Map<String, String> environmentalContext) { this.environmentalContext = environmentalContext; }
        }
    }
    
    /**
     * Search response model
     */
    public static class SearchResponse {
        private String message;
        private List<SearchCandidate> candidates;
        private double estimatedCost;
        
        // Constructors
        public SearchResponse() {}
        
        public SearchResponse(String message, List<SearchCandidate> candidates, double estimatedCost) {
            this.message = message;
            this.candidates = candidates;
            this.estimatedCost = estimatedCost;
        }
        
        // Getters and Setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public List<SearchCandidate> getCandidates() { return candidates; }
        public void setCandidates(List<SearchCandidate> candidates) { this.candidates = candidates; }
        
        public double getEstimatedCost() { return estimatedCost; }
        public void setEstimatedCost(double estimatedCost) { this.estimatedCost = estimatedCost; }
    }
    
    /**
     * Health response model
     */
    public static class HealthResponse {
        private String status;
        private long timestamp;
        private String service;
        private String version;
        
        // Constructors
        public HealthResponse() {}
        
        public HealthResponse(String status, long timestamp, String service, String version) {
            this.status = status;
            this.timestamp = timestamp;
            this.service = service;
            this.version = version;
        }
        
        // Getters and Setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        
        public String getService() { return service; }
        public void setService(String service) { this.service = service; }
        
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
    }
    
    /**
     * Service status model
     */
    public static class ServiceStatus {
        private String serviceName;
        private String status;
        private String description;
        private List<String> capabilities;
        
        // Constructors
        public ServiceStatus() {}
        
        // Getters and Setters
        public String getServiceName() { return serviceName; }
        public void setServiceName(String serviceName) { this.serviceName = serviceName; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public List<String> getCapabilities() { return capabilities; }
        public void setCapabilities(List<String> capabilities) { this.capabilities = capabilities; }
    }
}

