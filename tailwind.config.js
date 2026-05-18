/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "advisa-primary": "#1a365d",
        "advisa-secondary": "#2d3748",
        "advisa-accent": "#38b2ac",
        "hipaa-red": "#dc2626",
        "hipaa-yellow": "#f59e0b",
        "hipaa-green": "#10b981",
      },
    },
  },
  plugins: [],
};
