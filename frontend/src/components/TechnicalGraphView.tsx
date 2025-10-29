import React from 'react';
import { motion } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';

const TechnicalGraphView: React.FC = () => {
  const { executionTrace } = useSearchStore();

  // Mock agent data for demonstration
  const agents = [
    { name: 'Ivy Interpreter', status: 'completed', color: 'agent-ivy' },
    { name: 'Nori Clarifier', status: 'completed', color: 'agent-nori' },
    { name: 'Gale ContextKeeper', status: 'completed', color: 'agent-gale' },
    { name: 'Vogue TrendWhisperer', status: 'completed', color: 'agent-vogue' },
    { name: 'Kiko Curator', status: 'completed', color: 'agent-kiko' },
    { name: 'Weave Composer', status: 'completed', color: 'agent-weave' },
    { name: 'Judge Ranker', status: 'completed', color: 'agent-judge' },
    { name: 'Sage Explainer', status: 'completed', color: 'agent-sage' },
    { name: 'Aegis Guardian', status: 'completed', color: 'agent-aegis' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-apple p-6">
      <div className="text-center mb-6">
        <h3 className="heading-3 mb-2">LangGraph State Machine</h3>
        <p className="text-caption text-apple-secondary">
          Real-time visualization of agent execution flow
        </p>
      </div>

      {/* Agent flow diagram */}
      <div className="relative">
        {/* Flow lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0071e3" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0071e3" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {agents.slice(0, -1).map((_, index) => (
            <motion.line
              key={index}
              x1={`${(index * 100) / (agents.length - 1) + 50}%`}
              y1="50%"
              x2={`${((index + 1) * 100) / (agents.length - 1) + 50}%`}
              y2="50%"
              stroke="url(#flowGradient)"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          ))}
        </svg>

        {/* Agent nodes */}
        <div className="grid grid-cols-3 md:grid-cols-9 gap-4 relative z-10">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              {/* Agent circle */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm
                ${agent.status === 'completed' ? `bg-${agent.color}` : 'bg-gray-300'}
                ${agent.status === 'completed' ? 'shadow-lg' : ''}
                transition-all duration-300
              `}>
                {agent.name.charAt(0)}
              </div>
              
              {/* Agent name */}
              <div className="mt-2 text-center">
                <div className="text-xs font-medium text-apple-accent leading-tight">
                  {agent.name.split(' ')[0]}
                </div>
                <div className="text-xs text-apple-secondary leading-tight">
                  {agent.name.split(' ').slice(1).join(' ')}
                </div>
              </div>

              {/* Status indicator */}
              {agent.status === 'completed' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.1 + 0.3 }}
                  className="mt-1 w-2 h-2 bg-apple-success rounded-full"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* State details */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-apple-accent mb-2">Query Processing</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-apple-secondary">Intent Detection</span>
              <span className="text-apple-success">✓</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-apple-secondary">Clarification</span>
              <span className="text-apple-success">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-apple-accent mb-2">Context & Search</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-apple-secondary">Context Enrichment</span>
              <span className="text-apple-success">✓</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-apple-secondary">Vector Search</span>
              <span className="text-apple-success">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-apple-accent mb-2">Response Pipeline</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-apple-secondary">Bundle Creation</span>
              <span className="text-apple-success">✓</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-apple-secondary">Ranking & Validation</span>
              <span className="text-apple-success">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="mt-6 p-4 bg-gradient-to-r from-apple-primary/10 to-blue-500/10 rounded-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-apple-accent">9</div>
            <div className="text-xs text-apple-secondary">Agents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-apple-accent">2.3s</div>
            <div className="text-xs text-apple-secondary">Total Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-apple-accent">5</div>
            <div className="text-xs text-apple-secondary">Results</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-apple-accent">$0.02</div>
            <div className="text-xs text-apple-secondary">Cost</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalGraphView;

