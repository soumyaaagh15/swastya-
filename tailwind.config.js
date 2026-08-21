/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sashtya: {
          blue: '#0057B8',
          cream: '#FAF7F0',
          dark: '#0B0F19',
          charcoal: '#202124',
          emergency: '#D92D20',
        }
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 87, 184, 0.06)',
        'cardHover': '0 10px 25px -3px rgba(0, 87, 184, 0.12)',
        'emergency': '0 0 20px rgba(217, 45, 32, 0.4)',
      }
    },
  },
  plugins: [],
}
