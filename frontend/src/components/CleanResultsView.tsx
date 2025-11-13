import React from 'react';
import { motion } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';

const CleanResultsView: React.FC = () => {
  const { results, query } = useSearchStore();

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Results Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Results for "{query}"
        </h2>
        <p className="text-gray-600">
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
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Product Images Grid */}
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50">
              {result.look.items.slice(0, 4).map((item, itemIndex) => (
                <div
                  key={`${item.product.sku}-${itemIndex}`}
                  className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center"
                >
                  <span className="text-3xl">
                    {item.product.category === 'clothing' && item.product.subcategory === 'dresses' ? '👗' : 
                     item.product.category === 'clothing' && item.product.subcategory === 'shirts' ? '👕' : 
                     item.product.category === 'accessories' ? '👜' : 
                     item.product.category === 'footwear' ? '👠' : '👕'}
                  </span>
                </div>
              ))}
            </div>

            {/* Bundle Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {result.look.bundleName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{result.look.items.length} items</span>
                    <span>•</span>
                    <span className="font-medium text-blue-600">
                      ${result.look.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    {Math.round(result.confidence * 100)}% match
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {result.look.description}
              </p>

              {/* Why This Works */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Why this works:</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.recommendationReason}
                </p>
              </div>

              {/* Style Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {result.look.styleTheme}
                </span>
                {result.look.categoryBreakdown?.map((cat, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CleanResultsView;




