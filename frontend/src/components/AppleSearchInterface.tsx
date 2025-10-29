import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useSearchStore } from '../stores/searchStore';
import toast from 'react-hot-toast';

const AppleSearchInterface: React.FC = () => {
  const { query, loading, executeSearch, clearSearch, setQuery } = useSearchStore();
  const [localQuery, setLocalQuery] = useState(query);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic search suggestions based on query
  const generateSuggestions = (query: string) => {
    const baseSuggestions = [
      'blue dress for summer party',
      'casual weekend outfit',
      'professional work attire',
      'date night ensemble',
      'winter coat and accessories'
    ];

    if (!query.trim()) return baseSuggestions;

    const queryLower = query.toLowerCase();
    const dynamicSuggestions = [];

    // Extract colors and create suggestions
    const colors = ['blue', 'red', 'black', 'white', 'green', 'pink', 'purple', 'yellow'];
    const foundColors = colors.filter(color => queryLower.includes(color));
    
    // Extract categories
    const categories = ['dress', 'shirt', 'pants', 'shoes', 'jacket', 'skirt', 'blouse'];
    const foundCategories = categories.filter(cat => queryLower.includes(cat));
    
    // Extract occasions
    const occasions = ['party', 'work', 'casual', 'formal', 'date', 'wedding', 'beach'];
    const foundOccasions = occasions.filter(occ => queryLower.includes(occ));

    // Generate dynamic suggestions
    if (foundColors.length > 0 && foundCategories.length > 0) {
      foundColors.forEach(color => {
        foundCategories.forEach(category => {
          foundOccasions.forEach(occasion => {
            dynamicSuggestions.push(`${color} ${category} for ${occasion}`);
          });
          if (foundOccasions.length === 0) {
            dynamicSuggestions.push(`${color} ${category} outfit`);
          }
        });
      });
    }

    // Add seasonal suggestions
    const seasons = ['summer', 'winter', 'spring', 'fall'];
    const foundSeasons = seasons.filter(season => queryLower.includes(season));
    
    if (foundSeasons.length > 0) {
      foundSeasons.forEach(season => {
        dynamicSuggestions.push(`${season} fashion collection`);
        dynamicSuggestions.push(`${season} party outfit`);
      });
    }

    // Combine and deduplicate
    const allSuggestions = [...dynamicSuggestions, ...baseSuggestions];
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s === suggestion)
    );

    return uniqueSuggestions.slice(0, 5); // Limit to 5 suggestions
  };

  const suggestions = generateSuggestions(localQuery);

  // Dynamic quick filters based on query
  const generateQuickFilters = (query: string) => {
    const baseFilters = [
      { label: 'Summer party dress', icon: '👗' },
      { label: 'Weekend casual', icon: '👕' },
      { label: 'Professional look', icon: '👔' },
      { label: 'Date night', icon: '✨' }
    ];

    if (!query.trim()) return baseFilters;

    const queryLower = query.toLowerCase();
    const dynamicFilters = [];

    // Extract colors
    const colors = ['blue', 'red', 'black', 'white', 'green', 'pink', 'purple', 'yellow'];
    const foundColors = colors.filter(color => queryLower.includes(color));
    
    // Extract categories
    const categories = ['dress', 'shirt', 'pants', 'shoes', 'jacket', 'skirt', 'blouse'];
    const foundCategories = categories.filter(cat => queryLower.includes(cat));
    
    // Extract occasions
    const occasions = ['party', 'work', 'casual', 'formal', 'date', 'wedding', 'beach'];
    const foundOccasions = occasions.filter(occ => queryLower.includes(occ));
    
    // Extract seasons
    const seasons = ['summer', 'winter', 'spring', 'fall', 'autumn'];
    const foundSeasons = seasons.filter(season => queryLower.includes(season));

    // Generate dynamic filters based on query content
    if (foundColors.length > 0 && foundCategories.length > 0) {
      foundColors.forEach(color => {
        foundCategories.forEach(category => {
          dynamicFilters.push({
            label: `${color} ${category}`,
            icon: category === 'dress' ? '👗' : 
                  category === 'shirt' ? '👕' : 
                  category === 'pants' ? '👖' : 
                  category === 'shoes' ? '👠' : '👕'
          });
        });
      });
    }

    if (foundOccasions.length > 0) {
      foundOccasions.forEach(occasion => {
        dynamicFilters.push({
          label: `${occasion} outfit`,
          icon: occasion === 'party' ? '🎉' :
                occasion === 'work' ? '👔' :
                occasion === 'casual' ? '👕' :
                occasion === 'formal' ? '🤵' :
                occasion === 'date' ? '💕' : '✨'
        });
      });
    }

    if (foundSeasons.length > 0) {
      foundSeasons.forEach(season => {
        dynamicFilters.push({
          label: `${season} collection`,
          icon: season === 'summer' ? '☀️' :
                season === 'winter' ? '❄️' :
                season === 'spring' ? '🌸' :
                season === 'fall' ? '🍂' : '🍁'
        });
      });
    }

    // Combine dynamic filters with base filters, removing duplicates
    const allFilters = [...dynamicFilters, ...baseFilters];
    const uniqueFilters = allFilters.filter((filter, index, self) => 
      index === self.findIndex(f => f.label === filter.label)
    );

    return uniqueFilters.slice(0, 6); // Limit to 6 filters
  };

  const quickFilters = generateQuickFilters(localQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with query:', localQuery);
    
    if (!localQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    try {
      // Sync local query with store
      console.log('Setting query in store:', localQuery);
      setQuery(localQuery);
      
      // Execute search
      console.log('Executing search...');
      await executeSearch();
      
      console.log('Search completed successfully');
      console.log('Results in store:', useSearchStore.getState().results);
      console.log('Has results:', useSearchStore.getState().hasResults);
      toast.success('Search completed!', {
        style: {
          background: 'white',
          color: '#1d1d1f',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      });
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    setQuery(suggestion); // Sync with store
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleQuickFilter = (filter: string) => {
    setLocalQuery(filter);
    setQuery(filter); // Sync with store
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Sync local query with store query
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setIsExpanded(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* Apple-style search form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        onSubmit={handleSubmit}
        className="relative"
      >
        {/* Main search container */}
        <div className="relative">
          {/* Search input with Apple styling */}
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-apple-secondary transition-colors group-focus-within:text-apple-primary" />
            
            <input
              ref={searchInputRef}
              type="search"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="What are you looking for? Try 'blue dress for summer party'"
              className="w-full px-16 py-6 text-xl rounded-3xl border-2 border-gray-200 bg-white/90 backdrop-blur-xl text-apple-accent placeholder-apple-secondary transition-all duration-300 focus:border-apple-primary focus:ring-4 focus:ring-apple-primary/10 focus:bg-white focus:shadow-2xl"
              disabled={loading}
            />
            
            {/* Clear button with contained animations */}
            {localQuery && (
              <motion.button
                type="button"
                onClick={clearSearch}
                className="absolute right-20 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
                whileHover={{ 
                  backgroundColor: "rgba(243, 244, 246, 0.8)"
                }}
                whileTap={{ 
                  backgroundColor: "rgba(229, 231, 235, 0.8)"
                }}
                transition={{ duration: 0.1 }}
              >
                <X className="w-5 h-5 text-apple-secondary" />
              </motion.button>
            )}
            
            {/* Search button - Apple style with contained animations */}
            <motion.button
              type="submit"
              disabled={!localQuery.trim() || loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-apple-primary text-white px-8 py-4 rounded-2xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              whileHover={{ 
                boxShadow: "0 12px 40px rgba(0, 113, 227, 0.4)",
                backgroundColor: "#0056b3"
              }}
              whileTap={{ 
                backgroundColor: "#004085"
              }}
              transition={{ duration: 0.2 }}
              style={{ transformOrigin: "center" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Search'
              )}
            </motion.button>
          </div>

          {/* Apple-style suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && localQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/50 z-30 overflow-hidden"
              >
                {suggestions
                  .filter(s => s.toLowerCase().includes(localQuery.toLowerCase()))
                  .map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-6 py-4 text-left text-apple-accent hover:bg-gray-50/80 transition-colors duration-150 flex items-center gap-3"
                      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    >
                      <Search className="w-4 h-4 text-apple-secondary" />
                      <span>{suggestion}</span>
                    </motion.button>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Apple-style quick filters with generous spacing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-4 justify-center mt-12 px-4"
        >
          {quickFilters.map((filter, index) => (
            <motion.button
              key={filter.label}
              onClick={() => handleQuickFilter(filter.label)}
              className="px-6 py-3 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-full text-apple-secondary hover:text-apple-accent hover:border-apple-primary/50 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-lg flex items-center gap-2"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <span className="text-lg">{filter.icon}</span>
              <span className="font-medium">{filter.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.form>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-apple-accent">Refine your search</h3>
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6 text-apple-secondary" />
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-3">Category</label>
                <select className="w-full p-4 rounded-2xl border border-gray-200 bg-white focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/20 transition-colors">
                  <option>Clothing</option>
                  <option>Accessories</option>
                  <option>Shoes</option>
                  <option>Bags</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-3">Price Range</label>
                <select className="w-full p-4 rounded-2xl border border-gray-200 bg-white focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/20 transition-colors">
                  <option>Under $100</option>
                  <option>$100 - $300</option>
                  <option>$300 - $500</option>
                  <option>$500+</option>
                </select>
              </div>

              {/* Occasion */}
              <div>
                <label className="block text-sm font-medium text-apple-accent mb-3">Occasion</label>
                <select className="w-full p-4 rounded-2xl border border-gray-200 bg-white focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/20 transition-colors">
                  <option>Any occasion</option>
                  <option>Work</option>
                  <option>Party</option>
                  <option>Casual</option>
                  <option>Formal</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <motion.button
                className="px-6 py-3 text-apple-secondary hover:text-apple-accent transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear all
              </motion.button>
              <motion.button
                className="px-8 py-3 bg-apple-primary text-white rounded-2xl font-medium transition-colors hover:bg-apple-primary-hover"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Apply filters
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced filters toggle with generous spacing */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mx-auto px-6 py-3 text-apple-secondary hover:text-apple-accent transition-colors mt-12"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Filter className="w-4 h-4" />
        <span className="font-medium">Advanced filters</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </motion.button>
    </div>
  );
};

export default AppleSearchInterface;
