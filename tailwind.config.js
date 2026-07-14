/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)'
        },
        profit: {
          bg: '#e6f4ea',
          border: '#b7e0c3',
          text: '#1e7d3c',
          strong: '#188544',
          bgDark: '#0f2a1a',
          borderDark: '#1e5631',
          textDark: '#4ade80',
          strongDark: '#34d666'
        },
        loss: {
          bg: '#fdecec',
          border: '#f3bcbc',
          text: '#c0392b',
          strong: '#d64545',
          bgDark: '#2e1414',
          borderDark: '#5c2323',
          textDark: '#f87171',
          strongDark: '#f65a5a'
        }
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        popover: '0 12px 24px -8px rgb(0 0 0 / 0.18), 0 4px 8px -4px rgb(0 0 0 / 0.1)'
      }
    }
  },
  darkMode: 'class',
  plugins: []
}
