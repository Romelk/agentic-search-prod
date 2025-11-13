#!/usr/bin/env node
/**
 * Mock Vector Search Service (Kiko Curator)
 * Temporary Node.js implementation to replace Java service
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(cors());
app.use(express.json());

// Load products from JSON file (demo products)
// If file doesn't exist, fall back to in-memory array
let mockProducts = [];

const productsFilePath = path.join(__dirname, 'products-demo.json');
try {
  if (fs.existsSync(productsFilePath)) {
    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    mockProducts = JSON.parse(productsData);
    console.log(`✅ Loaded ${mockProducts.length} products from products-demo.json`);
  } else {
    // Fallback to in-memory products if file doesn't exist
    console.log(`⚠️  products-demo.json not found, using in-memory products`);
    mockProducts = [
  // Test Case 1: "blue dress" - Simple product search
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
    name: "Zara Blue Maxi Dress",
    description: "Elegant blue maxi dress perfect for summer days. Lightweight fabric with beautiful flow.",
    price: 79.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Maxi Dress",
    brand: "Zara",
    color: "Blue",
    size: "S",
    material: "Cotton",
    style_tags: "elegant, casual",
    season: "Summer",
    gender: "Women",
    occasion: "Casual",
    image_url: "https://placeholder.com/products/dresses-2.jpg",
    stock_status: "In Stock",
    rating: 4.7,
    popularity_score: 88
  },
  {
    sku: "SKU-00003",
    name: "H&M Blue A-Line Dress",
    description: "Classic blue A-line dress. Versatile and comfortable for everyday wear.",
    price: 39.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "A-Line",
    brand: "H&M",
    color: "Blue",
    size: "L",
    material: "Polyester",
    style_tags: "classic, versatile",
    season: "All-Season",
    gender: "Women",
    occasion: "Casual",
    image_url: "https://placeholder.com/products/dresses-3.jpg",
    stock_status: "In Stock",
    rating: 4.3,
    popularity_score: 82
  },
  
  // Test Case 2: "dress for wedding" - Occasion-based search
  {
    sku: "SKU-00004",
    name: "Elegant White Wedding Dress",
    description: "Beautiful formal white dress perfect for wedding ceremonies. Elegant and sophisticated design.",
    price: 299.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Formal Dress",
    brand: "Designer",
    color: "White",
    size: "M",
    material: "Silk",
    style_tags: "elegant, formal, sophisticated",
    season: "All-Season",
    gender: "Women",
    occasion: "Wedding",
    image_url: "https://placeholder.com/products/wedding-1.jpg",
    stock_status: "In Stock",
    rating: 4.9,
    popularity_score: 95
  },
  {
    sku: "SKU-00005",
    name: "Lavender Wedding Guest Dress",
    description: "Charming lavender dress ideal for wedding guests. Formal yet comfortable design.",
    price: 149.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Cocktail Dress",
    brand: "Zara",
    color: "Lavender",
    size: "S",
    material: "Chiffon",
    style_tags: "elegant, formal, charming",
    season: "Spring",
    gender: "Women",
    occasion: "Wedding",
    image_url: "https://placeholder.com/products/wedding-2.jpg",
    stock_status: "In Stock",
    rating: 4.6,
    popularity_score: 90
  },
  {
    sku: "SKU-00006",
    name: "Navy Blue Formal Dress",
    description: "Sophisticated navy blue dress perfect for formal wedding events. Timeless elegance.",
    price: 199.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Formal Dress",
    brand: "Designer",
    color: "Navy Blue",
    size: "L",
    material: "Silk",
    style_tags: "sophisticated, formal, timeless",
    season: "All-Season",
    gender: "Women",
    occasion: "Wedding",
    image_url: "https://placeholder.com/products/wedding-3.jpg",
    stock_status: "In Stock",
    rating: 4.8,
    popularity_score: 93
  },
  
  // Test Case 3: "summer dress for beach wedding in July" - Multi-context search
  {
    sku: "SKU-00007",
    name: "Summer Beach Wedding Dress",
    description: "Light and airy summer dress perfect for beach weddings in July. Breathable fabric with elegant beach-ready design.",
    price: 129.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Beach Dress",
    brand: "Beachwear Co",
    color: "Cream",
    size: "M",
    material: "Linen",
    style_tags: "beach, summer, elegant, casual",
    season: "Summer",
    gender: "Women",
    occasion: "Wedding",
    image_url: "https://placeholder.com/products/beach-wedding-1.jpg",
    stock_status: "In Stock",
    rating: 4.7,
    popularity_score: 91
  },
  {
    sku: "SKU-00008",
    name: "Floral Summer Wedding Dress",
    description: "Beautiful floral pattern summer dress ideal for beach weddings. Lightweight and comfortable for July weather.",
    price: 159.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Sundress",
    brand: "Beachwear Co",
    color: "Floral",
    size: "S",
    material: "Cotton",
    style_tags: "floral, summer, beach, elegant",
    season: "Summer",
    gender: "Women",
    occasion: "Wedding",
    image_url: "https://placeholder.com/products/beach-wedding-2.jpg",
    stock_status: "In Stock",
    rating: 4.8,
    popularity_score: 94
  },
  
  // Test Case 4: "summer dress" - Seasonal search
  {
    sku: "SKU-00009",
    name: "Yellow Summer Sundress",
    description: "Bright yellow summer dress perfect for warm weather. Light and breezy design.",
    price: 49.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Sundress",
    brand: "H&M",
    color: "Yellow",
    size: "M",
    material: "Cotton",
    style_tags: "bright, casual, summer",
    season: "Summer",
    gender: "Women",
    occasion: "Casual",
    image_url: "https://placeholder.com/products/summer-1.jpg",
    stock_status: "In Stock",
    rating: 4.4,
    popularity_score: 86
  },
  {
    sku: "SKU-00010",
    name: "Pink Summer Floral Dress",
    description: "Charming pink floral dress ideal for summer days. Comfortable and stylish.",
    price: 59.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Sundress",
    brand: "Zara",
    color: "Pink",
    size: "L",
    material: "Cotton",
    style_tags: "floral, charming, summer",
    season: "Summer",
    gender: "Women",
    occasion: "Casual",
    image_url: "https://placeholder.com/products/summer-2.jpg",
    stock_status: "In Stock",
    rating: 4.6,
    popularity_score: 89
  },
  
  // Test Case 5: "blue dress outfit" - Outfit/bundling search
  {
    sku: "SKU-00011",
    name: "Cobalt Blue Cocktail Dress",
    description: "Stunning cobalt blue dress perfect for creating complete outfits. Pairs beautifully with accessories.",
    price: 119.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Cocktail Dress",
    brand: "Designer",
    color: "Blue",
    size: "M",
    material: "Silk",
    style_tags: "elegant, versatile, outfit-ready",
    season: "All-Season",
    gender: "Women",
    occasion: "Party",
    image_url: "https://placeholder.com/products/outfit-1.jpg",
    stock_status: "In Stock",
    rating: 4.7,
    popularity_score: 92
  },
  {
    sku: "SKU-00012",
    name: "Navy Blue Outfit Dress",
    description: "Versatile navy blue dress designed to coordinate with matching accessories and shoes for complete looks.",
    price: 89.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "A-Line",
    brand: "Zara",
    color: "Blue",
    size: "S",
    material: "Polyester",
    style_tags: "versatile, outfit, coordinated",
    season: "All-Season",
    gender: "Women",
    occasion: "Casual",
    image_url: "https://placeholder.com/products/outfit-2.jpg",
    stock_status: "In Stock",
    rating: 4.5,
    popularity_score: 87
  },
  
  // Additional products for variety
  {
    sku: "SKU-00013",
    name: "Black Formal Shirt",
    description: "Classic black formal shirt for men. Perfect for work and formal occasions.",
    price: 39.99,
    currency: "USD",
    category: "Tops",
    subcategory: "Shirt",
    brand: "Adidas",
    color: "Black",
    size: "L",
    material: "Polyester",
    style_tags: "classic, formal",
    season: "All-Season",
    gender: "Men",
    occasion: "Work",
    image_url: "https://placeholder.com/products/tops-1.jpg",
    stock_status: "In Stock",
    rating: 4.2,
    popularity_score: 78
  },
  {
    sku: "SKU-00014",
    name: "Red Party Dress",
    description: "Vibrant red dress perfect for parties and special occasions. Eye-catching design.",
    price: 99.99,
    currency: "USD",
    category: "Dresses",
    subcategory: "Cocktail Dress",
    brand: "Zara",
    color: "Red",
    size: "M",
    material: "Silk",
    style_tags: "vibrant, party, elegant",
    season: "All-Season",
    gender: "Women",
    occasion: "Party",
    image_url: "https://placeholder.com/products/party-1.jpg",
    stock_status: "In Stock",
    rating: 4.8,
    popularity_score: 92
  }
    ];
  }
} catch (error) {
  console.error(`❌ Error loading products from ${productsFilePath}:`, error.message);
  console.log(`⚠️  Falling back to empty product list`);
  mockProducts = [];
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mock-vector-search',
    timestamp: new Date().toISOString()
  });
});

// Helper function: Calculate relevance score for a product
function calculateRelevanceScore(product, searchTerms) {
  const searchableText = `${product.name} ${product.description} ${product.category} ${product.subcategory} ${product.brand} ${product.color} ${product.material} ${product.style_tags} ${product.season} ${product.occasion}`.toLowerCase();
  
  let score = 0;
  let matchCount = 0;
  
  // Check each search term
  searchTerms.forEach(term => {
    if (term.length < 2) return; // Skip very short terms
    
    // Exact matches in key fields (higher score)
    if (product.name.toLowerCase().includes(term)) {
      score += 0.3;
      matchCount++;
    }
    if (product.color && product.color.toLowerCase().includes(term)) {
      score += 0.25;
      matchCount++;
    }
    if (product.category && product.category.toLowerCase().includes(term)) {
      score += 0.2;
      matchCount++;
    }
    if (product.occasion && product.occasion.toLowerCase().includes(term)) {
      score += 0.2;
      matchCount++;
    }
    if (product.season && product.season.toLowerCase().includes(term)) {
      score += 0.15;
      matchCount++;
    }
    
    // General text match (lower score)
    if (searchableText.includes(term)) {
      score += 0.1;
      matchCount++;
    }
  });
  
  // Boost score for products that match multiple terms
  if (matchCount > 1) {
    score *= 1.2;
  }
  
  // Normalize score (0.0 to 1.0)
  score = Math.min(1.0, score);
  
  // Add base score so all matching products have some relevance
  if (matchCount > 0) {
    score = Math.max(0.5, score);
  }
  
  return { score, matchCount };
}

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

  // Enhanced text-based search with relevance scoring
  const queryLower = query.toLowerCase();
  const searchTerms = queryLower.split(' ').filter(t => t.length >= 2);
  
  const scoredProducts = mockProducts
    .map(product => {
      const { score, matchCount } = calculateRelevanceScore(product, searchTerms);
      return { product, score, matchCount };
    })
    .filter(item => item.matchCount > 0) // Only include products that match
    .sort((a, b) => b.score - a.score) // Sort by relevance
    .slice(0, maxResults)
    .map(item => ({
      id: item.product.sku,
      score: item.score,
      metadata: {
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        currency: item.product.currency,
        category: item.product.category,
        subcategory: item.product.subcategory,
        brand: item.product.brand,
        color: item.product.color,
        size: item.product.size,
        material: item.product.material,
        style_tags: item.product.style_tags,
        season: item.product.season,
        gender: item.product.gender,
        occasion: item.product.occasion,
        image_url: item.product.image_url,
        stock_status: item.product.stock_status,
        rating: item.product.rating,
        popularity_score: item.product.popularity_score
      }
    }));

  console.log(`[Mock Vector Search] Found ${scoredProducts.length} candidates for query: "${query}"`);
  
  res.json({
    candidates: scoredProducts,
    query,
    totalResults: scoredProducts.length,
    searchTime: Math.random() * 100 + 50 // Mock search time
  });
});

// Semantic search endpoint (for orchestrator)
app.post('/api/v1/search/semantic', (req, res) => {
  console.log(`[Mock Vector Search] Received semantic search request:`, req.body);
  
  const { query, trendEnrichedQuery, filters = {}, maxResults = 10 } = req.body;
  
  if (!query) {
    return res.status(400).json({ 
      error: 'Query is required',
      candidates: []
    });
  }

  // Enhanced text-based search with relevance scoring
  const queryLower = query.toLowerCase();
  const searchTerms = queryLower.split(' ').filter(t => t.length >= 2);
  
  // If trendEnrichedQuery is provided, incorporate trend information
  let enrichedTerms = [...searchTerms];
  if (trendEnrichedQuery && trendEnrichedQuery.trendingStyles) {
    trendEnrichedQuery.trendingStyles.forEach(style => {
      enrichedTerms.push(style.toLowerCase());
    });
  }
  
  const scoredProducts = mockProducts
    .map(product => {
      const { score, matchCount } = calculateRelevanceScore(product, enrichedTerms);
      return { product, score, matchCount };
    })
    .filter(item => item.matchCount > 0) // Only include products that match
    .sort((a, b) => b.score - a.score) // Sort by relevance
    .slice(0, maxResults)
    .map(item => ({
      id: item.product.sku,
      score: item.score,
      metadata: {
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        currency: item.product.currency,
        category: item.product.category,
        subcategory: item.product.subcategory,
        brand: item.product.brand,
        color: item.product.color,
        size: item.product.size,
        material: item.product.material,
        style_tags: item.product.style_tags,
        season: item.product.season,
        gender: item.product.gender,
        occasion: item.product.occasion,
        image_url: item.product.image_url,
        stock_status: item.product.stock_status,
        rating: item.product.rating,
        popularity_score: item.product.popularity_score
      }
    }));

  console.log(`[Mock Vector Search] Found ${scoredProducts.length} candidates for semantic query: "${query}"`);
  
  res.json({
    candidates: scoredProducts,
    query,
    totalResults: scoredProducts.length,
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
  console.log(`  - Search type: Enhanced text-based with relevance scoring`);
  console.log(`  - Test scenarios covered:`);
  console.log(`    ✓ "blue dress" - ${mockProducts.filter(p => p.color.toLowerCase() === 'blue' && p.category === 'Dresses').length} products`);
  console.log(`    ✓ "dress for wedding" - ${mockProducts.filter(p => p.occasion === 'Wedding').length} products`);
  console.log(`    ✓ "summer dress" - ${mockProducts.filter(p => p.season === 'Summer').length} products`);
  console.log(`    ✓ "outfit" queries - ${mockProducts.filter(p => p.style_tags && (p.style_tags.includes('outfit') || p.style_tags.includes('versatile'))).length} products`);
});

module.exports = app;
