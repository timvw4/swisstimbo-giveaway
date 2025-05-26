module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dollar-green': '#bc0b0b',
        'light-gray': '#D9D9D9',
      },
      fontFamily: {
        'old-style': ['Georgia', 'serif'],
      },
      keyframes: {
        'winner-reveal': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1.1)', opacity: '1' },
        },
        'winner-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(188, 11, 11, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(188, 11, 11, 0.8)' },
        }
      },
      animation: {
        'winner-reveal': 'winner-reveal 1s ease-out forwards',
        'winner-glow': 'winner-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} 