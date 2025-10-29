# Agentic Search Frontend

A beautiful, fully functional React frontend for the Agentic Search system with Apple-inspired design and dual agent visualization modes.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## ✨ Features

### 🎨 **Apple-Inspired Design**
- Clean, minimalist aesthetics
- SF Pro Display/Text typography
- Glass morphism effects
- Smooth animations with Framer Motion

### 🔍 **Interactive Search**
- Hybrid search bar with expandable filters
- Real-time auto-suggestions
- Keyboard shortcuts (⌘K to focus, V to toggle visualization)
- Quick search suggestions

### 🎭 **Dual Agent Visualization**

#### Technical View (Default)
- Interactive LangGraph state machine
- Real-time agent progression
- Performance metrics and timing
- Collapsible/expandable interface

#### Sci-Fi Theater View
- 9 humanoid agent avatars
- Holographic stage with particle effects
- Animated agent conversations
- Speech bubbles with agent reasoning

### 💬 **Dynamic Questions System**
- Context-aware clarifying questions
- Multiple question types (single-choice, multi-choice, range, text)
- Inline cards and side panel options
- Skip/answer flow

### 📱 **Results Interface**
- Swipeable look bundle cards
- Rich explanations panel
- Price and score indicators
- Feedback system with thumbs up/down

### 🧪 **A/B Testing**
- Side-by-side dataset comparison
- Visual diff highlighting
- Performance metrics comparison
- Export functionality

## 🎯 **Demo Mode**

The frontend is currently running in **Demo Mode** with:
- ✅ **Fully functional UI** - All buttons and interactions work
- ✅ **Mock data** - Realistic search results and agent traces
- ✅ **Complete user flow** - Search → Questions → Results → Feedback
- ✅ **Beautiful animations** - Smooth transitions and effects

## 🔧 **How to Test**

1. **Search Examples:**
   ```
   "blue dress for summer party"
   "casual outfit for weekend"
   "work attire for meetings"
   "date night outfit"
   ```

2. **Try These Features:**
   - Press `V` to toggle between Technical and Sci-Fi views
   - Click the filter button to expand search filters
   - Answer or skip the clarifying questions
   - Switch to A/B Testing mode
   - Provide feedback on results

3. **Keyboard Shortcuts:**
   - `⌘K` (or `Ctrl+K`) - Focus search bar
   - `V` - Toggle visualization mode
   - `Escape` - Clear search

## 🏗️ **Architecture**

- **React 18** + **TypeScript**
- **Vite** for fast development
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **React Flow** for graph visualization

## 📁 **Project Structure**

```
src/
├── components/          # React components
├── stores/             # Zustand state management
├── services/           # API services (mock for demo)
├── types/              # TypeScript definitions
├── styles/             # Global styles and themes
└── utils/              # Utility functions
```

## 🔄 **Next Steps**

To connect to the real backend:

1. **Update API endpoints** in `src/services/`
2. **Replace mock data** with real API calls
3. **Add WebSocket/SSE** for real-time agent updates
4. **Deploy backend services** (Node.js + Java)

## 🎨 **Design System**

- **Colors**: Apple blue (#0071e3), clean whites, subtle grays
- **Typography**: System fonts with generous line heights
- **Spacing**: 8px base unit with Apple-style breathing room
- **Animations**: 0.3s smooth transitions
- **Accessibility**: ARIA labels, keyboard navigation, high contrast

## 📱 **Responsive Design**

- **Desktop-first** approach
- **Mobile-friendly** with graceful degradation
- **Touch-optimized** interactions
- **Accessibility** compliant

---

**Ready to explore the future of fashion search!** 🚀

