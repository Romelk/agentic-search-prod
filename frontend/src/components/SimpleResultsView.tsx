import React from 'react';
import { motion } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';

const SimpleResultsView: React.FC = () => {
  const { results, query } = useSearchStore();

  console.log('SimpleResultsView - Results:', results);
  console.log('SimpleResultsView - Query:', query);

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-apple-secondary">No results found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Results Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-semibold text-apple-accent mb-2">
          Search Results for "{query}"
        </h2>
        <p className="text-apple-secondary">
          Found {results.length} curated look{results.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <motion.div
            key={result.look.bundleId || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Bundle Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-apple-accent">
                  {result.look.bundleName}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-apple-primary">
                    ${result.look.totalPrice.toFixed(2)}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-apple-secondary text-sm mb-3">
                {result.look.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-apple-secondary">
                <span>🎨 {result.look.styleTheme}</span>
                <span>📦 {result.look.items.length} items</span>
                <span>⭐ {result.confidence.toFixed(1)} confidence</span>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-6">
              <h4 className="text-sm font-medium text-apple-accent mb-4">Items in this look:</h4>
              <div className="grid grid-cols-2 gap-3">
                {result.look.items.slice(0, 4).map((item, itemIndex) => (
                  <div
                    key={`${item.product.sku}-${itemIndex}`}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="w-full h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-2xl">
                        {item.product.category === 'clothing' && item.product.subcategory === 'dresses' ? '👗' : 
                         item.product.category === 'clothing' && item.product.subcategory === 'shirts' ? '👕' : 
                         item.product.category === 'accessories' ? '👜' : '👕'}
                      </span>
                    </div>
                    <h5 className="text-sm font-medium text-apple-accent truncate">
                      {item.product.name}
                    </h5>
                    <p className="text-xs text-apple-secondary">
                      ${item.product.price.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {item.similarityScore?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-xs text-apple-secondary">
                        {item.product.brand}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {result.look.items.length > 4 && (
                <div className="mt-3 text-center">
                  <span className="text-xs text-apple-secondary">
                    +{result.look.items.length - 4} more items
                  </span>
                </div>
              )}
            </div>

            {/* Recommendation Reason */}
            <div className="px-6 pb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-apple-accent mb-2">Why this works:</h5>
                <p className="text-sm text-apple-secondary">
                  {result.recommendationReason}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Debug Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-gray-100 rounded-lg"
      >
        <h4 className="text-sm font-medium text-apple-accent mb-2">Debug Info:</h4>
        <pre className="text-xs text-apple-secondary overflow-auto">
          {JSON.stringify({ resultsCount: results.length, query }, null, 2)}
        </pre>
      </motion.div>
    </div>
  );
};

export default SimpleResultsView;
