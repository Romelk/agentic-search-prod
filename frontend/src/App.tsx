import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from './stores/searchStore';
import CleanSearchInterface from './components/CleanSearchInterface';
import OptionalFilters from './components/OptionalFilters';
import CleanResultsView from './components/CleanResultsView';
import TestUI from './components/TestUI';

function App() {
  const { 
    loading, 
    error, 
    hasResults, 
    questions,
    query,
    executeSearch,
    setFilters,
    clearSearch 
  } = useSearchStore();
  
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<{ color?: string; budget?: string; occasion?: string }>({});
  const [showTestUI, setShowTestUI] = useState(false);

  // Show filters if questions suggest we need clarification
  useEffect(() => {
    const needsClarification = questions.some(q => 
      q.questionType === 'color' || 
      q.questionType === 'budget' || 
      q.questionType === 'occasion'
    );
    setShowFilters(needsClarification);
  }, [questions]);

  const handleFiltersChange = (filters: { color?: string; budget?: string; occasion?: string }) => {
    setCurrentFilters(filters);
    
    // Convert filters to search store format
    const searchFilters: any = {};
    if (filters.color) searchFilters.color = filters.color.toLowerCase();
    if (filters.budget) {
      // Parse budget range
      const budgetMap: Record<string, { min?: number; max?: number }> = {
        'Under $50': { max: 50 },
        '$50 - $100': { min: 50, max: 100 },
        '$100 - $200': { min: 100, max: 200 },
        '$200 - $500': { min: 200, max: 500 },
        '$500+': { min: 500 },
      };
      const budgetRange = budgetMap[filters.budget];
      if (budgetRange) {
        searchFilters.minPrice = budgetRange.min;
        searchFilters.maxPrice = budgetRange.max;
      }
    }
    if (filters.occasion) searchFilters.occasion = filters.occasion.toLowerCase();
    
    setFilters(searchFilters);
    
    // Re-execute search with new filters if we have a query
    if (query.trim()) {
      // Use setTimeout to avoid race condition
      setTimeout(() => {
        executeSearch();
      }, 100);
    }
  };

  // Show Test UI if toggled
  if (showTestUI) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Toggle button */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowTestUI(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Main App
          </button>
        </div>
        <TestUI />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test UI Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowTestUI(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Test UI
        </button>
      </div>
      
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">AI agents are working...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={() => useSearchStore.getState().setError(null)}
                className="ml-2 text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Agentic Search</h1>
          <p className="text-gray-600 mt-1">Discover your perfect style with AI-powered search</p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Search section */}
        <section className="mb-12">
          <CleanSearchInterface />
        </section>

        {/* Optional Filters - shown when agents need clarification OR user has searched */}
        <AnimatePresence>
          {(showFilters || (query && !hasResults)) && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-12"
            >
              <OptionalFilters onFiltersChange={handleFiltersChange} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Results section */}
        {hasResults && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CleanResultsView />
          </motion.section>
        )}

        {/* Empty state */}
        {!loading && !hasResults && !error && query && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center py-24"
          >
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to discover your style?</h3>
              <p className="text-gray-600">
                Start by typing what you're looking for. Our AI agents will work together to find the perfect look for you.
              </p>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}

export default App;
