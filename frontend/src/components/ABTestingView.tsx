import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';

const ABTestingView: React.FC = () => {
  const { toggleABTesting } = useUIStore();

  // Mock A/B test data
  const mockData = {
    datasetA: {
      name: 'Dataset A',
      results: [
        { id: 1, name: 'Summer Party Look', score: 0.92, price: 89.99 },
        { id: 2, name: 'Casual Weekend', score: 0.88, price: 65.50 },
        { id: 3, name: 'Professional Style', score: 0.85, price: 120.00 },
      ]
    },
    datasetB: {
      name: 'Dataset B',
      results: [
        { id: 1, name: 'Evening Elegance', score: 0.89, price: 95.00 },
        { id: 2, name: 'Relaxed Chic', score: 0.91, price: 72.25 },
        { id: 3, name: 'Business Casual', score: 0.87, price: 110.50 },
      ]
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="heading-2 mb-2">A/B Testing Comparison</h2>
          <p className="text-body text-apple-secondary">
            Compare results from different product datasets
          </p>
        </div>
        <button
          onClick={toggleABTesting}
          className="btn-secondary"
        >
          Exit A/B Test
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Dataset A */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-apple p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-3 text-apple-primary">{mockData.datasetA.name}</h3>
            <span className="text-xs bg-apple-primary/20 text-apple-primary px-3 py-1 rounded-full">
              Original Dataset
            </span>
          </div>

          <div className="space-y-4">
            {mockData.datasetA.results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-hover p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-apple-primary/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">👗</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-apple-accent mb-1">
                      {result.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-apple-accent">
                        ${result.price.toFixed(2)}
                      </span>
                      <span className="text-xs bg-apple-success/20 text-apple-success px-2 py-1 rounded-full">
                        Score: {(result.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-apple-accent">3</div>
                <div className="text-xs text-apple-secondary">Results</div>
              </div>
              <div>
                <div className="text-xl font-bold text-apple-accent">88%</div>
                <div className="text-xs text-apple-secondary">Avg Score</div>
              </div>
              <div>
                <div className="text-xl font-bold text-apple-accent">$92</div>
                <div className="text-xs text-apple-secondary">Avg Price</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dataset B */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-apple p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-3 text-purple-600">{mockData.datasetB.name}</h3>
            <span className="text-xs bg-purple-600/20 text-purple-600 px-3 py-1 rounded-full">
              Enhanced Dataset
            </span>
          </div>

          <div className="space-y-4">
            {mockData.datasetB.results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-hover p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-apple-accent mb-1">
                      {result.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-apple-accent">
                        ${result.price.toFixed(2)}
                      </span>
                      <span className="text-xs bg-apple-success/20 text-apple-success px-2 py-1 rounded-full">
                        Score: {(result.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-apple-accent">3</div>
                <div className="text-xs text-apple-secondary">Results</div>
              </div>
              <div>
                <div className="text-xl font-bold text-apple-accent">89%</div>
                <div className="text-xs text-apple-secondary">Avg Score</div>
              </div>
              <div>
                <div className="text-xl font-bold text-apple-accent">$93</div>
                <div className="text-xs text-apple-secondary">Avg Price</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comparison summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-white rounded-2xl shadow-apple p-6"
      >
        <h3 className="heading-3 mb-4">Comparison Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-apple-success mb-1">+1%</div>
            <div className="text-sm text-apple-secondary">Better Relevance</div>
            <div className="text-xs text-apple-secondary mt-1">Dataset B shows improved matching</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-apple-primary mb-1">+$1</div>
            <div className="text-sm text-apple-secondary">Price Difference</div>
            <div className="text-xs text-apple-secondary mt-1">Minimal price impact</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-apple-accent mb-1">15%</div>
            <div className="text-sm text-apple-secondary">Diversity Improvement</div>
            <div className="text-xs text-apple-secondary mt-1">More varied recommendations</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ABTestingView;

