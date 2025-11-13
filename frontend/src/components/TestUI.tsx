import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface AgentExecutionTrace {
  agentName: string;
  action: string;
  startTime: number;
  endTime: number;
  executionTimeMs: number;
  status: 'success' | 'error' | 'timeout';
  inputSummary: string;
  outputSummary: string;
  metadata: Record<string, string>;
}

interface Product {
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  color: string;
  imageUrl: string;
}

interface SearchCandidate {
  product: Product;
  similarityScore: number;
  matchingAttributes: string[];
  matchReason: string;
}

interface RankedLook {
  bundleId: string;
  bundleName: string;
  candidates: SearchCandidate[];
  finalScore: number;
  rankingReason: string;
}

interface SearchResponse {
  uiResponse: {
    results: RankedLook[];
    executionTraces: AgentExecutionTrace[];
    queryId: string;
    totalExecutionTimeMs: number;
    metadata: {
      totalResults: string;
      searchType: string;
      agentCount: string;
      routingStrategy?: string;
    };
    success: boolean;
    errorMessage: string | null;
  };
  routingStrategy?: string;
}

// Get orchestrator URL from environment or use default
// Default to Full Orchestrator (port 8080) if available, otherwise Simple Orchestrator (port 3003)
const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'http://localhost:3003');

const TestUI: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const apiResponse = await axios.post<SearchResponse>(`${ORCHESTRATOR_URL}/api/v1/search`, {
        query: query.trim(),
        maxResults: 10,
      });

      setResponse(apiResponse.data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  // Extract all unique products from results
  const getAllProducts = (): Product[] => {
    if (!response?.uiResponse?.results) return [];
    
    const products: Product[] = [];
    const seenSkus = new Set<string>();
    
    response.uiResponse.results.forEach((look) => {
      look.candidates?.forEach((candidate) => {
        if (!seenSkus.has(candidate.product.sku)) {
          products.push(candidate.product);
          seenSkus.add(candidate.product.sku);
        }
      });
    });
    
    return products;
  };

  const products = getAllProducts();
  const traces = response?.uiResponse?.executionTraces || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Test UI</h1>
          <p className="text-gray-600">Test search queries and view agent execution details</p>
        </div>

        {/* Search Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your search query (e.g., 'blue dress', 'summer dress for beach wedding')"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                'Search'
              )}
            </button>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              <strong>Error:</strong> {error}
            </motion.div>
          )}

          {response && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Query ID:</strong> {response.uiResponse.queryId}
                </div>
                <div>
                  <strong>Total Time:</strong> {response.uiResponse.totalExecutionTimeMs}ms
                </div>
                <div>
                  <strong>Routing Strategy:</strong> {response.routingStrategy || response.uiResponse.metadata.routingStrategy || 'N/A'}
                </div>
                <div>
                  <strong>Agents Used:</strong> {response.uiResponse.metadata.agentCount}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {response && (
          <div className="space-y-6">
            {/* Matching Products */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Matching Products ({products.length})
              </h2>
              
              {products.length === 0 ? (
                <p className="text-gray-600">No products found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <motion.div
                      key={product.sku}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">No Image</div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.color}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <div>SKU: {product.sku}</div>
                        <div>Category: {product.category}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Agent Execution Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Agent Execution Details ({traces.length} agents)
              </h2>
              
              {traces.length === 0 ? (
                <p className="text-gray-600">No agent execution traces available</p>
              ) : (
                <div className="space-y-4">
                  {traces.map((trace, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              trace.status === 'success'
                                ? 'bg-green-500'
                                : trace.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                          />
                          <h3 className="text-lg font-semibold text-gray-900">{trace.agentName}</h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {trace.action}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {trace.executionTimeMs}ms
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Input */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Input
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {trace.inputSummary || 'N/A'}
                          </div>
                        </div>

                        {/* Output */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs font-semibold text-blue-700 uppercase mb-2">
                            Output
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {trace.outputSummary || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      {trace.metadata && Object.keys(trace.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Metadata
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(trace.metadata).map(([key, value]) => (
                              <span
                                key={key}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                              >
                                <strong>{key}:</strong> {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            trace.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : trace.status === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {trace.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !response && !error && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to test</h3>
            <p className="text-gray-600">
              Enter a search query above to see matching products and agent execution details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestUI;

