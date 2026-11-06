/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#3B82F6',
          subtle: '#EFF6FF',
        },
        secondary: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          light: '#14B8A6',
          subtle: '#F0FDFA',
        },
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: '#FBBF24',
          subtle: '#FEF3C7',
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: '#34D399',
          subtle: '#ECFDF5',
        },
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E2E8F0',
          darkborder: '#CBD5E1'
        },
        ink: {
          primary: '#1E293B',
          secondary: '#64748B',
          muted: '#94A3B8',
          inverted: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(30, 41, 59, 0.04), 0 1px 2px -1px rgba(30, 41, 59, 0.04)',
        'card': '0 4px 6px -1px rgba(30, 41, 59, 0.05), 0 2px 4px -2px rgba(30, 41, 59, 0.03)',
        'elevated': '0 10px 15px -3px rgba(30, 41, 59, 0.07), 0 4px 6px -4px rgba(30, 41, 59, 0.03)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      }
    },
  },
  plugins: [],
}
