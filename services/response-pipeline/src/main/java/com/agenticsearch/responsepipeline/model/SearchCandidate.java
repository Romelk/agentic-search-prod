/**
 * Search Candidate - Represents a product match from vector search
 */

package com.agenticsearch.responsepipeline.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class SearchCandidate {
    
    @JsonProperty("product")
    private Product product;
    
    @JsonProperty("similarity_score")
    private double similarityScore;
    
    @JsonProperty("matching_attributes")
    private List<String> matchingAttributes;
    
    @JsonProperty("match_reason")
    private String matchReason;
    
    // Default constructor
    public SearchCandidate() {}
    
    // Constructor
    public SearchCandidate(Product product, double similarityScore, 
                          List<String> matchingAttributes, String matchReason) {
        this.product = product;
        this.similarityScore = similarityScore;
        this.matchingAttributes = matchingAttributes;
        this.matchReason = matchReason;
    }
    
    // Getters and Setters
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    
    public double getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(double similarityScore) { this.similarityScore = similarityScore; }
    
    public List<String> getMatchingAttributes() { return matchingAttributes; }
    public void setMatchingAttributes(List<String> matchingAttributes) { this.matchingAttributes = matchingAttributes; }
    
    public String getMatchReason() { return matchReason; }
    public void setMatchReason(String matchReason) { this.matchReason = matchReason; }
    
    @Override
    public String toString() {
        return String.format("SearchCandidate{product=%s, score=%.3f, reason='%s'}", 
            product != null ? product.getName() : "null", similarityScore, matchReason);
    }
}

