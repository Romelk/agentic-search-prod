import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';

const SciFiTheaterView: React.FC = () => {
  const { executionTrace } = useSearchStore();
  const [currentAgent, setCurrentAgent] = useState(0);
  const [agentMessages, setAgentMessages] = useState<string[]>([]);

  // Mock agent configurations with sci-fi styling
  const agents = [
    { 
      name: 'Ivy Interpreter', 
      color: 'from-purple-500 to-blue-500', 
      message: 'I detected formal party occasion intent from your query',
      icon: '🧠',
      position: { x: 10, y: 20 }
    },
    { 
      name: 'Nori Clarifier', 
      color: 'from-orange-400 to-red-500', 
      message: 'Let me ask: What\'s your budget range for this look?',
      icon: '❓',
      position: { x: 30, y: 20 }
    },
    { 
      name: 'Gale ContextKeeper', 
      color: 'from-green-400 to-cyan-500', 
      message: 'Adding environmental context: Summer season, evening event',
      icon: '🌍',
      position: { x: 50, y: 20 }
    },
    { 
      name: 'Vogue TrendWhisperer', 
      color: 'from-pink-400 to-purple-500', 
      message: 'Current trends suggest bold colors and statement accessories',
      icon: '✨',
      position: { x: 70, y: 20 }
    },
    { 
      name: 'Kiko Curator', 
      color: 'from-cyan-400 to-blue-500', 
      message: 'Searching vector database for matching products...',
      icon: '🔍',
      position: { x: 90, y: 20 }
    },
    { 
      name: 'Weave Composer', 
      color: 'from-rainbow-400 to-purple-500', 
      message: 'Creating cohesive look bundles with perfect color harmony',
      icon: '🎨',
      position: { x: 20, y: 60 }
    },
    { 
      name: 'Judge Ranker', 
      color: 'from-yellow-400 to-orange-500', 
      message: 'Ranking looks based on style, quality, and your preferences',
      icon: '⚖️',
      position: { x: 40, y: 60 }
    },
    { 
      name: 'Sage Explainer', 
      color: 'from-green-500 to-emerald-500', 
      message: 'Generating friendly explanations for why these looks work',
      icon: '📜',
      position: { x: 60, y: 60 }
    },
    { 
      name: 'Aegis Guardian', 
      color: 'from-red-400 to-pink-500', 
      message: 'Validating safety, inclusivity, and content policy compliance',
      icon: '🛡️',
      position: { x: 80, y: 60 }
    },
  ];

  // Simulate agent progression
  useEffect(() => {
    if (!executionTrace) return;

    // Reset state when new trace starts
    setCurrentAgent(0);
    setAgentMessages([]);

    const interval = setInterval(() => {
      setCurrentAgent((prev) => {
        const next = prev + 1;
        if (next < agents.length) {
          setAgentMessages((prev) => [...prev, agents[next].message]);
          return next;
        } else {
          // All agents completed
          clearInterval(interval);
          return prev;
        }
      });
    }, 1500); // Faster progression

    return () => clearInterval(interval);
  }, [executionTrace]);

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-2xl shadow-apple overflow-hidden min-h-[600px]">
      {/* Holographic background effects */}
      <div className="absolute inset-0 neural-grid opacity-20" />
      <div className="absolute inset-0 holographic-scan" />
      
      {/* Particles */}
      <div className="absolute inset-0 particles" />
      
      {/* Header */}
      <div className="relative z-10 p-6 text-center">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="heading-3 text-white mb-2 holographic"
        >
          AI Agent Command Center
        </motion.h3>
        <p className="text-white/70 text-sm">
          Watch our specialized agents collaborate in real-time
        </p>
      </div>

      {/* Agent stage */}
      <div className="relative z-10 px-6 pb-6">
        <div className="relative h-80 bg-black/30 rounded-xl border border-white/20 backdrop-blur-sm">
          {/* Stage grid */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Agents */}
          <div className="absolute inset-0 p-4">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: index <= currentAgent ? 1 : 0.6,
                  opacity: index <= currentAgent ? 1 : 0.4
                }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${agent.position.x}%`,
                  top: `${agent.position.y}%`,
                }}
              >
                {/* Agent avatar */}
                <div className={`
                  w-16 h-16 rounded-full bg-gradient-to-br ${agent.color} 
                  flex items-center justify-center text-2xl shadow-lg
                  ${index === currentAgent ? 'animate-neural-pulse shadow-holographic' : ''}
                  border-2 border-white/30
                `}>
                  {agent.icon}
                </div>

                {/* Agent name */}
                <div className="mt-2 text-center">
                  <div className="text-xs font-medium text-white">
                    {agent.name.split(' ')[0]}
                  </div>
                  <div className="text-xs text-white/70">
                    {agent.name.split(' ').slice(1).join(' ')}
                  </div>
                </div>

                {/* Active indicator */}
                {index === currentAgent && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Spotlight effect */}
          {currentAgent < agents.length && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: `radial-gradient(circle at ${agents[currentAgent].position.x}% ${agents[currentAgent].position.y}%, rgba(255,255,255,0.1) 0%, transparent 50%)`
              }}
            />
          )}
        </div>
      </div>

      {/* Agent messages */}
      <div className="relative z-10 px-6 pb-6">
        <div className="bg-black/40 rounded-xl p-4 backdrop-blur-sm border border-white/20">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live Agent Communications
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
            <AnimatePresence>
              {agentMessages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-white/80 text-sm flex items-start gap-2"
                >
                  <span className="text-green-400 text-xs mt-1">●</span>
                  <span>{message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="relative z-10 px-6 pb-6">
        <div className="bg-black/40 rounded-xl p-3 backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between text-white/80 text-sm">
            <div className="flex items-center gap-4">
              <span>Active Agent: {agents[currentAgent]?.name}</span>
              <span>Progress: {Math.round(((currentAgent + 1) / agents.length) * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SciFiTheaterView;
