// Core types for the Agentic Search frontend

export interface SearchFilters {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  maxPrice?: number;
  minPrice?: number;
  occasion?: string;
  season?: string;
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  sessionId?: string;
}

export interface Product {
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subcategory?: string;
  brand: string;
  color: string;
  size: string;
  material?: string;
  styleTags: string[];
  season?: string;
  gender?: string;
  occasion?: string;
  imageUrl?: string;
  stockStatus: string;
  rating: number;
  popularityScore: number;
}

export interface SearchCandidate {
  product: Product;
  similarityScore: number;
  matchingAttributes: string[];
  matchReason: string;
}

export interface LookBundle {
  bundleId: string;
  bundleName: string;
  items: SearchCandidate[];
  coherenceScore: number;
  styleTheme: string;
  description: string;
  totalPrice: number;
  currency: string;
  categoryBreakdown: string[];
  styleCoherence: number;
  colorHarmony: number;
  priceRange: string;
}

export interface RankedLook {
  look: LookBundle;
  finalScore: number;
  scoreBreakdown: Record<string, number>;
  rank: number;
  confidence: number;
  recommendationReason: string;
  userPreferenceMatch: number;
  trendAlignment: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'single-choice' | 'multi-choice' | 'range' | 'text';
  options?: string[];
  required: boolean;
  answered: boolean;
  answer?: string | string[] | number;
}

export interface AgentExecutionStep {
  agentName: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
}

export interface AgentExecutionTrace {
  sessionId: string;
  query: string;
  steps: AgentExecutionStep[];
  currentStep?: number;
  isComplete: boolean;
  totalDuration?: number;
}

export interface SearchResponse {
  sessionId: string;
  query: string;
  results: RankedLook[];
  executionTrace: AgentExecutionTrace;
  questions?: Question[];
  totalResults: number;
  processingTime: number;
  cost?: number;
}

export interface Feedback {
  bundleId: string;
  rating: 'thumbs-up' | 'thumbs-down';
  reason?: string;
  details?: string;
  timestamp: number;
}

export interface ABTestComparison {
  datasetA: string;
  datasetB: string;
  resultsA: RankedLook[];
  resultsB: RankedLook[];
  comparisonMetrics: {
    relevanceScore: number;
    diversityScore: number;
    coherenceScore: number;
  };
}

// Agent-specific types
export interface AgentConfig {
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  personality: 'analytical' | 'creative' | 'wise' | 'protective' | 'curious';
}

export interface AvatarConfig {
  agentName: string;
  avatarImage: string;
  primaryColor: string;
  secondaryColor: string;
  position: { x: number; y: number; z: number };
  personality: 'analytical' | 'creative' | 'wise' | 'protective' | 'curious';
}

// UI State types
export type VisualizationMode = 'technical' | 'sci-fi';

export interface UIState {
  visualizationMode: VisualizationMode;
  graphExpanded: boolean;
  questionsPanelOpen: boolean;
  abTestingActive: boolean;
  sidebarOpen: boolean;
  currentLookIndex: number;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: RankedLook[];
  executionTrace?: AgentExecutionTrace;
  loading: boolean;
  error: string | null;
  sessionId?: string;
  questions: Question[];
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  service: string;
  version: string;
  components?: Record<string, string>;
}

export interface ServiceStatus {
  serviceName: string;
  status: 'ready' | 'loading' | 'error';
  description: string;
  capabilities: string[];
}

// Animation and transition types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

// Event types for real-time updates
export interface AgentUpdateEvent {
  type: 'agent-start' | 'agent-complete' | 'agent-error' | 'trace-update';
  agentName: string;
  data?: any;
  timestamp: number;
}

export interface SearchEvent {
  type: 'search-start' | 'search-progress' | 'search-complete' | 'search-error';
  data?: any;
  timestamp: number;
}

