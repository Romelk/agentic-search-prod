import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';

const DemoModeToggle: React.FC = () => {
  const { abTestingActive, toggleABTesting } = useUIStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-apple-lg p-4 border border-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <div>
            <div className="text-sm font-medium text-apple-accent">Demo Mode</div>
            <div className="text-xs text-apple-secondary">Mock data • Fully functional UI</div>
          </div>
        </div>
        
        <div className="mt-3 flex gap-2">
          <button
            onClick={toggleABTesting}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              abTestingActive 
                ? 'bg-apple-primary text-white' 
                : 'bg-gray-100 text-apple-secondary hover:bg-gray-200'
            }`}
          >
            A/B Test
          </button>
          <a
            href="https://github.com/your-repo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-apple-secondary hover:bg-gray-200 transition-colors"
          >
            View Code
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default DemoModeToggle;

