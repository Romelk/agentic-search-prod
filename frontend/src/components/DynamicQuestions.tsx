import React from 'react';
import { motion } from 'framer-motion';
import { useSearchStore } from '../stores/searchStore';
import { useUIStore } from '../stores/uiStore';

const DynamicQuestions: React.FC = () => {
  const { questions, updateQuestion } = useSearchStore();
  const { questionsPanelOpen } = useUIStore();

  if (questions.length === 0) {
    return null;
  }

  const unansweredQuestions = questions.filter(q => !q.answered);

  if (unansweredQuestions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-apple-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-apple-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-apple-accent mb-2">All Questions Answered!</h3>
        <p className="text-caption text-apple-secondary">
          Our AI agents have all the information they need to find the perfect look for you.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="heading-3">Help us find your perfect look</h3>
        {!questionsPanelOpen && (
          <button
            onClick={() => useUIStore.getState().toggleQuestionsPanel()}
            className="btn-ghost text-sm"
          >
            View all questions
          </button>
        )}
      </div>

      <div className="space-y-3">
        {unansweredQuestions.slice(0, questionsPanelOpen ? undefined : 2).map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-4"
          >
            <div className="mb-3">
              <h4 className="font-medium text-apple-accent mb-1">
                {question.text}
              </h4>
              {question.required && (
                <span className="text-xs text-apple-error">Required</span>
              )}
            </div>

            {question.type === 'single-choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => updateQuestion(question.id, option)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-apple-primary hover:bg-apple-primary/5 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'multi-choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-apple-primary hover:bg-apple-primary/5 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-apple-primary border-gray-300 rounded focus:ring-apple-primary"
                      onChange={(e) => {
                        const currentAnswer = question.answer as string[] || [];
                        const newAnswer = e.target.checked 
                          ? [...currentAnswer, option]
                          : currentAnswer.filter(item => item !== option);
                        updateQuestion(question.id, newAnswer);
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'range' && (
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  defaultValue="250"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  onChange={(e) => updateQuestion(question.id, Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-apple-secondary">
                  <span>$0</span>
                  <span>$1000+</span>
                </div>
              </div>
            )}

            {question.type === 'text' && (
              <textarea
                placeholder="Tell us more..."
                className="w-full p-3 rounded-lg border border-gray-200 focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/20 resize-none"
                rows={3}
                onChange={(e) => updateQuestion(question.id, e.target.value)}
              />
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => updateQuestion(question.id, '')}
                className="btn-secondary text-sm"
              >
                Skip
              </button>
              {question.type === 'range' && (
                <button
                  onClick={() => updateQuestion(question.id, 250)}
                  className="btn-primary text-sm"
                >
                  Set Budget
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {unansweredQuestions.length > 2 && !questionsPanelOpen && (
        <div className="text-center pt-4">
          <p className="text-caption text-apple-secondary mb-3">
            {unansweredQuestions.length - 2} more questions available
          </p>
          <button
            onClick={() => useUIStore.getState().toggleQuestionsPanel()}
            className="btn-primary"
          >
            Answer All Questions
          </button>
        </div>
      )}
    </div>
  );
};

export default DynamicQuestions;
