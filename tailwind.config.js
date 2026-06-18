/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#fbfbfa',
          card: '#ffffff',
          text: '#37352f',
          muted: '#7c7b77',
          border: '#e3e2e0',
          hover: '#f1f1ef',
          active: '#efedea',
          tag: {
            gray: { bg: '#f1f1ef', text: '#5a5a57' },
            brown: { bg: '#f4eeee', text: '#603030' },
            orange: { bg: '#fbecdd', text: '#854c1d' },
            yellow: { bg: '#fbf3db', text: '#89632a' },
            green: { bg: '#edf3ec', text: '#2b593f' },
            blue: { bg: '#e8f4fc', text: '#1d4ed8' },
            purple: { bg: '#f5f0f8', text: '#652ca3' },
            pink: { bg: '#f9f0f4', text: '#9d174d' },
            red: { bg: '#fdebeb', text: '#991b1b' },
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
