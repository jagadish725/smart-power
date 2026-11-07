/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#090D16',
          panel: '#0D1524',
          card: '#131F37',
          border: '#1E2E4A',
          cyan: '#00F0FF',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          muted: '#94A3B8',
          subtle: '#475569'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 15px rgba(239, 68, 68, 0.4)',
      }
    },
  },
  plugins: [],
}

