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
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#1B4332', // Deep emerald restaurant green
          900: '#081C15',
          950: '#030E0A',
        },
        warm: {
          50: '#FDFCF9',
          100: '#FAF7F2', // Warm off-white background
          200: '#F3EDE2',
          300: '#E7DEC8',
          400: '#D5C7A5',
          500: '#BCAB7E',
        },
        charcoal: {
          50: '#F6F6F6',
          100: '#E7E7E7',
          200: '#D1D1D1',
          300: '#B0B0B0',
          400: '#888888',
          500: '#6D6D6D',
          600: '#5D5D5D',
          700: '#4F4F4F',
          800: '#2D2B2A',
          900: '#1C1917', // Dark charcoal text
        },
        food: {
          veg: '#16A34A',
          nonveg: '#DC2626',
          amber: '#D97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 2px 12px -2px rgba(28, 25, 23, 0.06), 0 1px 3px 0 rgba(28, 25, 23, 0.04)',
        'card-hover': '0 8px 24px -4px rgba(28, 25, 23, 0.1), 0 2px 6px 0 rgba(28, 25, 23, 0.06)',
        'sticky': '0 -4px 20px -2px rgba(0, 0, 0, 0.08)',
        'floating': '0 10px 30px -5px rgba(27, 67, 50, 0.3)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
