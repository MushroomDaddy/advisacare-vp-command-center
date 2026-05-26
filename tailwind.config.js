/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],     // editorial page titles
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // ─── Override Tailwind's sky-* scale ─────────────────────────────
        // The old palette used sky-blue (#0ea5e9 family) for accent cards,
        // highlighted rows, and toasts. We retint the whole sky scale to a
        // clinical-blue tone aligned with the new AdvisaCare theme, so every
        // pre-existing `bg-sky-50` / `text-sky-700` / `ring-sky-200` etc.
        // automatically picks up the new colour without per-file edits.
        sky: {
          50:  '#EAF7FC',
          100: '#D2EEF7',
          200: '#A5DCEE',
          300: '#6FC4DE',
          400: '#3FA8C8',
          500: '#1597C8',   // matches advisa-info
          600: '#0E7490',   // matches op-info
          700: '#0B5F76',
          800: '#0E4A5C',
          900: '#0B3744',
          950: '#06222B',
        },
        // ─── AdvisaCare-inspired healthcare palette ──────────────────────
        //
        // Naming convention:
        //   advisa-primary / advisa-accent / advisa-accent-dark
        //     → DEEP TEAL family. Used broadly (sidebar, primary buttons,
        //       header icons, focus rings, progress bars, link colours).
        //   advisa-lime / advisa-lime-hover / advisa-lime-soft
        //     → BRAND LIME. Used sparingly — sidebar brand mark, active-nav
        //       left border, readiness/positive accents, small accent rules.
        //   advisa-info / advisa-info-soft
        //     → Clinical blue/teal for informational signals.
        //
        // Operational status colours (op-critical / op-warning / op-success)
        // stay vivid because they signal risk, not brand.

        // Deep teal — the broad-use primary. The existing 40+ usages of
        // `advisa-accent` across pages now resolve to teal, NOT lime, so the
        // app stays calm and executive instead of turning lime-everywhere.
        'advisa-primary':       '#06494F',
        'advisa-secondary':     '#04363B',
        'advisa-primary-hover': '#0B5F66',
        'advisa-accent':        '#06494F',  // alias of primary; widely used
        'advisa-accent-dark':   '#04363B',  // hover for advisa-accent
        'advisa-accent-hover':  '#0B5F66',

        // Restrained brand accent — lime. Use only where a small pop of
        // brand identity is warranted (brand marks, accent rails, positive
        // readiness pulse, on-brand success badges).
        'advisa-lime':          '#9BB83F',
        'advisa-lime-hover':    '#86A832',
        'advisa-lime-soft':     '#F3F8E8',

        // Clinical info — neutral informational tone.
        'advisa-info':          '#1597C8',
        'advisa-info-soft':     '#EAF7FC',

        // App surfaces.
        'advisa-surface':       '#F5F8F7',
        'advisa-card':          '#FFFFFF',
        'advisa-border':        '#DDE8E5',

        // Text.
        'advisa-text':          '#1F2F33',
        'advisa-text-muted':    '#667A7E',

        // Operational urgency — kept vivid.
        'op-critical':          '#DC2626',
        'op-warning':           '#D97706',
        'op-success':           '#059669',
        'op-info':              '#0E7490',

        // Legacy aliases (kept so older code keeps working).
        'hipaa-red':            '#DC2626',
        'hipaa-yellow':         '#D97706',
        'hipaa-green':          '#059669',
      },
      boxShadow: {
        // Slightly green-tinged shadows that read less harsh-navy and more
        // calm-clinical.
        'card':       '0 1px 3px 0 rgba(15, 47, 51, 0.05), 0 1px 2px -1px rgba(15, 47, 51, 0.04)',
        'card-hover': '0 4px 14px 0 rgba(6, 73, 79, 0.10), 0 2px 4px -2px rgba(6, 73, 79, 0.06)',
        'sidebar':    '2px 0 18px 0 rgba(4, 54, 59, 0.18)',
      },
      borderRadius: {
        'card': '10px',
      },
    },
  },
  plugins: [],
};
