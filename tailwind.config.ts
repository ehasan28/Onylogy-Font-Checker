import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Tailwind reads CSS variables defined in entrypoints/popup/styles.css.
 * Utilities like `bg-bg`, `text-fg`, `text-accent`, `font-display`, `font-mono`
 * resolve to the editorial dark theme tokens.
 */

export default {
  // Theme is set via [data-theme="dark"] on <html> by the theme provider.
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./entrypoints/**/*.{ts,tsx,html}', './src/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          elev: 'var(--bg-elev)',
          'elev-2': 'var(--bg-elev-2)',
        },
        line: {
          DEFAULT: 'var(--line)',
          soft: 'var(--line-soft)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          muted: 'var(--fg-muted)',
          dim: 'var(--fg-dim)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          ring: 'var(--accent-ring)',
          contrast: 'var(--accent-contrast)',
        },
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
      },
      fontFamily: {
        display: 'var(--display-font)',
        sans: 'var(--sans-font)',
        mono: 'var(--mono-font)',
      },
      fontSize: {
        // Editorial display sizes used in the popup chrome
        display: ['2rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
        full: '999px',
      },
      boxShadow: {
        // Subtle, no harsh shadows — editorial look
        soft: '0 1px 0 rgba(255, 255, 255, 0.02) inset',
        pop: '0 8px 32px -12px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        // Subtle shimmer for "Loaded" font badges
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Caret blink for inspect-mode prompt
        caret: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 3.5s linear infinite',
        caret: 'caret 1s steps(1) infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
