/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // AdvisaCare-inspired command-center palette: deep teal + restrained lime accent.
        "advisa-primary": "#06494F",
        "advisa-secondary": "#04363B",
        "advisa-accent": "#0B6F72",
        "advisa-accent-dark": "#06494F",
        "advisa-lime": "#9BB83F",
        "advisa-lime-soft": "#F3F8E8",
        "advisa-surface": "#F5F8F7",
        "advisa-border": "#DDE8E5",
        "clinical-blue": "#1597C8",
        "clinical-blue-soft": "#EAF7FC",
        "clinical-text": "#1F2F33",
        "clinical-muted": "#667A7E",
        "hipaa-red": "#dc2626",
        "hipaa-yellow": "#d97706",
        "hipaa-green": "#059669",
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(6, 73, 79, 0.06), 0 1px 2px -1px rgba(6, 73, 79, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(6, 73, 79, 0.10), 0 2px 4px -2px rgba(6, 73, 79, 0.05)',
        'sidebar': '2px 0 12px 0 rgba(4, 54, 59, 0.24)',
      },
      borderRadius: {
        'card': '10px',
      },
    },
  },
  plugins: [],
};
