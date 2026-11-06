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
          DEFAULT: '#243447',
          hover: '#1B2735',
          light: '#2F435C',
          subtle: '#E9EEF3',
        },
        secondary: {
          DEFAULT: '#4F807A',
          hover: '#416B66',
          light: '#669690',
          subtle: '#EDF5F4',
        },
        accent: {
          DEFAULT: '#C98262',
          hover: '#B57051',
          light: '#D8977B',
          subtle: '#F9F1ED',
        },
        success: {
          DEFAULT: '#64866A',
          hover: '#527057',
          light: '#7B9E81',
          subtle: '#EFF5F0',
        },
        surface: {
          bg: '#F7F6F2',
          card: '#FFFFFF',
          muted: '#EFECE6',
          border: '#E3E0D8',
          darkborder: '#D0CDC4'
        },
        ink: {
          primary: '#30343B',
          secondary: '#5B626C',
          muted: '#8B929C',
          inverted: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(36, 52, 71, 0.05), 0 1px 2px -1px rgba(36, 52, 71, 0.05)',
        'card': '0 4px 6px -1px rgba(36, 52, 71, 0.06), 0 2px 4px -2px rgba(36, 52, 71, 0.04)',
        'elevated': '0 10px 15px -3px rgba(36, 52, 71, 0.08), 0 4px 6px -4px rgba(36, 52, 71, 0.04)',
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
