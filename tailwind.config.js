/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Brutalist / Swiss: no radii, no shadows. These are *replacements*, not
    // extensions, so `rounded-lg` / `shadow-md` simply do not exist.
    borderRadius: {
      none: '0',
      DEFAULT: '0',
      full: '0',
    },
    boxShadow: {
      none: 'none',
      DEFAULT: 'none',
    },
    extend: {
      colors: {
        // Every colour is a runtime CSS custom property so the settings panel
        // can repaint the whole app without a re-render of the tree.
        bg: 'var(--sc-bg)',
        fg: 'var(--sc-fg)',
        accent: 'var(--sc-accent)',
        warn: 'var(--sc-warn)',
        line: 'var(--sc-line)',
        muted: 'var(--sc-muted)',
        faint: 'var(--sc-faint)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        mega: ['clamp(3.5rem, 8vw, 7rem)', { lineHeight: '0.85', letterSpacing: '-0.04em' }],
        huge: ['clamp(1.75rem, 3vw, 2.75rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        micro: ['0.625rem', { lineHeight: '1', letterSpacing: '0.14em' }],
      },
      transitionTimingFunction: {
        snap: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};
