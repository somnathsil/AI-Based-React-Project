/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#020617',
          800: '#0B1120',
          700: '#0F172A',
        },
      },
    },
  },
  plugins: [],
}
