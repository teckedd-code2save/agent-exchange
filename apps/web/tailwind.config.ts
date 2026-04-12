import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#EBF2FF',
          100: '#C7DCFF',
          200: '#94BBFF',
          300: '#6199FF',
          400: '#3D7EFF',
          500: '#0052FF', // Coinbase Blue
          600: '#0044D6',
          700: '#0033A8',
          800: '#00227A',
          900: '#00114D',
        },
        surface: {
          950: '#03030A',
          900: '#06060F',
          850: '#09091A',
          800: '#0C0C1E',
          750: '#101028',
          700: '#141432',
        },
        ink: {
          muted:     '#3E4165',
          secondary: '#7986AA',
          tertiary:  '#9BA3BE',
          primary:   '#CDD5E8',
          white:     '#FFFFFF',
        },
        accent: {
          cyan:   '#22D3EE',
          green:  '#10B981',
          amber:  '#F59E0B',
          red:    '#EF4444',
          purple: '#8B5CF6',
        },
      },
      animation: {
        ticker:      'ticker 45s linear infinite',
        'fade-up':   'fadeUp 0.5s ease-out both',
        'fade-in':   'fadeIn 0.4s ease-out both',
        glow:        'glow 3s ease-in-out infinite alternate',
        shimmer:     'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        blink:       'blink 1.2s step-end infinite',
      },
      keyframes: {
        ticker: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        glow: {
          from: { opacity: '0.5' },
          to:   { opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '200% center' },
          to:   { backgroundPosition: '-200% center' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
      backgroundImage: {
        'dot-grid':
          'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
        'hero-radial':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,82,255,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(34,211,238,0.08) 0%, transparent 50%)',
        'brand-gradient':
          'linear-gradient(135deg, #0052FF 0%, #22D3EE 100%)',
        'card-gradient':
          'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
      backgroundSize: {
        'dot-grid': '28px 28px',
      },
      boxShadow: {
        brand:  '0 0 40px rgba(0,82,255,0.25)',
        cyan:   '0 0 40px rgba(34,211,238,0.2)',
        card:   '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,82,255,0.2)',
      },
      borderColor: {
        dim:    'rgba(255,255,255,0.06)',
        subtle: 'rgba(255,255,255,0.10)',
        brand:  'rgba(0,82,255,0.35)',
        cyan:   'rgba(34,211,238,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
