import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { useSearchStore } from '../stores/searchStore';
import TechnicalGraphView from './TechnicalGraphView';
import SciFiTheaterView from './SciFiTheaterView';

const AgentVisualization: React.FC = () => {
  const { visualizationMode, graphExpanded, toggleVisualizationMode, toggleGraphExpanded } = useUIStore();
  const { executionTrace, loading } = useSearchStore();

  if (!executionTrace && !loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Visualization mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="heading-3">Agent Workflow</h2>
          <div className="segmented-control">
            <button
              onClick={() => useUIStore.getState().setVisualizationMode('technical')}
              className={`segmented-control-option ${visualizationMode === 'technical' ? 'active' : ''}`}
            >
              Technical View
            </button>
            <button
              onClick={() => useUIStore.getState().setVisualizationMode('sci-fi')}
              className={`segmented-control-option ${visualizationMode === 'sci-fi' ? 'active' : ''}`}
            >
              Sci-Fi Theater
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-caption text-apple-secondary">Press V to toggle</span>
          <button
            onClick={toggleGraphExpanded}
            className="btn-ghost text-sm"
          >
            {graphExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Visualization content */}
      <motion.div
        key={visualizationMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {visualizationMode === 'technical' ? (
          <TechnicalGraphView />
        ) : (
          <SciFiTheaterView />
        )}
      </motion.div>

      {/* Progress indicator (when collapsed) */}
      {!graphExpanded && executionTrace && (
        <div className="bg-white rounded-xl p-4 shadow-apple">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-apple-accent">Processing...</span>
            <span className="text-xs text-apple-secondary">
              {executionTrace.steps.filter(s => s.status === 'completed').length} / {executionTrace.steps.length} agents
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-apple-primary to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${(executionTrace.steps.filter(s => s.status === 'completed').length / executionTrace.steps.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {executionTrace.steps.map((step, index) => (
              <span
                key={step.agentName}
                className={`text-xs px-2 py-1 rounded-full ${
                  step.status === 'completed' 
                    ? 'bg-apple-success text-white' 
                    : step.status === 'active'
                    ? 'bg-apple-primary text-white animate-pulse'
                    : 'bg-gray-100 text-apple-secondary'
                }`}
              >
                {step.agentName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentVisualization;

