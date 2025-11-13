import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useSearchStore } from '../stores/searchStore';

const CleanSearchInterface: React.FC = () => {
  const { query, loading, executeSearch, clearSearch, setQuery } = useSearchStore();
  const [localQuery, setLocalQuery] = useState(query);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Generate suggestions only when query matches
  const generateSuggestions = (query: string) => {
    if (!query.trim() || query.length < 2) return [];

    const baseSuggestions = [
      'blue dress for summer party',
      'casual weekend outfit',
      'professional work attire',
      'date night ensemble',
      'winter coat and accessories'
    ];

    const queryLower = query.toLowerCase();
    return baseSuggestions
      .filter(s => s.toLowerCase().includes(queryLower))
      .slice(0, 5);
  };

  const suggestions = generateSuggestions(localQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localQuery.trim()) {
      return;
    }
    
    setShowSuggestions(false);
    setQuery(localQuery);
    await executeSearch();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    setQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
    executeSearch();
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    clearSearch();
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local query with store query
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Hide suggestions when query changes significantly
  useEffect(() => {
    if (localQuery.length < 2) {
      setShowSuggestions(false);
    }
  }, [localQuery]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          <input
            ref={searchInputRef}
            type="search"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              setShowSuggestions(e.target.value.length >= 2);
            }}
            onFocus={() => {
              if (localQuery.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            placeholder="What are you looking for?"
            className="w-full pl-14 pr-32 py-4 text-lg rounded-2xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            disabled={loading}
          />
          
          {localQuery && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="absolute right-24 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <X className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}
          
          <motion.button
            type="submit"
            disabled={!localQuery.trim() || loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-blue-700"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </motion.button>
        </div>

        {/* Suggestions dropdown - only show when there are matching suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden"
            >
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span>{suggestion}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
};

export default CleanSearchInterface;




