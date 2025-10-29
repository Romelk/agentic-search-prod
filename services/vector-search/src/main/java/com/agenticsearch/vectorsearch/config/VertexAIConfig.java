/**
 * Vertex AI Configuration for Vector Search Service
 * 
 * Handles:
 * - Vertex AI Matching Engine client setup
 * - Connection pooling and credential management
 * - Cost tracking configuration
 */

package com.agenticsearch.vectorsearch.config;

import com.google.cloud.aiplatform.v1.EndpointServiceClient;
import com.google.cloud.aiplatform.v1.EndpointServiceSettings;
import com.google.cloud.aiplatform.v1.MatchServiceClient;
import com.google.cloud.aiplatform.v1.MatchServiceSettings;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
    
    @Value("${vertex-ai.timeout-seconds:30}")
    private int timeoutSeconds;
    
    /**
     * Configure Vertex AI Endpoint Service Client
     */
    @Bean
    public EndpointServiceClient endpointServiceClient() throws IOException {
        logger.info("Initializing Vertex AI Endpoint Service Client for project: {}", projectId);
        
        EndpointServiceSettings settings = EndpointServiceSettings.newBuilder()
            .setEndpoint(String.format("%s-aiplatform.googleapis.com:443", region))
            .build();
        
        return EndpointServiceClient.create(settings);
    }
    
    /**
     * Configure Vertex AI Match Service Client for vector search
     */
    @Bean
    public MatchServiceClient matchServiceClient() throws IOException {
        logger.info("Initializing Vertex AI Match Service Client for project: {}", projectId);
        
        MatchServiceSettings settings = MatchServiceSettings.newBuilder()
            .setEndpoint(String.format("%s-aiplatform.googleapis.com:443", region))
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
}

