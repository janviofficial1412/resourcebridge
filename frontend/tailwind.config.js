/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf5ef',
          100: '#dcebe0',
          200: '#bdd8c5',
          300: '#91bd9e',
          400: '#639e76',
          500: '#3e8058',
          600: '#2e6846',
          700: '#25533a',
          800: '#204331',
          900: '#1b382a',
          950: '#0d2118',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
