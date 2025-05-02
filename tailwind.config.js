/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  important: true,
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#64b5f6',
          main: '#2196f3',
          dark: '#1976d2',
        },
        secondary: {
          light: '#ff4081',
          main: '#f50057',
          dark: '#c51162',
        },
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 15px rgba(0, 0, 0, 0.1)',
        'hover': '0 8px 25px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}; 