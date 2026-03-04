/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        earth: {
          50:  '#FAF6EF',
          100: '#F3ECE2',
          200: '#E8D9C8',
          300: '#D4BFA8',
          400: '#B89A7E',
          500: '#9B7A62',
          600: '#7A5D48',
          700: '#5C4433',
          800: '#3D2E1E',
          900: '#2A1F14',
          950: '#1A1410',
        },
        gold: {
          100: '#FBF0D0',
          200: '#F5D88E',
          300: '#F0C060',
          400: '#E8A838',
          500: '#D4952C',
          600: '#B8821C',
        },
        terra: {
          400: '#D0845E',
          500: '#B86544',
          600: '#984C2C',
        },
        harvest: {
          400: '#7AB468',
          500: '#5E9450',
          600: '#4A7C3F',
          700: '#3A6428',
        },
        green: { 50: '#f0fdf4', 100: '#dcfce7', 600: '#16a34a', 700: '#15803d', 800: '#166534' },
      },
      fontFamily: {
        display: ['"Tiro Devanagari Hindi"', 'Georgia', 'serif'],
        body: ['Hind', '"Segoe UI"', 'sans-serif'],
        english: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Hind', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
