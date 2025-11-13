import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';

interface OptionalFiltersProps {
  onFiltersChange?: (filters: { color?: string; budget?: string; occasion?: string }) => void;
}

const OptionalFilters: React.FC<OptionalFiltersProps> = ({ onFiltersChange }) => {
  const [color, setColor] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');

  const colors = ['Blue', 'Red', 'Black', 'White', 'Green', 'Pink', 'Purple', 'Yellow', 'Brown', 'Gray'];
  const budgets = ['Under $50', '$50 - $100', '$100 - $200', '$200 - $500', '$500+'];
  const occasions = ['Casual', 'Party', 'Work', 'Formal', 'Wedding', 'Date', 'Travel', 'Sports'];

  const handleFilterChange = (type: 'color' | 'budget' | 'occasion', value: string) => {
    if (type === 'color') {
      setColor(color === value ? '' : value);
    } else if (type === 'budget') {
      setBudget(budget === value ? '' : value);
    } else if (type === 'occasion') {
      setOccasion(occasion === value ? '' : value);
    }

    // Notify parent component
    const filters = {
      color: type === 'color' ? (color === value ? '' : value) : color,
      budget: type === 'budget' ? (budget === value ? '' : value) : budget,
      occasion: type === 'occasion' ? (occasion === value ? '' : value) : occasion,
    };
    
    onFiltersChange?.(filters);
  };

  const hasActiveFilters = color || budget || occasion;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Optional Filters</h3>
        <p className="text-xs text-gray-500">Select filters to refine your search (all optional)</p>
      </div>

      <div className="space-y-4">
        {/* Color Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <motion.button
                key={c}
                onClick={() => handleFilterChange('color', c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  color === c
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {c}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Budget Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
          <div className="flex flex-wrap gap-2">
            {budgets.map((b) => (
              <motion.button
                key={b}
                onClick={() => handleFilterChange('budget', b)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  budget === b
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {b}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Occasion Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {occasions.map((o) => (
              <motion.button
                key={o}
                onClick={() => handleFilterChange('occasion', o)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  occasion === o
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {o}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <motion.button
          onClick={() => {
            setColor('');
            setBudget('');
            setOccasion('');
            onFiltersChange?.({});
          }}
          className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Clear all filters
        </motion.button>
      )}
    </motion.div>
  );
};

export default OptionalFilters;




