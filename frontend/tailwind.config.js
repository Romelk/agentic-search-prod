/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired color palette
        apple: {
          background: '#fbfbfd',
          surface: '#ffffff',
          primary: '#0071e3',
          'primary-hover': '#0056b3',
          secondary: '#6e6e73',
          accent: '#1d1d1f',
          success: '#30d158',
          error: '#ff3b30',
          warning: '#ff9500',
          glass: 'rgba(255, 255, 255, 0.72)',
          glassDark: 'rgba(29, 29, 31, 0.72)',
        },
        // Agent colors
        agent: {
          ivy: '#8b5cf6',      // Purple/Blue
          nori: '#f97316',     // Orange
          gale: '#10b981',     // Green/Cyan
          vogue: '#ec4899',    // Pink/Gold
          kiko: '#06b6d4',     // Cyan/White
          weave: '#8b5cf6',    // Rainbow (purple base)
          judge: '#f59e0b',    // Gold/Blue
          sage: '#84cc16',     // Sage Green
          aegis: '#ef4444',    // Red/Silver
        }
      },
      fontFamily: {
        'apple': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'holographic': 'holographic 2s ease-in-out infinite alternate',
        'neural-pulse': 'neuralPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        holographic: {
          '0%': { 
            filter: 'hue-rotate(0deg) brightness(1)',
            textShadow: '0 0 5px currentColor',
          },
          '100%': { 
            filter: 'hue-rotate(20deg) brightness(1.1)',
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor',
          },
        },
        neuralPulse: {
          '0%, 100%': { 
            opacity: '0.6',
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1.05)',
          },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'apple': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'apple-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'holographic': '0 0 20px rgba(59, 130, 246, 0.5)',
      },
    },
  },
  plugins: [],
}
