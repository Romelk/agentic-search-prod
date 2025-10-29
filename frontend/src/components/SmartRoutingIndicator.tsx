import React from 'react';
import { motion } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';

const SmartRoutingIndicator: React.FC = () => {
  const { executionTrace, loading } = useSearchStore();

  if (!executionTrace || loading) return null;

  const agentCount = executionTrace.steps.length;
  const totalPossibleAgents = 9;
  const efficiency = Math.round(((totalPossibleAgents - agentCount) / totalPossibleAgents) * 100);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 70) return 'text-green-600 bg-green-50';
    if (efficiency >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getEfficiencyMessage = (efficiency: number, agentCount: number) => {
    if (efficiency >= 70) return `Ultra-fast: Only ${agentCount} agents used`;
    if (efficiency >= 50) return `Optimized: ${agentCount} agents used`;
    return `Full pipeline: ${agentCount} agents used`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-6 z-50"
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-gray-100/50 max-w-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-apple-accent">Smart Routing</span>
        </div>
        
        <div className="space-y-2">
          <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getEfficiencyColor(efficiency)}`}>
            {getEfficiencyMessage(efficiency, agentCount)}
          </div>
          
          <div className="text-xs text-apple-secondary">
            <div className="flex justify-between">
              <span>Processing time:</span>
              <span>{executionTrace.totalDuration}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Efficiency:</span>
              <span>{efficiency}% faster</span>
            </div>
          </div>

          <div className="text-xs text-apple-secondary">
            <div className="font-medium mb-1">Agents used:</div>
            <div className="flex flex-wrap gap-1">
              {executionTrace.steps.map((step, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {step.agentName.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartRoutingIndicator;

