/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          bg:      '#060b18',
          surface: '#0c1428',
          card:    '#0f1a35',
          border:  '#1a2d4e',
          border2: '#243d68',
          muted:   '#4a6080',
          text:    '#dce8ff',
          subtext: '#7a9cc0',
        },
        brand: {
          DEFAULT: '#3b82f6',
          hover:   '#2563eb',
          muted:   '#1e3a5f',
          glow:    'rgba(59,130,246,0.15)',
        },
      },
    },
  },
  plugins: [],
}
