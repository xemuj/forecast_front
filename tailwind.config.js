/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac7ff',
          300: '#8da2ff',
          400: '#5d72ff',
          500: '#3644f0',
          600: '#2a36d4',
          700: '#222cb0',
          800: '#1e278a',
          900: '#1f2568',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}