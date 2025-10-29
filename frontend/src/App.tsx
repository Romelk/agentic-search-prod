import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from './stores/searchStore';
import { useUIStore } from './stores/uiStore';
import Layout from './components/Layout';
import SearchBar from './components/SearchBar';
import AppleSearchInterface from './components/AppleSearchInterface';
import AgentVisualization from './components/AgentVisualization';
import ResultsView from './components/ResultsView';
import SimpleResultsView from './components/SimpleResultsView';
import DynamicQuestions from './components/DynamicQuestions';
import FeedbackPanel from './components/FeedbackPanel';
import ABTestingView from './components/ABTestingView';
import DemoModeToggle from './components/DemoModeToggle';
import SmartRoutingIndicator from './components/SmartRoutingIndicator';
import { Toaster } from 'react-hot-toast';

function App() {
  const { 
    loading, 
    error, 
    hasResults, 
    executionTrace,
    questions,
    executeSearch,
    clearSearch 
  } = useSearchStore();
  
  const { 
    visualizationMode, 
    graphExpanded,
    questionsPanelOpen,
    abTestingActive 
  } = useUIStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // V to toggle visualization mode
      if (event.key === 'v' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault();
          useUIStore.getState().toggleVisualizationMode();
        }
      }
      
      // Escape to clear search
      if (event.key === 'Escape') {
        clearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch]);

  return (
    <div className="min-h-screen bg-apple-background">
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-apple-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-apple-primary/20 border-t-apple-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-apple-secondary font-medium">AI agents are working...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-apple-error text-white px-6 py-3 rounded-full shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={() => useSearchStore.getState().setError(null)}
                className="ml-2 text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Layout>
        {/* Main content */}
        <main className="flex-1 flex flex-col">
          {/* Search section */}
          <section className="px-6 py-12">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h1 className="heading-1 mb-4">
                  Agentic Search
                </h1>
                <p className="text-body max-w-2xl mx-auto">
                  Experience the future of fashion discovery with our AI agent system that understands your style, context, and preferences to curate perfect looks.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <AppleSearchInterface />
              </motion.div>
            </div>
          </section>

          {/* Agent visualization section */}
          {(loading || hasResults || executionTrace) && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="px-6 py-8 bg-white/50 backdrop-blur-sm"
            >
              <div className="max-w-6xl mx-auto">
                <AgentVisualization />
              </div>
            </motion.section>
          )}

          {/* Questions section */}
          {questions.length > 0 && !questionsPanelOpen && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="px-6 py-8"
            >
              <div className="max-w-4xl mx-auto">
                <DynamicQuestions />
              </div>
            </motion.section>
          )}

          {/* Results section */}
          {hasResults && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 px-6 py-8"
            >
              <div className="max-w-7xl mx-auto h-full">
                {abTestingActive ? (
                  <ABTestingView />
                ) : (
                  <SimpleResultsView />
                )}
              </div>
            </motion.section>
          )}

          {/* Empty state */}
          {!loading && !hasResults && !error && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex-1 flex items-center justify-center px-6 py-12"
            >
              <div className="text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-apple-primary/20 to-apple-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-apple-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="heading-3 mb-4">Ready to discover your style?</h3>
                <p className="text-body">
                  Start by typing what you're looking for. Our AI agents will work together to find the perfect look for you.
                </p>
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                  <span className="text-caption bg-white px-3 py-1 rounded-full border">
                    Try: "blue dress for summer party"
                  </span>
                  <span className="text-caption bg-white px-3 py-1 rounded-full border">
                    Try: "casual outfit for weekend"
                  </span>
                  <span className="text-caption bg-white px-3 py-1 rounded-full border">
                    Try: "work attire for meetings"
                  </span>
                </div>
              </div>
            </motion.section>
          )}
        </main>
      </Layout>

      {/* Side panels */}
      <AnimatePresence>
        {questionsPanelOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-3">Clarifying Questions</h2>
                <button
                  onClick={() => useUIStore.getState().toggleQuestionsPanel()}
                  className="btn-ghost p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DynamicQuestions />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Feedback panel */}
      <FeedbackPanel />

      {/* Demo mode toggle */}
      <DemoModeToggle />

      {/* Smart routing indicator */}
      <SmartRoutingIndicator />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: '#1d1d1f',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      />
    </div>
  );
}

export default App;
