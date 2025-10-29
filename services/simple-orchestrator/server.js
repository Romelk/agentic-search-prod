const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data (same as frontend)
const mockProducts = [
  {
    sku: 'SKU001',
    name: 'Elegant Blue Summer Dress',
    description: 'A beautiful blue dress perfect for summer evenings and parties',
    price: 89.99,
    currency: 'USD',
    category: 'clothing',
    subcategory: 'dresses',
    brand: 'StyleCo',
    color: 'blue',
    size: 'M',
    material: 'cotton',
    styleTags: ['elegant', 'summer', 'party', 'evening'],
    season: 'summer',
    gender: 'female',
    occasion: 'party',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300',
    stockStatus: 'in_stock',
    rating: 4.5,
    popularityScore: 0.8
  },
  {
    sku: 'SKU002',
    name: 'Classic White Shirt',
    description: 'Timeless white shirt perfect for professional and casual occasions',
    price: 45.99,
    currency: 'USD',
    category: 'clothing',
    subcategory: 'shirts',
    brand: 'ClassicWear',
    color: 'white',
    size: 'L',
    material: 'cotton',
    styleTags: ['classic', 'professional', 'versatile'],
    season: 'all',
    gender: 'unisex',
    occasion: 'work',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300',
    stockStatus: 'in_stock',
    rating: 4.3,
    popularityScore: 0.9
  },
  {
    sku: 'SKU003',
    name: 'Black Leather Handbag',
    description: 'Sophisticated black leather handbag for any occasion',
    price: 120.00,
    currency: 'USD',
    category: 'accessories',
    subcategory: 'bags',
    brand: 'LuxeBags',
    color: 'black',
    size: 'M',
    material: 'leather',
    styleTags: ['sophisticated', 'versatile', 'luxury'],
    season: 'all',
    gender: 'female',
    occasion: 'formal',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
    stockStatus: 'in_stock',
    rating: 4.7,
    popularityScore: 0.7
  }
];

// Smart agent routing
const determineRequiredAgents = (query) => {
  const queryLower = query.toLowerCase();
  
  if (queryLower.match(/^(blue|red|black|white|green|pink|yellow|purple|orange|brown|gray|grey)\s+(dress|shirt|pants|shoes|bag|jacket|sweater|blouse|skirt|jeans|coat|hat|scarf|belt|watch|necklace|ring|earrings)$/)) {
    return ['Ivy Interpreter', 'Kiko Curator', 'Judge Ranker'];
  }
  
  if (queryLower.match(/(party|wedding|work|casual|formal|date|gym|beach|travel|meeting)/)) {
    return ['Ivy Interpreter', 'Gale ContextKeeper', 'Kiko Curator', 'Weave Composer', 'Judge Ranker'];
  }
  
  return ['Ivy Interpreter', 'Gale ContextKeeper', 'Kiko Curator', 'Judge Ranker', 'Sage Explainer'];
};

// Create mock execution trace
const createMockExecutionTrace = (query) => {
  const requiredAgents = determineRequiredAgents(query);
  const steps = requiredAgents.map((agentName, index) => ({
    agentName,
    status: 'completed',
    startTime: Date.now() - (requiredAgents.length - index) * 150,
    endTime: Date.now() - (requiredAgents.length - index - 1) * 150,
    duration: 150,
    input: { query, step: index },
    output: { 
      success: true, 
      data: `${agentName} completed successfully`,
      reasoning: `Processed query: "${query}" with ${requiredAgents.length} agents`
    }
  }));

  return {
    sessionId: `session_${Date.now()}`,
    query,
    steps,
    currentStep: steps.length - 1,
    isComplete: true,
    totalDuration: requiredAgents.length * 150
  };
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Agentic Search API',
    status: 'running',
    service: 'simple-orchestrator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      search: '/api/v1/search',
      docs: '/api/docs'
    },
    agents: ['Ivy', 'Nori', 'Gale', 'Vogue', 'Kiko', 'Weave', 'Judge', 'Sage', 'Aegis']
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'simple-orchestrator',
    timestamp: new Date().toISOString(),
    agents: ['Ivy', 'Nori', 'Gale', 'Vogue', 'Kiko', 'Weave', 'Judge', 'Sage', 'Aegis']
  });
});

