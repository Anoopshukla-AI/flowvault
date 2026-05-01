import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'fv-base': '#080B10',
        'fv-surface': 'rgba(255,255,255,0.03)',
        'fv-surface-2': 'rgba(255,255,255,0.06)',
        'fv-border': 'rgba(255,255,255,0.07)',
        'fv-border-active': 'rgba(255,255,255,0.12)',
        'fv-text': '#ffffff',
        'fv-muted': 'rgba(255,255,255,0.45)',
        'fv-faint': 'rgba(255,255,255,0.25)',
        'fv-trigger': '#00FFA3',
        'fv-fetch': '#00C2FF',
        'fv-transform': '#A78BFA',
        'fv-decision': '#FBBF24',
        'fv-action': '#F472B6',
        'fv-output': '#34D399',
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        input: '8px',
        icon: '10px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        fadein: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.5)' },
        },
        'beam-fill': {
          from: { height: '0%' },
          to: { height: '100%' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        fadein: 'fadein 0.5s cubic-bezier(0.23, 1, 0.32, 1) both',
        shimmer: 'shimmer 1.2s infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'beam-fill': 'beam-fill 0.6s cubic-bezier(0.23, 1, 0.32, 1) both',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
