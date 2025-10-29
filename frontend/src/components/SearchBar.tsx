import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { useSearchStore } from '../stores/searchStore';
import { useUIStore } from '../stores/uiStore';
import { SearchFilters } from '../types';

const SearchBar: React.FC = () => {
  const { query, filters, loading, setQuery, setFilters, executeSearch } = useSearchStore();
  const { questionsPanelOpen, toggleQuestionsPanel } = useUIStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search execution
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localQuery !== query) {
        setQuery(localQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localQuery, query, setQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() && !loading) {
      executeSearch();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      searchInputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setLocalQuery('');
    setQuery('');
    searchInputRef.current?.focus();
  };

  const updateFilter = (key: keyof SearchFilters, value: string | number | undefined) => {
    const newFilters = { ...filters };
    if (value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Main search form */}
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className="relative"
      >
        {/* Search input with Apple-style design */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-apple-secondary" />
          <input
            ref={searchInputRef}
            type="search"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(false)} // Don't auto-expand on focus
            placeholder="What are you looking for? Try 'blue dress for summer party'"
            className="w-full px-12 py-4 text-lg rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm text-apple-accent placeholder-apple-secondary transition-all duration-300 focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/20 focus:bg-white focus:shadow-lg"
            disabled={loading}
          />
          
          {/* Clear button */}
          {localQuery && (
            <motion.button
              type="button"
              onClick={clearSearch}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-apple-secondary" />
            </motion.button>
          )}
          
          {/* Search button - Apple style */}
          <motion.button
            type="submit"
            disabled={!localQuery.trim() || loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-apple-primary text-white px-6 py-2 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            whileHover={{ scale: 1.02, shadow: "0 8px 25px rgba(0, 113, 227, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </motion.button>
        </div>
        
        {/* Filters button - separate from search input */}
        <motion.button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mt-3 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
            activeFiltersCount > 0 
              ? 'bg-apple-primary text-white shadow-lg' 
              : 'bg-gray-100 text-apple-secondary hover:bg-gray-200'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Filter className="w-4 h-4 inline mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-white text-apple-primary text-xs rounded-full px-2 py-0.5">
              {activeFiltersCount}
            </span>
          )}
        </motion.button>
      </motion.form>

      {/* Expanded filters panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.1, 0.25, 1], // Apple's easing curve
              scale: { duration: 0.3 }
            }}
            className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-apple-lg z-20 border border-gray-100/50"
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-apple-accent">Refine your search</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="btn-ghost p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-2">
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="input-apple py-2"
                >
                  <option value="">Any category</option>
                  <option value="clothing">Clothing</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessories">Accessories</option>
                  <option value="bags">Bags</option>
                  <option value="jewelry">Jewelry</option>
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={filters.brand || ''}
                  onChange={(e) => updateFilter('brand', e.target.value)}
                  placeholder="Any brand"
                  className="input-apple py-2"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-2">
                  Color
                </label>
                <select
                  value={filters.color || ''}
                  onChange={(e) => updateFilter('color', e.target.value)}
                  className="input-apple py-2"
                >
                  <option value="">Any color</option>
                  <option value="black">Black</option>
                  <option value="white">White</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="pink">Pink</option>
                  <option value="purple">Purple</option>
                  <option value="brown">Brown</option>
                  <option value="gray">Gray</option>
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-2">
                  Size
                </label>
                <select
                  value={filters.size || ''}
                  onChange={(e) => updateFilter('size', e.target.value)}
                  className="input-apple py-2"
                >
                  <option value="">Any size</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              {/* Price range */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="No limit"
                  className="input-apple py-2"
                  min="0"
                />
              </div>

              {/* Occasion */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-2">
                  Occasion
                </label>
                <select
                  value={filters.occasion || ''}
                  onChange={(e) => updateFilter('occasion', e.target.value)}
                  className="input-apple py-2"
                >
                  <option value="">Any occasion</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="party">Party</option>
                  <option value="work">Work</option>
                  <option value="wedding">Wedding</option>
                  <option value="vacation">Vacation</option>
                </select>
              </div>
            </div>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setFilters({})}
                  className="text-sm text-apple-secondary hover:text-apple-accent transition-colors"
                >
                  Clear all filters ({activeFiltersCount})
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => {
            setLocalQuery('blue dress for summer party');
            executeSearch();
          }}
          className="text-caption bg-white px-3 py-1 rounded-full border hover:bg-gray-50 transition-colors"
        >
          Summer party dress
        </button>
        <button
          onClick={() => {
            setLocalQuery('casual outfit for weekend');
            executeSearch();
          }}
          className="text-caption bg-white px-3 py-1 rounded-full border hover:bg-gray-50 transition-colors"
        >
          Weekend casual
        </button>
        <button
          onClick={() => {
            setLocalQuery('work attire for meetings');
            executeSearch();
          }}
          className="text-caption bg-white px-3 py-1 rounded-full border hover:bg-gray-50 transition-colors"
        >
          Professional look
        </button>
        <button
          onClick={() => {
            setLocalQuery('date night outfit');
            executeSearch();
          }}
          className="text-caption bg-white px-3 py-1 rounded-full border hover:bg-gray-50 transition-colors"
        >
          Date night
        </button>
      </div>

      {/* Questions panel toggle */}
      {questionsPanelOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={toggleQuestionsPanel}
          className="mt-4 btn-secondary text-sm"
        >
          View clarifying questions
        </motion.button>
      )}
    </div>
  );
};

export default SearchBar;
