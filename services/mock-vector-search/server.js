#!/usr/bin/env node
/**
 * Mock Vector Search Service (Kiko Curator)
 * Temporary Node.js implementation to replace Java service
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(cors());
app.use(express.json());

// Mock products data
const mockProducts = [
  {
    sku: "SKU-00001",
    name: "Nike Blue Dress",
    description: "Summer Blue Dress for Women. Cotton material with elegant style. Perfect for Casual occasions.",
    price: 45.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Sundress",
    brand: "Nike",
    color: "Blue",
    size: "M",
    material: "Cotton",
    style_tags: "elegant",
    season: "Summer",
    gender: "Women",
    occasion: "Casual",
    image_url: "https://placeholder.com/products/dresses-1.jpg",
    stock_status: "In Stock",
    rating: 4.5,
    popularity_score: 85
  },
  {
    sku: "SKU-00002", 
    name: "Adidas Black Shirt",
    description: "All-Season Black Shirt for Men. Polyester material with sporty style. Perfect for Work occasions.",
    price: 29.99,
    currency: "USD",
    category: "Tops",
    subcategory: "Shirt",
    brand: "Adidas",
    color: "Black",
    size: "L",
    material: "Polyester",
    style_tags: "sporty",
    season: "All-Season",
    gender: "Men",
    occasion: "Work",
    image_url: "https://placeholder.com/products/tops-1.jpg",
    stock_status: "In Stock",
    rating: 4.2,
    popularity_score: 78
  },
  {
    sku: "SKU-00003",
    name: "Zara Red Dress",
    description: "Spring Red Dress for Women. Silk material with romantic style. Perfect for Party occasions.",
    price: 89.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Cocktail Dress",
    brand: "Zara",
    color: "Red",
    size: "S",
    material: "Silk",
    style_tags: "romantic",
    season: "Spring",
    gender: "Women",
    occasion: "Party",
    image_url: "https://placeholder.com/products/dresses-2.jpg",
    stock_status: "In Stock",
    rating: 4.8,
    popularity_score: 92
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mock-vector-search',
    timestamp: new Date().toISOString()
  });
});

// Search endpoint
app.post('/api/v1/search', (req, res) => {
  console.log(`[Mock Vector Search] Received search request:`, req.body);
  
  const { query, filters = {}, maxResults = 10 } = req.body;
  
  if (!query) {
    return res.status(400).json({ 
      error: 'Query is required',
      candidates: []
    });
  }

  // Simple text-based search
  const searchTerms = query.toLowerCase().split(' ');
  const candidates = mockProducts
    .filter(product => {
      const searchableText = `${product.name} ${product.description} ${product.category} ${product.brand} ${product.color}`.toLowerCase();
      return searchTerms.some(term => searchableText.includes(term));
    })
    .slice(0, maxResults)
    .map(product => ({
      id: product.sku,
      score: Math.random() * 0.5 + 0.5, // Random score between 0.5-1.0
      metadata: {
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        brand: product.brand,
        color: product.color,
        size: product.size,
        material: product.material,
        style_tags: product.style_tags,
        season: product.season,
        gender: product.gender,
        occasion: product.occasion,
        image_url: product.image_url,
        stock_status: product.stock_status,
        rating: product.rating,
        popularity_score: product.popularity_score
      }
    }));

  console.log(`[Mock Vector Search] Found ${candidates.length} candidates for query: "${query}"`);
  
  res.json({
    candidates,
    query,
    totalResults: candidates.length,
    searchTime: Math.random() * 100 + 50 // Mock search time
  });
});

// Semantic search endpoint (for orchestrator)
app.post('/api/v1/search/semantic', (req, res) => {
  console.log(`[Mock Vector Search] Received semantic search request:`, req.body);
  
  const { query, filters = {}, maxResults = 10 } = req.body;
  
  if (!query) {
    return res.status(400).json({ 
      error: 'Query is required',
      candidates: []
    });
  }

  // Simple text-based search
  const searchTerms = query.toLowerCase().split(' ');
  const candidates = mockProducts
    .filter(product => {
      const searchableText = `${product.name} ${product.description} ${product.category} ${product.brand} ${product.color}`.toLowerCase();
      return searchTerms.some(term => searchableText.includes(term));
    })
    .slice(0, maxResults)
    .map(product => ({
      id: product.sku,
      score: Math.random() * 0.5 + 0.5, // Random score between 0.5-1.0
      metadata: {
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        brand: product.brand,
        color: product.color,
        size: product.size,
        material: product.material,
        style_tags: product.style_tags,
        season: product.season,
        gender: product.gender,
        occasion: product.occasion,
        image_url: product.image_url,
        stock_status: product.stock_status,
        rating: product.rating,
        popularity_score: product.popularity_score
      }
    }));

  console.log(`[Mock Vector Search] Found ${candidates.length} candidates for semantic query: "${query}"`);
  
  res.json({
    candidates,
    query,
    totalResults: candidates.length,
    searchTime: Math.random() * 100 + 50 // Mock search time
  });
});

// Cost metrics endpoint
app.get('/api/v1/cost/metrics', (req, res) => {
  res.json({
    service: 'mock-vector-search',
    dailySpend: 0.00,
    dailyQueries: 0,
    totalSpend: 0.00,
    lastReset: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔍 Mock Vector Search service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search API: http://localhost:${PORT}/api/v1/search`);
  console.log(`💰 Cost metrics: http://localhost:${PORT}/api/v1/cost/metrics`);
  console.log(`📋 Configuration:`);
  console.log(`  - Mock products: ${mockProducts.length}`);
  console.log(`  - Max results: 10`);
  console.log(`  - Search type: Text-based`);
});

module.exports = app;
