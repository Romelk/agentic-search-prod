/**
 * Ranked Look - Represents a scored and ranked look bundle
 */

package com.agenticsearch.responsepipeline.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class RankedLook {
    
    @JsonProperty("look")
    private LookBundle look;
    
    @JsonProperty("final_score")
    private double finalScore;
    
    @JsonProperty("score_breakdown")
    private Map<String, Double> scoreBreakdown;
    
    @JsonProperty("rank")
    private int rank;
    
    @JsonProperty("confidence")
    private double confidence;
    
    @JsonProperty("recommendation_reason")
    private String recommendationReason;
    
    @JsonProperty("user_preference_match")
    private double userPreferenceMatch;
    
    @JsonProperty("trend_alignment")
    private double trendAlignment;
    
    // Default constructor
    public RankedLook() {}
    
    // Constructor
    public RankedLook(LookBundle look, double finalScore, Map<String, Double> scoreBreakdown, int rank) {
        this.look = look;
        this.finalScore = finalScore;
        this.scoreBreakdown = scoreBreakdown;
        this.rank = rank;
    }
    
    // Getters and Setters
    public LookBundle getLook() { return look; }
    public void setLook(LookBundle look) { this.look = look; }
    
    public double getFinalScore() { return finalScore; }
    public void setFinalScore(double finalScore) { this.finalScore = finalScore; }
    
    public Map<String, Double> getScoreBreakdown() { return scoreBreakdown; }
    public void setScoreBreakdown(Map<String, Double> scoreBreakdown) { this.scoreBreakdown = scoreBreakdown; }
    
    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
    
    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
    
    public String getRecommendationReason() { return recommendationReason; }
    public void setRecommendationReason(String recommendationReason) { this.recommendationReason = recommendationReason; }
    
    public double getUserPreferenceMatch() { return userPreferenceMatch; }
    public void setUserPreferenceMatch(double userPreferenceMatch) { this.userPreferenceMatch = userPreferenceMatch; }
    
    public double getTrendAlignment() { return trendAlignment; }
    public void setTrendAlignment(double trendAlignment) { this.trendAlignment = trendAlignment; }
    
    /**
     * Get a specific score component from the breakdown
     */
    public double getScoreComponent(String component) {
        return scoreBreakdown != null ? scoreBreakdown.getOrDefault(component, 0.0) : 0.0;
    }
    
    /**
     * Check if this ranked look meets minimum quality threshold
     */
    public boolean meetsQualityThreshold(double minScore) {
        return finalScore >= minScore && look != null && look.isValid();
    }
    
    /**
     * Get formatted price string
     */
    public String getFormattedPrice() {
        if (look == null) {
            return "$0.00";
        }
        return String.format("$%.2f", look.getTotalPrice());
    }
    
    @Override
    public String toString() {
        return String.format("RankedLook{rank=%d, score=%.3f, confidence=%.3f, bundle=%s}", 
            rank, finalScore, confidence, look != null ? look.getBundleName() : "null");
    }
}

