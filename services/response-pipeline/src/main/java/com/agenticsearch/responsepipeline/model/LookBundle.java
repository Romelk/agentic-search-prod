/**
 * Look Bundle - Represents a curated collection of products that work together
 */

package com.agenticsearch.responsepipeline.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class LookBundle {
    
    @JsonProperty("bundle_id")
    private String bundleId;
    
    @JsonProperty("bundle_name")
    private String bundleName;
    
    @JsonProperty("items")
    private List<SearchCandidate> items;
    
    @JsonProperty("coherence_score")
    private double coherenceScore;
    
    @JsonProperty("style_theme")
    private String styleTheme;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("total_price")
    private double totalPrice;
    
    @JsonProperty("currency")
    private String currency;
    
    @JsonProperty("category_breakdown")
    private List<String> categoryBreakdown;
    
    @JsonProperty("style_coherence")
    private double styleCoherence;
    
    @JsonProperty("color_harmony")
    private double colorHarmony;
    
    @JsonProperty("price_range")
    private String priceRange;
    
    // Default constructor
    public LookBundle() {}
    
    // Constructor
    public LookBundle(String bundleId, String bundleName, List<SearchCandidate> items,
                     double coherenceScore, String styleTheme, String description) {
        this.bundleId = bundleId;
        this.bundleName = bundleName;
        this.items = items;
        this.coherenceScore = coherenceScore;
        this.styleTheme = styleTheme;
        this.description = description;
        
        // Calculate derived properties
        this.totalPrice = calculateTotalPrice();
        this.currency = items.isEmpty() ? "USD" : items.get(0).getProduct().getCurrency();
        this.categoryBreakdown = calculateCategoryBreakdown();
    }
    
    // Getters and Setters
    public String getBundleId() { return bundleId; }
    public void setBundleId(String bundleId) { this.bundleId = bundleId; }
    
    public String getBundleName() { return bundleName; }
    public void setBundleName(String bundleName) { this.bundleName = bundleName; }
    
    public List<SearchCandidate> getItems() { return items; }
    public void setItems(List<SearchCandidate> items) { 
        this.items = items;
        this.totalPrice = calculateTotalPrice();
        this.categoryBreakdown = calculateCategoryBreakdown();
    }
    
    public double getCoherenceScore() { return coherenceScore; }
    public void setCoherenceScore(double coherenceScore) { this.coherenceScore = coherenceScore; }
    
    public String getStyleTheme() { return styleTheme; }
    public void setStyleTheme(String styleTheme) { this.styleTheme = styleTheme; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public List<String> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(List<String> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }
    
    public double getStyleCoherence() { return styleCoherence; }
    public void setStyleCoherence(double styleCoherence) { this.styleCoherence = styleCoherence; }
    
    public double getColorHarmony() { return colorHarmony; }
    public void setColorHarmony(double colorHarmony) { this.colorHarmony = colorHarmony; }
    
    public String getPriceRange() { return priceRange; }
    public void setPriceRange(String priceRange) { this.priceRange = priceRange; }
    
    /**
     * Calculate total price of all items in the bundle
     */
    private double calculateTotalPrice() {
        if (items == null || items.isEmpty()) {
            return 0.0;
        }
        
        return items.stream()
            .mapToDouble(item -> item.getProduct().getPrice())
            .sum();
    }
    
    /**
     * Calculate category breakdown for the bundle
     */
    private List<String> calculateCategoryBreakdown() {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        
        return items.stream()
            .map(item -> item.getProduct().getCategory())
            .distinct()
            .sorted()
            .toList();
    }
    
    /**
     * Get the number of items in this bundle
     */
    public int getItemCount() {
        return items != null ? items.size() : 0;
    }
    
    /**
     * Check if bundle is valid (has items and positive coherence score)
     */
    public boolean isValid() {
        return items != null && !items.isEmpty() && coherenceScore > 0.0;
    }
    
    @Override
    public String toString() {
        return String.format("LookBundle{id='%s', name='%s', items=%d, coherence=%.3f, theme='%s'}", 
            bundleId, bundleName, getItemCount(), coherenceScore, styleTheme);
    }
}

