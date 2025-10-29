/**
 * Product Model - Represents a product in the search system
 * Generated from Protobuf schema
 */

package com.agenticsearch.responsepipeline.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class Product {
    
    @JsonProperty("sku")
    private String sku;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("price")
    private double price;
    
    @JsonProperty("currency")
    private String currency;
    
    @JsonProperty("category")
    private String category;
    
    @JsonProperty("subcategory")
    private String subcategory;
    
    @JsonProperty("brand")
    private String brand;
    
    @JsonProperty("color")
    private String color;
    
    @JsonProperty("size")
    private String size;
    
    @JsonProperty("material")
    private String material;
    
    @JsonProperty("style_tags")
    private List<String> styleTags;
    
    @JsonProperty("season")
    private String season;
    
    @JsonProperty("gender")
    private String gender;
    
    @JsonProperty("occasion")
    private String occasion;
    
    @JsonProperty("image_url")
    private String imageUrl;
    
    @JsonProperty("stock_status")
    private String stockStatus;
    
    @JsonProperty("rating")
    private double rating;
    
    @JsonProperty("popularity_score")
    private double popularityScore;
    
    // Default constructor
    public Product() {}
    
    // Constructor with required fields
    public Product(String sku, String name, String description, double price, String currency) {
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.price = price;
        this.currency = currency;
    }
    
    // Getters and Setters
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }
    
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    
    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }
    
    public List<String> getStyleTags() { return styleTags; }
    public void setStyleTags(List<String> styleTags) { this.styleTags = styleTags; }
    
    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public String getOccasion() { return occasion; }
    public void setOccasion(String occasion) { this.occasion = occasion; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public String getStockStatus() { return stockStatus; }
    public void setStockStatus(String stockStatus) { this.stockStatus = stockStatus; }
    
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    
    public double getPopularityScore() { return popularityScore; }
    public void setPopularityScore(double popularityScore) { this.popularityScore = popularityScore; }
    
    @Override
    public String toString() {
        return String.format("Product{sku='%s', name='%s', price=%.2f, category='%s'}", 
            sku, name, price, category);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        return sku != null ? sku.equals(product.sku) : product.sku == null;
    }
    
    @Override
    public int hashCode() {
        return sku != null ? sku.hashCode() : 0;
    }
}