// API docs endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Agentic Search API',
    version: '1.0.0',
    description: 'AI-powered fashion search with smart agent routing',
    endpoints: {
      'GET /': 'API information',
      'GET /health': 'Health check',
      'POST /api/v1/search': {
        description: 'Search for fashion items using AI agents',
        parameters: {
          query: { type: 'string', required: true, description: 'Search query' },
          filters: { type: 'object', required: false, description: 'Additional filters' },
          sessionId: { type: 'string', required: false, description: 'Session ID for tracking' }
        },
        example: {
          query: 'blue dress for summer party',
          filters: { priceRange: '$50-100', occasion: 'party' },
          sessionId: 'session_123'
        }
      }
    }
  });
});

// Search endpoint
app.post('/api/v1/search', async (req, res) => {
  console.log('🚀 Search request received:', req.body);
  
  const { query, filters, sessionId } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Call real query-processor for AI analysis
    console.log('🤖 Calling real AI query-processor...');
    let aiResponse;
    try {
      aiResponse = await axios.post('http://localhost:8081/api/v1/analyze-intent', {
        query,
        userContext: {}
      });
      console.log('✅ AI analysis complete:', aiResponse.data.intent.intentType);
    } catch (aiError) {
      console.log('⚠️ AI service unavailable, using fallback analysis');
      aiResponse = {
        data: {
          intent: { intentType: 'product_search', confidence: 0.8 },
          clarification: { needsClarification: false, questions: [] }
        }
      };
    }
    
    // Determine processing delay based on AI analysis
    const requiredAgents = determineRequiredAgents(query);
    const delay = requiredAgents.length * 200;
    
    console.log(`⏱️ Processing with ${requiredAgents.length} agents (${delay}ms delay)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Create mock results
    const candidates = mockProducts.map((product, index) => ({
      product,
      similarityScore: Math.max(0.7, 1 - index * 0.1),
      matchingAttributes: ['color', 'category', 'occasion'],
      matchReason: `Matches your search for "${query}"`
    }));

    const bundles = [
      {
        bundleId: 'bundle_001',
        bundleName: `${query} Look`,
        items: candidates.slice(0, 3),
        coherenceScore: 0.92,
        styleTheme: 'modern',
        description: `A perfect ${query} look featuring curated items`,
        totalPrice: 245.98,
        currency: 'USD',
        categoryBreakdown: ['clothing', 'accessories'],
        styleCoherence: 0.88,
        colorHarmony: 0.85,
        priceRange: 'premium'
      }
    ];

    const rankedLooks = bundles.map((bundle, index) => ({
      look: bundle,
      finalScore: Math.max(0.8, 1 - index * 0.1),
      scoreBreakdown: {
        coherence: bundle.coherenceScore,
        style: 0.85,
        price: 0.80,
        quality: 0.88,
        trend: 0.75,
        user_preference: 0.82
      },
      rank: index + 1,
      confidence: 0.89,
      recommendationReason: `Excellent ${bundle.styleTheme} style with great coherence and value`,
      userPreferenceMatch: 0.82,
      trendAlignment: 0.75
    }));

    const response = {
      sessionId: sessionId || `session_${Date.now()}`,
      query,
      results: rankedLooks,
      executionTrace: createMockExecutionTrace(query),
      questions: aiResponse.data.clarification.needsClarification ? aiResponse.data.clarification.questions : [],
      totalResults: rankedLooks.length,
      processingTime: requiredAgents.length * 150,
      cost: requiredAgents.length * 0.005,
      service: 'simple-orchestrator-with-real-ai',
      aiAnalysis: {
        intent: aiResponse.data.intent,
        clarification: aiResponse.data.clarification
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ Search completed:', {
      query,
      resultsCount: rankedLooks.length,
      agentsUsed: requiredAgents.length,
      processingTime: response.processingTime
    });

    res.json(response);
    
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message,
      service: 'simple-orchestrator'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Orchestrator running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search API: http://localhost:${PORT}/api/v1/search`);
  console.log('🎯 Ready to handle search requests!');
});

module.exports = app;
