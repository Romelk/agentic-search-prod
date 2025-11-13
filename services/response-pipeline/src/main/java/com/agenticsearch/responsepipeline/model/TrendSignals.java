package com.agenticsearch.responsepipeline.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TrendSignals {

    @JsonProperty("trendingStyles")
    private List<String> trendingStyles = new ArrayList<>();

    @JsonProperty("seasonalRecommendations")
    private List<String> seasonalRecommendations = new ArrayList<>();

    @JsonProperty("trendConfidence")
    private double trendConfidence;

    @JsonProperty("location")
    private String location;

    @JsonProperty("season")
    private String season;

    @JsonProperty("timeOfDay")
    private String timeOfDay;

    @JsonProperty("metadata")
    private Map<String, String> metadata = new HashMap<>();

    public List<String> getTrendingStyles() {
        return trendingStyles != null ? trendingStyles : List.of();
    }

    public void setTrendingStyles(List<String> trendingStyles) {
        this.trendingStyles = trendingStyles != null ? new ArrayList<>(trendingStyles) : new ArrayList<>();
    }

    public List<String> getSeasonalRecommendations() {
        return seasonalRecommendations != null ? seasonalRecommendations : List.of();
    }

    public void setSeasonalRecommendations(List<String> seasonalRecommendations) {
        this.seasonalRecommendations = seasonalRecommendations != null ? new ArrayList<>(seasonalRecommendations) : new ArrayList<>();
    }

    public double getTrendConfidence() {
        return trendConfidence;
    }

    public void setTrendConfidence(double trendConfidence) {
        this.trendConfidence = trendConfidence;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public String getTimeOfDay() {
        return timeOfDay;
    }

    public void setTimeOfDay(String timeOfDay) {
        this.timeOfDay = timeOfDay;
    }

    public Map<String, String> getMetadata() {
        return metadata != null ? metadata : Map.of();
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata != null ? new HashMap<>(metadata) : new HashMap<>();
    }

    public Set<String> getTrendingStylesLower() {
        return getTrendingStyles().stream()
            .filter(Objects::nonNull)
            .map(style -> style.toLowerCase(Locale.ROOT))
            .collect(Collectors.toCollection(HashSet::new));
    }

    public Set<String> getSeasonalRecommendationsLower() {
        return getSeasonalRecommendations().stream()
            .filter(Objects::nonNull)
            .map(rec -> rec.toLowerCase(Locale.ROOT))
            .collect(Collectors.toCollection(HashSet::new));
    }
}

