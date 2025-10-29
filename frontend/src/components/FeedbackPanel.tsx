import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';
import toast from 'react-hot-toast';

const FeedbackPanel: React.FC = () => {
  const { results, provideFeedback } = useSearchStore();
  const [feedbackVisible, setFeedbackVisible] = React.useState(false);

  // Show feedback panel when results are available
  useEffect(() => {
    if (results.length > 0) {
      const timer = setTimeout(() => {
        setFeedbackVisible(true);
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    } else {
      setFeedbackVisible(false);
    }
  }, [results.length]);

  const handleFeedback = async (bundleId: string, rating: 'thumbs-up' | 'thumbs-down') => {
    try {
      await provideFeedback(bundleId, {
        bundleId,
        rating,
        timestamp: Date.now(),
      });
      
      toast.success('Thank you for your feedback!', {
        icon: '👍',
        duration: 3000,
      });
      
      setFeedbackVisible(false);
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  if (results.length === 0 || !feedbackVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {feedbackVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="bg-white rounded-2xl shadow-apple-lg p-6 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-apple-accent">How was this result?</h3>
              <button
                onClick={() => setFeedbackVisible(false)}
                className="btn-ghost p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-caption text-apple-secondary mb-4">
              Help us improve by rating this recommendation
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleFeedback(results[0].look.bundleId, 'thumbs-up')}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <span>👍</span>
                Helpful
              </button>
              <button
                onClick={() => handleFeedback(results[0].look.bundleId, 'thumbs-down')}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <span>👎</span>
                Not helpful
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackPanel;
