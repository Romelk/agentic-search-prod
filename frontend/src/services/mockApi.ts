// Mock API service for development and testing
import { SearchResponse, RankedLook, LookBundle, SearchCandidate, Product, Question, AgentExecutionTrace } from '../types';

// Mock products
const mockProducts: Product[] = [
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
  },
  {
    sku: 'SKU004',
    name: 'Casual Denim Jacket',
    description: 'Comfortable denim jacket perfect for casual outings',
    price: 65.50,
    currency: 'USD',
    category: 'clothing',
    subcategory: 'jackets',
    brand: 'DenimCo',
    color: 'blue',
    size: 'M',
    material: 'denim',
    styleTags: ['casual', 'comfortable', 'versatile'],
    season: 'spring',
    gender: 'unisex',
    occasion: 'casual',
    imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300',
    stockStatus: 'in_stock',
    rating: 4.2,
    popularityScore: 0.8
  },
  {
    sku: 'SKU005',
    name: 'Gold Statement Necklace',
    description: 'Bold gold necklace that makes a statement',
    price: 35.99,
    currency: 'USD',
    category: 'accessories',
    subcategory: 'jewelry',
    brand: 'GoldLuxe',
    color: 'gold',
    size: 'one-size',
    material: 'gold-plated',
    styleTags: ['statement', 'bold', 'elegant'],
    season: 'all',
    gender: 'female',
    occasion: 'party',
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300',
    stockStatus: 'in_stock',
    rating: 4.4,
    popularityScore: 0.6
  }
];

// Mock questions
const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: "What's your budget range for this look?",
    type: 'single-choice',
    options: ['Under $100', '$100-200', '$200-300', '$300+', 'No specific budget'],
    required: false,
    answered: false
  },
  {
    id: 'q2',
    text: 'What occasion are you shopping for?',
    type: 'single-choice',
    options: ['Party/Night out', 'Work/Professional', 'Casual/Weekend', 'Date night', 'Wedding/Formal'],
    required: false,
    answered: false
  },
  {
    id: 'q3',
    text: 'What colors do you prefer?',
    type: 'multi-choice',
    options: ['Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Neutral tones'],
    required: false,
    answered: false
  }
];

