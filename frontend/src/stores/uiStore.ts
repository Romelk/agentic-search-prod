import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UIState, VisualizationMode } from '../types';

interface UIStore extends UIState {
  // Actions
  setVisualizationMode: (mode: VisualizationMode) => void;
  toggleVisualizationMode: () => void;
  setGraphExpanded: (expanded: boolean) => void;
  toggleGraphExpanded: () => void;
  setQuestionsPanelOpen: (open: boolean) => void;
  toggleQuestionsPanel: () => void;
  setABTestingActive: (active: boolean) => void;
  toggleABTesting: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCurrentLookIndex: (index: number) => void;
  
  // Complex actions
  resetUI: () => void;
}

const initialState: UIState = {
  visualizationMode: 'technical',
  graphExpanded: false,
  questionsPanelOpen: false,
  abTestingActive: false,
  sidebarOpen: false,
  currentLookIndex: 0,
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Basic setters
        setVisualizationMode: (visualizationMode) => 
          set({ visualizationMode }, false, 'setVisualizationMode'),
        
        toggleVisualizationMode: () => {
          const { visualizationMode } = get();
          const newMode = visualizationMode === 'technical' ? 'sci-fi' : 'technical';
          set({ visualizationMode: newMode }, false, 'toggleVisualizationMode');
        },
        
        setGraphExpanded: (graphExpanded) => 
          set({ graphExpanded }, false, 'setGraphExpanded'),
        
        toggleGraphExpanded: () => {
          const { graphExpanded } = get();
          set({ graphExpanded: !graphExpanded }, false, 'toggleGraphExpanded');
        },
        
        setQuestionsPanelOpen: (questionsPanelOpen) => 
          set({ questionsPanelOpen }, false, 'setQuestionsPanelOpen'),
        
        toggleQuestionsPanel: () => {
          const { questionsPanelOpen } = get();
          set({ questionsPanelOpen: !questionsPanelOpen }, false, 'toggleQuestionsPanel');
        },
        
        setABTestingActive: (abTestingActive) => 
          set({ abTestingActive }, false, 'setABTestingActive'),
        
        toggleABTesting: () => {
          const { abTestingActive } = get();
          set({ abTestingActive: !abTestingActive }, false, 'toggleABTesting');
        },
        
        setSidebarOpen: (sidebarOpen) => 
          set({ sidebarOpen }, false, 'setSidebarOpen'),
        
        toggleSidebar: () => {
          const { sidebarOpen } = get();
          set({ sidebarOpen: !sidebarOpen }, false, 'toggleSidebar');
        },
        
        setCurrentLookIndex: (currentLookIndex) => 
          set({ currentLookIndex }, false, 'setCurrentLookIndex'),
        
        // Complex actions
        resetUI: () => {
          set(initialState, false, 'resetUI');
        },
      }),
      {
        name: 'agentic-search-ui-store',
        partialize: (state) => ({
          visualizationMode: state.visualizationMode,
          // Don't persist temporary UI states like expanded panels
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);

