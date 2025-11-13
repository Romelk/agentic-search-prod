#!/usr/bin/env node
/**
 * Mock Response Pipeline Service (Weave, Judge, Sage, Aegis)
 * Temporary Node.js implementation to replace Java service
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8083;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mock-response-pipeline',
    timestamp: new Date().toISOString()
  });
});

// Create bundles endpoint (for orchestrator)
app.post('/api/v1/create-bundles', (req, res) => {
  console.log(`[Mock Weave] Creating bundles from candidates:`, req.body);
  
  const candidates = (req.body && (req.body.searchCandidates || req.body.candidates)) || [];
  
  if (candidates.length === 0) {
    return res.json({ bundles: [] });
  }

  // Create mock bundles
  const bundles = candidates.slice(0, 3).map((candidate, index) => {
    // Handle both SearchCandidate format (has product property) and metadata format
    let productName, price, currency, styleTags, occasion, season;
    
    if (candidate.product && candidate.product.name) {
      // SearchCandidate format
      productName = candidate.product.name;
      price = candidate.product.price;
      currency = candidate.product.currency;
      styleTags = candidate.product.styleTags;
      occasion = candidate.product.occasion;
      season = candidate.product.season;
    } else {
      // Metadata format
      const metadata = candidate.metadata || candidate;
      productName = metadata.name || 'Product';
      price = metadata.price;
      currency = metadata.currency;
      styleTags = metadata.style_tags;
      occasion = metadata.occasion;
      season = metadata.season;
    }
    
    return {
      id: `bundle-${index + 1}`,
      name: `${productName} Look`,
      description: `Complete outfit featuring ${productName}`,
      products: [candidate],
      totalPrice: price,
      currency: currency || 'USD',
      style: styleTags,
      occasion: occasion,
      season: season,
      confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
    };
  });

  console.log(`[Mock Weave] Created ${bundles.length} bundles`);
  res.json({ bundles });
});

app.post('/api/v1/pipeline/bundles', (req, res) => {
  console.log(`[Mock Weave] (pipeline) Creating bundles:`, req.body);

  const {
    searchCandidates = [],
    styleThemes = [],
    maxBundles = 5
  } = req.body || {};

  if (!searchCandidates.length) {
    return res.json({ bundles: [] });
  }

  const themes = styleThemes.length > 0 ? styleThemes : ['casual', 'formal', 'mixed'];

  const bundles = searchCandidates.slice(0, maxBundles).map((candidate, index) => {
    const productName = candidate?.product?.name || `Product ${index + 1}`;
    return {
      bundle_id: `bundle-${index + 1}`,
      bundle_name: `${productName} Look`,
      items: [candidate],
      coherence_score: candidate?.similarity_score || candidate?.similarityScore || 0.78,
      style_theme: themes[index % themes.length],
      description: `Mock pipeline bundle featuring ${productName}`
    };
  });

  res.json({
    bundles,
    count: bundles.length
  });
});

// Weave Composer - Create product bundles
app.post('/api/v1/weave', (req, res) => {
  console.log(`[Mock Weave] Creating bundles from candidates:`, req.body);
  
  const { candidates = [] } = req.body;
  
  if (candidates.length === 0) {
    return res.json({ bundles: [] });
  }

  // Create mock bundles
  const bundles = candidates.slice(0, 3).map((candidate, index) => ({
    id: `bundle-${index + 1}`,
    name: `${candidate.metadata.name} Look`,
    description: `Complete outfit featuring ${candidate.metadata.name}`,
    products: [candidate],
    totalPrice: candidate.metadata.price,
    currency: candidate.metadata.currency,
    style: candidate.metadata.style_tags,
    occasion: candidate.metadata.occasion,
    season: candidate.metadata.season,
    confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
  }));

  console.log(`[Mock Weave] Created ${bundles.length} bundles`);
  res.json({ bundles });
});

// Rank looks endpoint (for orchestrator)
app.post('/api/v1/rank-looks', (req, res) => {
  console.log(`[Mock Judge] Ranking bundles:`, req.body);
  
  const bundles = (req.body && (req.body.lookBundles || req.body.bundles)) || [];
  
  if (bundles.length === 0) {
    return res.json({ rankedBundles: [] });
  }

  // Mock ranking logic
  const rankedBundles = bundles
    .map(bundle => ({
      ...bundle,
      score: Math.random() * 0.4 + 0.6, // 0.6-1.0
      rankingFactors: {
        styleMatch: Math.random() * 0.3 + 0.7,
        priceValue: Math.random() * 0.3 + 0.7,
        popularity: Math.random() * 0.3 + 0.7,
        availability: Math.random() * 0.3 + 0.7
      }
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`[Mock Judge] Ranked ${rankedBundles.length} bundles`);
  res.json({ rankedBundles });
});

app.post('/api/v1/pipeline/rank', (req, res) => {
  console.log(`[Mock Judge] (pipeline) Ranking bundles:`, req.body);

  const { bundles = [], userPreferences = {}, maxResults = 5 } = req.body || {};
  if (!bundles.length) {
    return res.json({ rankedLooks: [] });
  }

  const rankedLooks = bundles.slice(0, maxResults).map((bundle, index) => ({
    look: bundle,
    finalScore: bundle?.coherence_score || bundle?.coherenceScore || 0.8,
    scoreBreakdown: {
      coherence: bundle?.coherence_score || bundle?.coherenceScore || 0.8,
      style: 0.72,
      price: 0.7,
      trend: Object.keys(userPreferences || {}).length > 0 ? 0.75 : 0.65
    },
    rank: index + 1
  }));

  res.json({
    rankedLooks,
    count: rankedLooks.length
  });
});

// Judge Ranker - Score and rank bundles
app.post('/api/v1/judge', (req, res) => {
  console.log(`[Mock Judge] Ranking bundles:`, req.body);
  
  const { bundles = [] } = req.body;
  
  if (bundles.length === 0) {
    return res.json({ rankedBundles: [] });
  }

  // Mock ranking logic
  const rankedBundles = bundles
    .map(bundle => ({
      ...bundle,
      score: Math.random() * 0.4 + 0.6, // 0.6-1.0
      rankingFactors: {
        styleMatch: Math.random() * 0.3 + 0.7,
        priceValue: Math.random() * 0.3 + 0.7,
        popularity: Math.random() * 0.3 + 0.7,
        availability: Math.random() * 0.3 + 0.7
      }
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`[Mock Judge] Ranked ${rankedBundles.length} bundles`);
  res.json({ rankedBundles });
});

// Generate response endpoint (for orchestrator)
app.post('/api/v1/generate-response', (req, res) => {
  console.log(`[Mock Sage] Generating response:`, JSON.stringify(req.body, null, 2));
  
  const ranked = (req.body && (req.body.rankedLooks || req.body.rankedBundles)) || [];
  const query = (req.body && (req.body.query || '')) || '';
  
  console.log(`[Mock Sage] Extracted ranked:`, ranked);
  console.log(`[Mock Sage] Ranked length:`, ranked ? ranked.length : 'undefined');
  
  if (!ranked || ranked.length === 0) {
    console.log(`[Mock Sage] No ranked items, returning empty response`);
    return res.json({ 
      results: [],
      executionTraces: [],
      queryId: req.body.requestId || 'unknown',
      totalExecutionTimeMs: 0,
      metadata: {},
      success: false,
      errorMessage: 'No ranked items provided'
    });
  }

  const explanations = ranked.map((bundle, index) => ({
    bundleId: bundle.id,
    explanation: `This ${bundle.style || 'stylish'} look is perfect for ${bundle.occasion || 'various'} occasions. ${bundle.products && bundle.products[0] && bundle.products[0].metadata ? `The ${bundle.products[0].metadata.material || 'quality'} material ensures comfort, while the ${bundle.products[0].metadata.color || 'beautiful'} color adds a stylish touch.` : 'The quality materials ensure comfort and style.'} Great value at $${bundle.totalPrice || '0'}.`,
    whyItWorks: [
      `Color coordination matches your style preferences`,
      `Material is perfect for ${bundle.season} weather`,
      `Price point offers excellent value`,
      `Brand reputation ensures quality`
    ],
    stylingTips: [
      `Pair with neutral accessories`,
      `Perfect for ${bundle.occasion} events`,
      `Easy to dress up or down`
    ]
  }));

  const response = `I found ${ranked.length} great options for "${query}". Here are my top recommendations:`;

  console.log(`[Mock Sage] Generated response with ${explanations.length} explanations`);
  res.json({ 
    results: ranked.map((bundle, index) => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      products: bundle.products,
      totalPrice: bundle.totalPrice,
      currency: bundle.currency,
      style: bundle.style,
      occasion: bundle.occasion,
      season: bundle.season,
      confidence: bundle.confidence,
      explanation: explanations[index]?.explanation || '',
      whyItWorks: explanations[index]?.whyItWorks || [],
      stylingTips: explanations[index]?.stylingTips || []
    })),
    executionTraces: [],
    queryId: req.body.requestId || 'mock-query-id',
    totalExecutionTimeMs: Math.random() * 500 + 200,
    metadata: {
      totalResults: ranked.length,
      searchType: 'semantic',
      agentCount: 9
    },
    success: true,
    errorMessage: null
  });
});

app.post('/api/v1/pipeline/validate', (req, res) => {
  console.log(`[Mock Aegis] (pipeline) Validating looks:`, req.body);

  const { rankedLooks = [] } = req.body || {};
  if (!rankedLooks.length) {
    return res.json({
      approvedLooks: [],
      approvedCount: 0,
      rejectedCount: 0
    });
  }

  const approvedLooks = rankedLooks.filter((_, index) => index % 3 !== 0);
  res.json({
    approvedLooks,
    approvedCount: approvedLooks.length,
    rejectedCount: rankedLooks.length - approvedLooks.length
  });
});

app.post('/api/v1/validate-looks', (req, res) => {
  console.log(`[Mock Aegis] Validating looks (legacy):`, req.body);

  const { rankedLooks = [] } = req.body || {};
  const approvedLooks = rankedLooks.filter((_, index) => index % 2 === 0);

  res.json({
    approvedLooks,
    approvedCount: approvedLooks.length,
    rejectedCount: rankedLooks.length - approvedLooks.length
  });
});

app.post('/api/v1/pipeline/explain', (req, res) => {
  console.log(`[Mock Sage] (pipeline) Explaining looks:`, req.body);

  const { rankedLooks = [], userQuery = '' } = req.body || {};
  const explainedLooks = rankedLooks.map((look, index) => ({
    look: look.look || look,
    finalScore: look.finalScore || 0.8,
    scoreBreakdown: look.scoreBreakdown || { coherence: 0.8 },
    rank: look.rank || index + 1,
    explanation: `Mock explanation for "${userQuery}" highlighting ${look.look?.bundleName || 'this look'}.`
  }));

  res.json({
    explainedLooks,
    count: explainedLooks.length,
    success: true,
    metadata: {
      searchType: 'semantic-mock'
    }
  });
});

// Sage Explainer - Generate explanations
app.post('/api/v1/sage', (req, res) => {
  console.log(`[Mock Sage] Generating explanations:`, req.body);
  
  const { rankedBundles = [] } = req.body;
  
  if (rankedBundles.length === 0) {
    return res.json({ explanations: [] });
  }

  const explanations = rankedBundles.map((bundle, index) => ({
    bundleId: bundle.id,
    explanation: `This ${bundle.style} look is perfect for ${bundle.occasion} occasions. The ${bundle.products[0].metadata.material} material ensures comfort, while the ${bundle.products[0].metadata.color} color adds a stylish touch. Great value at $${bundle.totalPrice}.`,
    whyItWorks: [
      `Color coordination matches your style preferences`,
      `Material is perfect for ${bundle.season} weather`,
      `Price point offers excellent value`,
      `Brand reputation ensures quality`
    ],
    stylingTips: [
      `Pair with neutral accessories`,
      `Perfect for ${bundle.occasion} events`,
      `Easy to dress up or down`
    ]
  }));

  console.log(`[Mock Sage] Generated ${explanations.length} explanations`);
  res.json({ explanations });
});

// Aegis Guardian - Validate safety and content
app.post('/api/v1/aegis', (req, res) => {
  console.log(`[Mock Aegis] Validating content:`, req.body);
  
  const { rankedBundles = [], explanations = [] } = req.body;
  
  const validationResults = {
    approved: true,
    warnings: [],
    errors: [],
    safetyScore: 0.95,
    inclusivityScore: 0.92,
    contentPolicyCompliance: true
  };

  // Mock validation - always approve for now
  console.log(`[Mock Aegis] Validation complete - approved: ${validationResults.approved}`);
  res.json(validationResults);
});

// Combined pipeline endpoint
app.post('/api/v1/pipeline', (req, res) => {
  console.log(`[Mock Pipeline] Processing complete pipeline:`, req.body);
  
  const { candidates = [] } = req.body;
  
  try {
    // Step 1: Weave - Create bundles
    const weaveResponse = { bundles: candidates.slice(0, 3).map((candidate, index) => ({
      id: `bundle-${index + 1}`,
      name: `${candidate.metadata.name} Look`,
      description: `Complete outfit featuring ${candidate.metadata.name}`,
      products: [candidate],
      totalPrice: candidate.metadata.price,
      currency: candidate.metadata.currency,
      style: candidate.metadata.style_tags,
      occasion: candidate.metadata.occasion,
      season: candidate.metadata.season,
      confidence: Math.random() * 0.3 + 0.7
    })) };

    // Step 2: Judge - Rank bundles
    const judgeResponse = { rankedBundles: weaveResponse.bundles
      .map(bundle => ({
        ...bundle,
        score: Math.random() * 0.4 + 0.6,
        rankingFactors: {
          styleMatch: Math.random() * 0.3 + 0.7,
          priceValue: Math.random() * 0.3 + 0.7,
          popularity: Math.random() * 0.3 + 0.7,
          availability: Math.random() * 0.3 + 0.7
        }
      }))
      .sort((a, b) => b.score - a.score) };

    // Step 3: Sage - Generate explanations
    const sageResponse = { explanations: judgeResponse.rankedBundles.map((bundle, index) => ({
      bundleId: bundle.id,
      explanation: `This ${bundle.style || 'stylish'} look is perfect for ${bundle.occasion || 'various'} occasions. ${bundle.products && bundle.products[0] && bundle.products[0].metadata ? `The ${bundle.products[0].metadata.material || 'quality'} material ensures comfort, while the ${bundle.products[0].metadata.color || 'beautiful'} color adds a stylish touch.` : 'The quality materials ensure comfort and style.'} Great value at $${bundle.totalPrice || '0'}.`,
      whyItWorks: [
        `Color coordination matches your style preferences`,
        `Material is perfect for ${bundle.season} weather`,
        `Price point offers excellent value`,
        `Brand reputation ensures quality`
      ],
      stylingTips: [
        `Pair with neutral accessories`,
        `Perfect for ${bundle.occasion} events`,
        `Easy to dress up or down`
      ]
    })) };

    // Step 4: Aegis - Validate
    const aegisResponse = {
      approved: true,
      warnings: [],
      errors: [],
      safetyScore: 0.95,
      inclusivityScore: 0.92,
      contentPolicyCompliance: true
    };

    const result = {
      success: true,
      bundles: judgeResponse.rankedBundles,
      explanations: sageResponse.explanations,
      validation: aegisResponse,
      processingTime: Math.random() * 200 + 100
    };

    console.log(`[Mock Pipeline] Pipeline complete - ${result.bundles.length} bundles processed`);
    res.json(result);

  } catch (error) {
    console.error(`[Mock Pipeline] Error:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      bundles: [],
      explanations: []
    });
  }
});

// Cost metrics endpoint
app.get('/api/v1/cost/metrics', (req, res) => {
  res.json({
    service: 'mock-response-pipeline',
    dailySpend: 0.00,
    dailyQueries: 0,
    totalSpend: 0.00,
    lastReset: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎭 Mock Response Pipeline service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 Weave API: http://localhost:${PORT}/api/v1/weave`);
  console.log(`⚖️  Judge API: http://localhost:${PORT}/api/v1/judge`);
  console.log(`🧠 Sage API: http://localhost:${PORT}/api/v1/sage`);
  console.log(`🛡️  Aegis API: http://localhost:${PORT}/api/v1/aegis`);
  console.log(`🔄 Pipeline API: http://localhost:${PORT}/api/v1/pipeline`);
  console.log(`💰 Cost metrics: http://localhost:${PORT}/api/v1/cost/metrics`);
});

module.exports = app;
