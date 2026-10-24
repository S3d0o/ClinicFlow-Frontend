/** @type {import('tailwindcss').Config} */
// Theme values come from src/styles/tokens.css (ClinicFlow Navy, design-v2/DESIGN.md). Colors are HSL
// channel triplets; the `<alpha-value>` slot makes opacity modifiers work (`bg-primary/90`).
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;
const pair = (name) => ({ DEFAULT: token(name), foreground: token(`${name}-foreground`) });

module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
      },
      // Type scale from design-v2/DESIGN.md. Headline and title sizes pair with `font-display`;
      // body, label and caption sizes use the UI font. `font-*` can override the default weights.
      fontSize: {
        'display-lg': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl': ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.015em', fontWeight: '700' }],
        'headline-lg': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'title-sm': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.625rem' }],
        'body-md': ['0.875rem', { lineHeight: '1.375rem' }],
        'body-sm': ['0.75rem', { lineHeight: '1.125rem' }],
        'label-md': ['0.8125rem', { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-sm': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.03em', fontWeight: '600' }],
        caption: ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        primary: { ...pair('primary'), hover: token('primary-hover') },
        ink: pair('ink'),
        secondary: pair('secondary'),
        highlight: { DEFAULT: token('highlight'), strong: token('highlight-strong') },
        info: pair('info'),
        success: pair('success'),
        warning: pair('warning'),
        destructive: pair('destructive'),
        violet: pair('violet'),
        muted: pair('muted'),
        accent: pair('accent'),
        popover: pair('popover'),
        card: pair('card'),
        sidebar: {
          DEFAULT: token('sidebar-background'),
          foreground: token('sidebar-foreground'),
          active: token('sidebar-active'),
          'active-foreground': token('sidebar-active-foreground'),
        },
      },
      // --radius is 10px: controls `rounded-lg`, panels and cards `rounded-xl` (12px), dialogs
      // `rounded-2xl` (16px), chips and badges `rounded-full`.
      borderRadius: {
        '2xl': 'calc(var(--radius) + 6px)',
        xl: 'calc(var(--radius) + 2px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xs: 'calc(var(--radius) - 6px)',
      },
      // Flat surfaces: hairline borders carry the structure, shadows stay faint and navy-tinted.
      boxShadow: {
        xs: '0 1px 2px 0 rgb(19 38 59 / 0.05)',
        card: '0 1px 3px 0 rgb(19 38 59 / 0.06)',
        hover: '0 6px 20px 0 rgb(19 38 59 / 0.08)',
        elevated: '0 8px 24px 0 rgb(19 38 59 / 0.10)',
      },
      spacing: {
        sidebar: '16.25rem', // 260px staff sidebar
        rail: '4.5rem', // 72px tablet icon rail
      },
      keyframes: {
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
      },
      animation: {
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
