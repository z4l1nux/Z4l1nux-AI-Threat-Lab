/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      colors: {
        'custom-black': '#1a1a2e',
        'custom-yellow': '#ff8c00',
        'custom-blue': '#2c2c4a',
        'custom-gray': '#2c2c4a',
        'threat-critical': '#dc2626',
        'threat-high': '#ea580c',
        'threat-medium': '#d97706',
        'threat-low': '#059669',
        'z4l1nux-primary': '#ff6b35',
        'z4l1nux-secondary': '#004e89',
        'z4l1nux-accent': '#ffd23f'
      },
      fontFamily: {
        'z4l1nux': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
