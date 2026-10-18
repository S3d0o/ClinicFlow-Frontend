/** @type {import('tailwindcss').Config} */
// Theme colors are HSL channel triplets defined in src/index.css. The `<alpha-value>` slot makes
// opacity modifiers work (e.g. `bg-primary/90`, `ring-ring/40`).
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Stitch "Clinical Sanctuary" type scale. Headline/display sizes pair with `font-display`;
      // body/label/caption sizes use Inter. Weights here are defaults that `font-*` can override.
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
        primary: {
          DEFAULT: token('primary'),
          foreground: token('primary-foreground'),
        },
        ink: {
          DEFAULT: token('ink'),
          foreground: token('ink-foreground'),
        },
        secondary: {
          DEFAULT: token('secondary'),
          foreground: token('secondary-foreground'),
        },
        destructive: {
          DEFAULT: token('destructive'),
          foreground: token('destructive-foreground'),
        },
        success: {
          DEFAULT: token('success'),
          foreground: token('success-foreground'),
        },
        warning: {
          DEFAULT: token('warning'),
          foreground: token('warning-foreground'),
        },
        info: {
          DEFAULT: token('info'),
          foreground: token('info-foreground'),
        },
        violet: {
          DEFAULT: token('violet'),
          foreground: token('violet-foreground'),
        },
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground'),
        },
        accent: {
          DEFAULT: token('accent'),
          foreground: token('accent-foreground'),
        },
        popover: {
          DEFAULT: token('popover'),
          foreground: token('popover-foreground'),
        },
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground'),
        },
        sidebar: {
          DEFAULT: token('sidebar-background'),
          foreground: token('sidebar-foreground'),
          primary: token('sidebar-primary'),
          "primary-foreground": token('sidebar-primary-foreground'),
          accent: token('sidebar-accent'),
          "accent-foreground": token('sidebar-accent-foreground'),
          border: token('sidebar-border'),
          ring: token('sidebar-ring'),
        },
      },
      // --radius is 10px: controls `rounded-lg`, panels `rounded-xl` (12px), cards and dialogs
      // `rounded-2xl` (16px), chips and badges `rounded-full`.
      borderRadius: {
        "2xl": "calc(var(--radius) + 6px)",
        xl: "calc(var(--radius) + 2px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      // Tonal layering, not heavy drop shadows: slate-tinted, low-opacity ambient shadows.
      boxShadow: {
        xs: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
        card: "0 1px 2px 0 rgb(15 23 42 / 0.03), 0 1px 8px 0 rgb(15 23 42 / 0.04)",
        hover: "0 6px 20px 0 rgb(15 23 42 / 0.07)",
        elevated: "0 12px 32px -8px rgb(15 23 42 / 0.14), 0 2px 6px -1px rgb(15 23 42 / 0.04)",
      },
      spacing: {
        sidebar: "16rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
