/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
        azul: 'rgb(var(--color-azul-rgb) / <alpha-value>)',
        papel: 'rgb(var(--color-papel-rgb) / <alpha-value>)',
        light: 'rgb(var(--color-light-rgb) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
