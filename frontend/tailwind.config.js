/** @type {import('tailwindcss').Config} */

// Petrol teal: the primary brand colour (trust, institutions, connection).
const brand = {
  50: '#effaf9',
  100: '#d5f1ee',
  200: '#ade2de',
  300: '#78ccc8',
  400: '#45adab',
  500: '#2a9190',
  600: '#1f7475',
  700: '#1d5d5f',
  800: '#1c4b4d',
  900: '#1a3f41',
  950: '#0a2628',
};

// Terracotta: the warm accent for highlights and secondary emphasis.
const accent = {
  50: '#fdf5f0',
  100: '#fbe7dc',
  200: '#f6cbb4',
  300: '#efa784',
  400: '#e77b52',
  500: '#df5d33',
  600: '#c94726',
  700: '#a73721',
  800: '#862f21',
  900: '#6d291e',
  950: '#3b120d',
};

// Warm sand neutrals replace the cool default slate across the whole app.
const sand = {
  50: '#faf8f5',
  100: '#f3f0ea',
  200: '#e7e2d9',
  300: '#d4cdc1',
  400: '#9e9588',
  500: '#6f675b',
  600: '#5a5349',
  700: '#46403a',
  800: '#2e2a26',
  900: '#1e1b18',
  950: '#120f0d',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand,
        accent,
        slate: sand,
        // Legacy accent hues collapse into the system palette.
        indigo: accent,
        blue: brand,
        sky: brand,
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(30 27 24 / 0.04)',
        '2xs': '0 1px 1px 0 rgb(30 27 24 / 0.03)',
        card: '0 1px 2px 0 rgb(30 27 24 / 0.04), 0 1px 3px 0 rgb(30 27 24 / 0.04)',
        lift: '0 12px 28px -12px rgb(26 63 65 / 0.22), 0 2px 6px -2px rgb(30 27 24 / 0.06)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 240ms ease-out both',
        'scale-in': 'scale-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-left': 'slide-in-left 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
