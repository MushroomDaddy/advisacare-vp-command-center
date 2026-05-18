/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        "advisa-primary": "#0f2847",
        "advisa-secondary": "#1a365d",
        "advisa-accent": "#0ea5e9",
        "advisa-accent-dark": "#0284c7",
        "advisa-surface": "#f8fafc",
        "advisa-border": "#e2e8f0",
        "hipaa-red": "#dc2626",
        "hipaa-yellow": "#d97706",
        "hipaa-green": "#059669",
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'sidebar': '2px 0 12px 0 rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'card': '10px',
      },
    },
  },
  plugins: [],
};
