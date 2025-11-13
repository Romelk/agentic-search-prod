package com.agenticsearch.vectorsearch.service;

import com.agenticsearch.vectorsearch.config.VertexAIConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Lightweight client for calling Vertex AI Text Embeddings (text-embedding-005)
 * via the public REST API. Uses Application Default Credentials to obtain
 * access tokens and returns embedding vectors as lists of floats.
 */
@Component
public class VertexAIEmbeddingsClient {

    private static final Logger logger = LoggerFactory.getLogger(VertexAIEmbeddingsClient.class);
    private static final String CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    private final VertexAIConfig vertexAIConfig;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final GoogleCredentials credentials;

    @Value("${vector-search.embeddings.enabled:true}")
    private boolean embeddingsEnabled;

    public VertexAIEmbeddingsClient(VertexAIConfig vertexAIConfig, ObjectMapper objectMapper) throws IOException {
        this.vertexAIConfig = vertexAIConfig;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(vertexAIConfig.getTimeoutSeconds()))
            .build();
        this.credentials = GoogleCredentials.getApplicationDefault().createScoped(CLOUD_PLATFORM_SCOPE);
    }

    /**
     * Obtain an embedding vector for the given text using Vertex AI.
     *
     * @param text The natural language text to embed
     * @return Embedding vector as list of floats
     */
    public List<Float> embedText(String text) throws IOException, InterruptedException {
        if (!embeddingsEnabled || vertexAIConfig.getEmbeddingsModel() == null || vertexAIConfig.getEmbeddingsModel().isBlank()) {
            throw new IllegalStateException("Vertex AI embeddings are disabled or model is not configured");
        }

        if (text == null || text.isBlank()) {
            return List.of();
        }

        String requestBody = objectMapper.writeValueAsString(
            Map.of(
                "instances", List.of(Map.of("content", text)),
                "parameters", Map.of("autoTruncate", true)
            )
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(vertexAIConfig.getEmbeddingsPredictUrl()))
            .timeout(Duration.ofSeconds(vertexAIConfig.getTimeoutSeconds()))
            .header("Authorization", "Bearer " + getAccessToken())
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            logger.error("Vertex AI embeddings request failed with status {}: {}", response.statusCode(), response.body());
            throw new IOException("Vertex AI embeddings request failed with status " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode valuesNode = root.path("predictions").path(0).path("embeddings").path("values");

        if (!valuesNode.isArray() || valuesNode.isEmpty()) {
            logger.error("Unexpected embeddings response format: {}", response.body());
            throw new IOException("Vertex AI embeddings response missing vector values");
        }

        List<Float> vector = new ArrayList<>(valuesNode.size());
        for (JsonNode valueNode : valuesNode) {
            vector.add((float) valueNode.asDouble());
        }

        logger.debug("Generated embedding vector with {} dimensions", vector.size());
        return vector;
    }

    private synchronized String getAccessToken() throws IOException {
        credentials.refreshIfExpired();
        if (credentials.getAccessToken() == null) {
            credentials.refreshAccessToken();
        }
        if (credentials.getAccessToken() == null) {
            throw new IOException("Unable to obtain Google Cloud access token for embeddings request");
        }
        return credentials.getAccessToken().getTokenValue();
    }
}