// Smart agent routing based on query complexity
const determineRequiredAgents = (query: string): string[] => {
  const queryLower = query.toLowerCase();
  
  // Simple product search (1-2 words, specific items)
  if (queryLower.match(/^(blue|red|black|white|green|pink|yellow|purple|orange|brown|gray|grey)\s+(dress|shirt|pants|shoes|bag|jacket|sweater|blouse|skirt|jeans|coat|hat|scarf|belt|watch|necklace|ring|earrings)$/)) {
    return ['Ivy Interpreter', 'Kiko Curator', 'Judge Ranker'];
  }
  
  // Specific brand/item search
  if (queryLower.match(/^(nike|adidas|gucci|chanel|louis vuitton|zara|h&m|uniqlo|levi's|calvin klein)/)) {
    return ['Ivy Interpreter', 'Kiko Curator', 'Judge Ranker'];
  }
  
  // Occasion-based search (needs style context)
  if (queryLower.match(/(party|wedding|work|casual|formal|date|gym|beach|travel|meeting)/)) {
    return ['Ivy Interpreter', 'Gale ContextKeeper', 'Kiko Curator', 'Weave Composer', 'Judge Ranker'];
  }
  
  // Complex style/outfit requests
  if (queryLower.match(/(outfit|ensemble|look|style|coordinated|matching|complete)/)) {
    return ['Ivy Interpreter', 'Nori Clarifier', 'Gale ContextKeeper', 'Vogue TrendWhisperer', 'Kiko Curator', 'Weave Composer', 'Judge Ranker', 'Sage Explainer'];
  }
  
  // Very complex requests (full agent pipeline)
  if (queryLower.match(/(help me|suggest|recommend|advice|what should|how to|styling|fashion advice)/)) {
    return ['Ivy Interpreter', 'Nori Clarifier', 'Gale ContextKeeper', 'Vogue TrendWhisperer', 'Kiko Curator', 'Weave Composer', 'Judge Ranker', 'Sage Explainer', 'Aegis Guardian'];
  }
  
  // Default: moderate complexity
  return ['Ivy Interpreter', 'Gale ContextKeeper', 'Kiko Curator', 'Judge Ranker', 'Sage Explainer'];
};

// Mock agent execution trace with smart routing
const createMockExecutionTrace = (query: string): AgentExecutionTrace => {
  const requiredAgents = determineRequiredAgents(query);

  const steps = requiredAgents.map((agentName, index) => ({
    agentName,
    status: 'completed' as const,
    startTime: Date.now() - (requiredAgents.length - index) * 150,
    endTime: Date.now() - (requiredAgents.length - index - 1) * 150,
    duration: 150,
    input: { query, step: index },
    output: { 
      success: true, 
      data: `${agentName} completed successfully`,
      reasoning: getAgentReasoning(agentName, query)
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

// Agent-specific reasoning messages
const getAgentReasoning = (agentName: string, query: string): string => {
  switch (agentName) {
    case 'Ivy Interpreter':
      return `Parsed query: "${query}" - identified as simple product search`;
    case 'Nori Clarifier':
      return 'No clarification needed for this straightforward query';
    case 'Gale ContextKeeper':
      return 'Added current season and location context';
    case 'Vogue TrendWhisperer':
      return 'Applied current fashion trends and seasonal styles';
    case 'Kiko Curator':
      return `Found ${Math.floor(Math.random() * 20) + 5} matching products`;
    case 'Weave Composer':
      return 'Created coordinated look bundles';
    case 'Judge Ranker':
      return 'Ranked results by relevance and style coherence';
    case 'Sage Explainer':
      return 'Generated friendly explanations for recommendations';
    case 'Aegis Guardian':
      return 'Validated content for safety and appropriateness';
    default:
      return 'Processing completed';
  }
};

// Mock search function with smart timing
export const mockSearch = async (query: string, filters?: any): Promise<SearchResponse> => {
  console.log('Mock API called with query:', query, 'filters:', filters);
  
  // Determine complexity and set appropriate delay
  const requiredAgents = determineRequiredAgents(query);
  const delay = requiredAgents.length * 200; // 200ms per agent
  
  console.log(`Starting ${delay}ms delay for ${requiredAgents.length} agents...`);
  console.log('Required agents:', requiredAgents);
  await new Promise(resolve => setTimeout(resolve, delay));
  console.log('Delay completed, generating mock response...');

  // Create mock search candidates
  const candidates: SearchCandidate[] = mockProducts.map((product, index) => ({
    product,
    similarityScore: Math.max(0.7, 1 - index * 0.1),
    matchingAttributes: ['color', 'category', 'occasion'],
    matchReason: `Matches your search for "${query}"`
  }));

  // Create mock look bundles
  const bundles: LookBundle[] = [
    {
      bundleId: 'bundle_001',
      bundleName: 'Summer Party Look',
      items: candidates.slice(0, 3),
      coherenceScore: 0.92,
      styleTheme: 'party',
      description: 'A perfect summer party look featuring an elegant blue dress, sophisticated handbag, and statement necklace.',
      totalPrice: 245.98,
      currency: 'USD',
      categoryBreakdown: ['clothing', 'accessories'],
      styleCoherence: 0.88,
      colorHarmony: 0.85,
      priceRange: 'premium'
    },
    {
      bundleId: 'bundle_002',
      bundleName: 'Professional Ensemble',
      items: candidates.slice(1, 4),
      coherenceScore: 0.87,
      styleTheme: 'work',
      description: 'A professional look perfect for meetings and office settings.',
      totalPrice: 231.49,
      currency: 'USD',
      categoryBreakdown: ['clothing', 'accessories'],
      styleCoherence: 0.90,
      colorHarmony: 0.82,
      priceRange: 'moderate'
    }
  ];

  // Create mock ranked looks
  const rankedLooks: RankedLook[] = bundles.map((bundle, index) => ({
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

  const executionTrace = createMockExecutionTrace(query);
  
  return {
    sessionId: `session_${Date.now()}`,
    query,
    results: rankedLooks,
    executionTrace,
    questions: requiredAgents.length > 5 ? mockQuestions : [], // Only show questions for complex queries
    totalResults: rankedLooks.length,
    processingTime: executionTrace.totalDuration,
    cost: requiredAgents.length * 0.005 // Cost scales with agent usage
  };
};

// Mock feedback function
export const mockSubmitFeedback = async (bundleId: string, feedback: any): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('Mock feedback submitted:', { bundleId, feedback });
  return Promise.resolve();
};

// Mock health check
export const mockHealthCheck = async (): Promise<any> => {
  return {
    status: 'healthy',
    timestamp: Date.now(),
    service: 'mock-api',
    version: '1.0.0'
  };
};
