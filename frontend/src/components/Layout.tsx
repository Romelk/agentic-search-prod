import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo with Apple-style animation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-3"
            >
              <motion.div 
                className="w-9 h-9 bg-gradient-to-br from-apple-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-sm"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.div>
              <span className="font-semibold text-apple-accent tracking-tight text-xl">Agentic Search</span>
            </motion.div>

            {/* Navigation with Apple-style animations */}
            <motion.nav
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="hidden md:flex items-center gap-8"
            >
              <motion.button 
                className="text-apple-secondary hover:text-apple-accent font-medium transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                How it works
              </motion.button>
              <motion.button 
                className="text-apple-secondary hover:text-apple-accent font-medium transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Examples
              </motion.button>
              <motion.button 
                className="text-apple-secondary hover:text-apple-accent font-medium transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                About
              </motion.button>
            </motion.nav>

            {/* Mobile menu button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onClick={toggleSidebar}
              className="md:hidden btn-ghost p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-100/50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-apple-primary to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-apple-accent">Agentic Search</span>
              </div>
              <p className="text-caption text-apple-secondary max-w-md">
                AI-powered fashion discovery that understands your style, context, and preferences to curate perfect looks through intelligent agent collaboration.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-apple-accent mb-3">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">Features</a></li>
                <li><a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">How it works</a></li>
                <li><a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-apple-accent mb-3">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">Help Center</a></li>
                <li><a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">Contact</a></li>
                <li><a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-caption text-apple-secondary">
              © 2024 Agentic Search. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">Privacy</a>
              <a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">Terms</a>
              <a href="#" className="text-caption text-apple-secondary hover:text-apple-accent transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 h-full bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-apple-primary to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-apple-accent">Agentic Search</span>
                </div>
                <button onClick={toggleSidebar} className="btn-ghost p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-4">
                <a href="#" className="block py-3 text-apple-secondary hover:text-apple-accent transition-colors">How it works</a>
                <a href="#" className="block py-3 text-apple-secondary hover:text-apple-accent transition-colors">Examples</a>
                <a href="#" className="block py-3 text-apple-secondary hover:text-apple-accent transition-colors">About</a>
                <a href="#" className="block py-3 text-apple-secondary hover:text-apple-accent transition-colors">Help Center</a>
                <a href="#" className="block py-3 text-apple-secondary hover:text-apple-accent transition-colors">Contact</a>
              </nav>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Layout;
