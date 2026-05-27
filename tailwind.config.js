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
        "advisa-lime-dark": "#86A832",
        "advisa-lime-soft": "#F3F8E8",
        "advisa-surface": "#F5F8F7",
        "advisa-border": "#DDE8E5",
        "advisa-border-light": "#EEF3F1",
        "clinical-blue": "#1597C8",
        "clinical-blue-soft": "#EAF7FC",
        "clinical-text": "#1F2F33",
        "clinical-muted": "#667A7E",
        "clinical-faint": "#93A6A8",
        "hipaa-red": "#dc2626",
        "hipaa-yellow": "#d97706",
        "hipaa-green": "#059669",
      },
      boxShadow: {
        // Multi-layer Stripe-class shadows. Each is a stack of sharp + diffuse
        // + ambient so cards read as real material at every elevation.
        'card':       '0 1px 2px rgba(15,47,51,.04), 0 1px 3px rgba(6,73,79,.06)',
        'card-hover': '0 1px 2px rgba(15,47,51,.04), 0 8px 24px -6px rgba(6,73,79,.14), 0 4px 8px -4px rgba(6,73,79,.08)',
        'card-lift':  '0 1px 2px rgba(15,47,51,.04), 0 16px 40px -10px rgba(6,73,79,.20), 0 6px 14px -4px rgba(6,73,79,.10)',
        'sidebar':    '2px 0 18px 0 rgba(4,54,59,.28)',
        'glow-lime':  '0 0 0 1px rgba(155,184,63,.12), 0 6px 18px -6px rgba(155,184,63,.40)',
        'glow-red':   '0 0 0 1px rgba(220,38,38,.10), 0 6px 18px -6px rgba(220,38,38,.40)',
        'btn-primary':'0 1px 0 rgba(255,255,255,.18) inset, 0 -1px 0 rgba(0,0,0,.10) inset, 0 2px 4px rgba(6,73,79,.20), 0 0 0 1px rgba(4,54,59,.30)',
        'btn-primary-hover':'0 1px 0 rgba(255,255,255,.18) inset, 0 -1px 0 rgba(0,0,0,.10) inset, 0 4px 12px rgba(6,73,79,.28), 0 0 0 1px rgba(4,54,59,.30)',
      },
      borderRadius: {
        'card': '12px',
      },
      backgroundImage: {
        // Subtle inner-card gradient — gives every card surface a sense of material.
        'card-surface': 'linear-gradient(180deg, #FFFFFF 0%, #FBFCFC 100%)',
        'btn-primary-grad': 'linear-gradient(180deg, #0B6F72 0%, #06494F 100%)',
        'btn-primary-hover-grad': 'linear-gradient(180deg, #0E7A7D 0%, #0B6F72 100%)',
      },
      keyframes: {
        'advisa-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(155,184,63,.55)' },
          '50%':      { boxShadow: '0 0 0 5px rgba(155,184,63,0)' },
        },
      },
      animation: {
        'pulse-lime': 'advisa-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
