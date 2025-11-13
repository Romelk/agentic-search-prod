import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { SearchState, SearchFilters, RankedLook, AgentExecutionTrace, Question, Feedback } from '../types';
import { searchApi, convertApiResponseToSearchResponse } from '../services/api';

interface SearchStore extends SearchState {
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setResults: (results: RankedLook[]) => void;
  setExecutionTrace: (trace: AgentExecutionTrace) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionId: (sessionId: string) => void;
  setQuestions: (questions: Question[]) => void;
  updateQuestion: (questionId: string, answer: any) => void;
  
  // Complex actions
  executeSearch: () => Promise<void>;
  provideFeedback: (bundleId: string, feedback: Feedback) => Promise<void>;
  clearSearch: () => void;
  
  // Computed values
  hasResults: boolean;
  currentLook: RankedLook | null;
  setCurrentLookIndex: (index: number) => void;
}

const initialState: SearchState = {
  query: '',
  filters: {},
  results: [],
  executionTrace: undefined,
  loading: false,
  error: null,
  sessionId: undefined,
  questions: [],
};

export const useSearchStore = create<SearchStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Basic setters
        setQuery: (query) => set({ query }, false, 'setQuery'),
        setFilters: (filters) => set({ filters }, false, 'setFilters'),
        setResults: (results) => set({ results }, false, 'setResults'),
        setExecutionTrace: (executionTrace) => set({ executionTrace }, false, 'setExecutionTrace'),
        setLoading: (loading) => set({ loading }, false, 'setLoading'),
        setError: (error) => set({ error }, false, 'setError'),
        setSessionId: (sessionId) => set({ sessionId }, false, 'setSessionId'),
        setQuestions: (questions) => set({ questions }, false, 'setQuestions'),
        
        // Question management
        updateQuestion: (questionId, answer) => {
          const { questions } = get();
          const updatedQuestions = questions.map(q => 
            q.id === questionId 
              ? { ...q, answered: true, answer }
              : q
          );
          set({ questions: updatedQuestions }, false, 'updateQuestion');
        },
        
        // Complex actions
        executeSearch: async () => {
          const { query, filters, sessionId } = get();
          
          if (!query.trim()) {
            set({ error: 'Please enter a search query' }, false, 'executeSearch/empty');
            return;
          }
          
          set({ loading: true, error: null }, false, 'executeSearch/start');
          
          try {
            // Generate new session ID if not exists
            const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            set({ sessionId: currentSessionId }, false, 'executeSearch/session');

            // Convert filters to API format
            const apiFilters: any = {};
            if (filters.color) apiFilters.color = filters.color;
            if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
              apiFilters.priceRange = [
                filters.minPrice || 0,
                filters.maxPrice || 10000
              ];
            }
            if (filters.occasion) apiFilters.occasion = filters.occasion;

            // Call orchestrator API
            const apiResponse = await searchApi.search({
              query,
              filters: Object.keys(apiFilters).length > 0 ? apiFilters : undefined,
              maxResults: 10,
            });

            // Handle simple orchestrator response format
            const simpleResponse = apiResponse as any;
            const results = simpleResponse.results || simpleResponse.uiResponse?.results || [];
            const traces = simpleResponse.executionTrace 
              ? [simpleResponse.executionTrace]
              : simpleResponse.uiResponse?.executionTraces || [];
            
            // Extract questions from API response
            const questions = simpleResponse.questions || [];

            set({
              results,
              executionTrace: traces[0],
              loading: false,
              error: null,
              sessionId: currentSessionId,
              questions,
            }, false, 'executeSearch/success');

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Search failed';
            set({
              loading: false,
              error: errorMessage,
            }, false, 'executeSearch/error');
          }
        },
        
        provideFeedback: async (bundleId, feedback) => {
          try {
            // Use real API
            await searchApi.submitFeedback(bundleId, feedback);
            
            // Optionally update local state based on feedback
            console.log('Feedback submitted successfully');
            
          } catch (error) {
            console.error('Failed to submit feedback:', error);
            // Don't show error to user for feedback, just log it
          }
        },
        
        clearSearch: () => {
          set({
            query: '',
            filters: {},
            results: [],
            executionTrace: undefined,
            loading: false,
            error: null,
            sessionId: undefined,
            questions: [],
          }, false, 'clearSearch');
        },
        
        // Computed values
        get hasResults() {
          return get().results.length > 0;
        },
        
        get currentLook() {
          const { results } = get();
          return results.length > 0 ? results[0] : null;
        },
        
        setCurrentLookIndex: (index) => {
          const { results } = get();
          if (index >= 0 && index < results.length) {
            // Reorder results to put the selected one first
            const newResults = [...results];
            const [selected] = newResults.splice(index, 1);
            newResults.unshift(selected);
            set({ results: newResults }, false, 'setCurrentLookIndex');
          }
        },
      }),
      {
        name: 'agentic-search-store',
        partialize: (state) => ({
          query: state.query,
          filters: state.filters,
          // Don't persist results, executionTrace, or loading states
        }),
      }
    ),
    {
      name: 'search-store',
    }
  )
);
