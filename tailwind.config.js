/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kawaii: {
          bg: '#FFF7FA',
          secundario: '#FFD9E8',
          rosa: '#FFB7CF',
          intenso: '#FF8DB5',
          boton: '#F56D9D',
          texto: '#5A4A52',
        },
        darkKawaii: {
          bg: '#2D2226',
          secundario: '#4A353E',
          rosa: '#E594B0',
          intenso: '#C96F8E',
          boton: '#D1537F',
          texto: '#F3EAF0',
        }
      },
      fontFamily: {
        title: ['"Cherry Bomb One"', 'cursive'],
        sans: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}