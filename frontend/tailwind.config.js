/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2563EB",
          secondary: "#1E293B",
        },
        border: "rgb(var(--border) / <alpha-value>)",
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
}

