/**
 * Vertex AI Configuration for Vector Search Service
 * 
 * Handles:
 * - Vertex AI Matching Engine client setup
 * - Connection pooling and credential management
 * - Cost tracking configuration
 */

package com.agenticsearch.vectorsearch.config;

import com.google.cloud.aiplatform.v1.MatchServiceClient;
import com.google.cloud.aiplatform.v1.MatchServiceSettings;
import com.google.cloud.aiplatform.v1.IndexEndpointServiceClient;
import com.google.cloud.aiplatform.v1.IndexEndpointServiceSettings;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.time.Duration;

@Configuration
public class VertexAIConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(VertexAIConfig.class);
    
    @Value("${gcp.project-id:future-of-search}")
    private String projectId;
    
    @Value("${gcp.region:us-central1}")
    private String region;
    
    @Value("${vertex-ai.endpoint-id:}")
    private String endpointId;
    
    @Value("${vertex-ai.index-id:}")
    private String indexId;
    
    @Value("${vertex-ai.deployed-index-id:}")
    private String deployedIndexId;
    
    @Value("${vertex-ai.embeddings-model:text-embedding-005}")
    private String embeddingsModel;
    
    @Value("${vertex-ai.timeout-seconds:30}")
    private int timeoutSeconds;
    
    /**
     * Configure Vertex AI Endpoint Service Client
     */
    @Bean
    public IndexEndpointServiceClient endpointServiceClient() throws IOException {
        logger.info("Initializing Vertex AI Index Endpoint Service Client for project: {}", projectId);
        
        IndexEndpointServiceSettings settings = IndexEndpointServiceSettings.newBuilder()
            .setEndpoint(String.format("%s-aiplatform.googleapis.com:443", region))
            .build();
        
        return IndexEndpointServiceClient.create(settings);
    }
    
    /**
     * Configure Vertex AI Match Service Client for vector search
     */
    @Bean
    public MatchServiceClient matchServiceClient(IndexEndpointServiceClient endpointServiceClient) throws IOException {
        logger.info("Initializing Vertex AI Match Service Client for project: {}", projectId);

        String defaultEndpoint = String.format("%s-aiplatform.googleapis.com:443", region);
        String targetEndpoint = defaultEndpoint;

        try {
            var indexEndpoint = endpointServiceClient.getIndexEndpoint(getEndpointResourceName());
            String publicDomain = indexEndpoint.getPublicEndpointDomainName();
            if (StringUtils.hasText(publicDomain)) {
                targetEndpoint = publicDomain + ":443";
                logger.info("Using Matching Engine public endpoint: {}", publicDomain);
            } else {
                logger.warn("Index endpoint {} has no public endpoint domain; falling back to {}", getEndpointResourceName(), defaultEndpoint);
            }
        } catch (Exception ex) {
            logger.warn("Unable to resolve public endpoint domain, using default {}. Cause: {}", defaultEndpoint, ex.getMessage());
        }

        MatchServiceSettings settings = MatchServiceSettings.newBuilder()
            .setEndpoint(targetEndpoint)
            .build();

        return MatchServiceClient.create(settings);
    }
    
    /**
     * Circuit breaker for Vertex AI calls to handle failures gracefully
     */
    @Bean
    public CircuitBreaker vertexAICircuitBreaker() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50) // Open circuit if 50% of calls fail
            .waitDurationInOpenState(Duration.ofSeconds(30)) // Wait 30s before trying again
            .slidingWindowSize(10) // Use last 10 calls for failure rate calculation
            .minimumNumberOfCalls(5) // Need at least 5 calls before calculating failure rate
            .build();
        
        return CircuitBreaker.of("vertex-ai", config);
    }
    
    /**
     * Get the full endpoint resource name
     */
    public String getEndpointResourceName() {
        return String.format("projects/%s/locations/%s/indexEndpoints/%s", 
            projectId, region, endpointId);
    }
    
    /**
     * Get the full deployed index resource name
     */
    public String getDeployedIndexResourceName() {
        return String.format("projects/%s/locations/%s/indexEndpoints/%s/deployedIndexes/%s",
            projectId, region, endpointId, deployedIndexId);
    }
    
    // Getters for configuration values
    public String getProjectId() { return projectId; }
    public String getRegion() { return region; }
    public String getEndpointId() { return endpointId; }
    public String getIndexId() { return indexId; }
    public String getDeployedIndexId() { return deployedIndexId; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public String getEmbeddingsModel() { return embeddingsModel; }
    
    /**
     * Get the fully qualified model resource name for text embeddings
     */
    public String getEmbeddingsModelResourceName() {
        return String.format("projects/%s/locations/%s/publishers/google/models/%s",
            projectId, region, embeddingsModel);
    }
    
    /**
     * Build the REST endpoint URL for embeddings predict calls
     */
    public String getEmbeddingsPredictUrl() {
        return String.format("https://%s-aiplatform.googleapis.com/v1/%s:predict",
            region, getEmbeddingsModelResourceName());
    }
}

