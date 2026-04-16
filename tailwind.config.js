/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        kyro: {
          bg:      '#0a0a0b',
          surface: '#0c0c14',
          card:    '#111114',
          border:  '#2a2a2a',
          border2: '#383838',
          muted:   '#555555',
          sub:     '#6b6b6b',
          text:    '#f0f0ed',
          yellow:  '#d4d93f',
          navy:    '#200f8c',
        },
      },
    },
  },
  plugins: [],
}
