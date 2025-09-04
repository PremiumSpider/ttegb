/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'gradient-x': 'gradient-x 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'rainbow-spin': 'rainbow-spin 4s linear infinite',
        'rainbow-border': 'rainbow-border 2s linear infinite',
        'rainbow-pulse': 'rainbow-pulse 2s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'shimmer': {
          '0%': {
            'background-position': '-200% 0'
          },
          '100%': {
            'background-position': '200% 0'
          }
        },
        'rainbow-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
  'rainbow-border': {
    '0%, 100%': {
      'border-color': 'rgb(239, 68, 68)',
      'box-shadow': '0 0 10px rgba(239, 68, 68, 0.7)'
    },
    '33%': {
      'border-color': 'rgb(34, 197, 94)',
      'box-shadow': '0 0 10px rgba(34, 197, 94, 0.7)'
    },
    '66%': {
      'border-color': 'rgb(59, 130, 246)',
      'box-shadow': '0 0 10px rgba(59, 130, 246, 0.7)'
    }
  },
        'rainbow-pulse': {
          '0%': {
            'box-shadow': '0 0 15px rgba(239, 68, 68, 0.8)'
          },
          '33%': {
            'box-shadow': '0 0 15px rgba(34, 197, 94, 0.8)'
          },
          '66%': {
            'box-shadow': '0 0 15px rgba(59, 130, 246, 0.8)'
          },
          '100%': {
            'box-shadow': '0 0 15px rgba(239, 68, 68, 0.8)'
          }
        }
      },
      backgroundImage: {
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}