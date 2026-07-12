/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Active le mode dark mode (basé sur la classe .dark)
  theme: {
    extend: {
      colors: {
        // Tokens reliés aux variables CSS (voir src/index.css)
        bg: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        'surface-2': 'var(--c-surface-2)',
        line: 'var(--c-line)',
        'line-strong': 'var(--c-line-strong)',
        fg: 'var(--c-fg)',
        muted: 'var(--c-muted)',
        accent: 'var(--c-accent)',
        'accent-weak': 'var(--c-accent-weak)',
        danger: 'var(--c-danger)',
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: '14px',
        xl: '18px',
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
