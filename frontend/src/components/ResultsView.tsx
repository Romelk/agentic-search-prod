import React from 'react';
import { motion } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';

const ResultsView: React.FC = () => {
  const { results } = useSearchStore();

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Left side - Swipeable cards (40%) */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-apple p-6 h-full">
          <h3 className="heading-3 mb-4">Curated Looks</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.div
                key={result.look.bundleId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-hover p-4 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-apple-primary/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">👗</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-apple-accent mb-1">
                      {result.look.bundleName}
                    </h4>
                    <p className="text-caption text-apple-secondary mb-2">
                      {result.look.items.length} items • {result.look.styleTheme} theme
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-apple-accent">
                        ${result.look.totalPrice.toFixed(2)}
                      </span>
                      <span className="text-xs bg-apple-success/20 text-apple-success px-2 py-1 rounded-full">
                        Score: {(result.finalScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Explanation panel (60%) */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-2xl shadow-apple p-6 h-full">
          <h3 className="heading-3 mb-4">Why This Look Works</h3>
          {results[0] && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-apple-primary/10 to-blue-500/10 rounded-xl p-6">
                <h4 className="font-semibold text-apple-accent mb-3">
                  ✨ {results[0].look.styleTheme} Style
                </h4>
                <p className="text-body">
                  This {results[0].look.styleTheme} look creates a cohesive aesthetic. 
                  The items work together harmoniously ({(results[0].look.coherenceScore * 100).toFixed(0)}% coherence), 
                  creating a polished appearance that's perfect for {results[0].look.styleTheme} occasions.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6">
                <h4 className="font-semibold text-apple-accent mb-3">
                  🎨 Color Harmony
                </h4>
                <p className="text-body">
                  The color palette is beautifully coordinated with complementary tones. 
                  Featured colors create a sophisticated effect with excellent color harmony.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6">
                <h4 className="font-semibold text-apple-accent mb-3">
                  👗 Perfect Combination
                </h4>
                <p className="text-body mb-4">
                  This {results[0].look.items.length}-piece ensemble includes:
                </p>
                <ul className="space-y-2">
                  {results[0].look.items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="w-4 h-4 bg-apple-primary/20 rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      {item.product.category} - {item.product.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6">
                <h4 className="font-semibold text-apple-accent mb-3">
                  💰 Value
                </h4>
                <p className="text-body">
                  This look offers exceptional value with high-quality pieces at an affordable price. 
                  At ${results[0].look.totalPrice.toFixed(2)} total, this {results[0].look.priceRange} ensemble 
                  gives you a complete, coordinated look that's worth the investment.
                </p>
              </div>

              <div className="flex gap-3">
                <button className="btn-primary flex-1">
                  View Full Look
                </button>
                <button className="btn-secondary">
                  Save to Favorites
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsView;

