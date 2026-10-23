---
name: ClinicFlow Navy
colors:
  primary: '#1E4164'
  primary-hover: '#16324E'
  primary-active: '#122A42'
  on-primary: '#FFFFFF'
  primary-container: '#E8EEF6'
  on-primary-container: '#1E4164'
  ink: '#13263B'
  accent: '#FF5E00'
  accent-container: '#FFF1E8'
  on-accent-container: '#B33F00'
  info: '#015C9A'
  info-container: '#E6F1F8'
  background: '#F7F9FD'
  surface: '#FFFFFF'
  surface-muted: '#EEF1F5'
  surface-hover: '#E8EEF6'
  on-surface: '#212427'
  on-surface-variant: '#5B6573'
  outline: '#C6D0DE'
  outline-variant: '#D3DBE6'
  focus-ring: '#015C9A'
  success: '#047857'
  success-container: '#ECFDF5'
  warning: '#92400E'
  warning-container: '#FFFBEB'
  error: '#B91C1C'
  error-container: '#FEF2F2'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.625rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
---

## Brand & Style

ClinicFlow is the operating system of a multi-branch outpatient clinic in Egypt. The look is **clean, flat and confident**, in the spirit of modern Egyptian consumer platforms such as Nawy: a deep navy brand color, a crisp near-white canvas, generous whitespace, search-first layouts, and one warm orange accent used sparingly. No green brand color, no decorative gradients, no heavy shadows.

## Colors

- **Primary navy (`#1E4164`)**: the brand and interactive color. Primary buttons, links, selected tabs and chips, active navigation item, selected dates and time slots. Hover `#16324E`, active `#122A42`. White text on it passes WCAG AA.
- **Ink (`#13263B`)**: the darkest navy, for the logo mark, page titles, the staff sidebar header and dark promo bands.
- **Accent orange (`#FF5E00`)**: highlights only: a "New" or "Today" tag, a price emphasis, an icon, an unread dot, a thin underline on the active tab. Never body text and never a full-width button; as a chip use `#B33F00` text on `#FFF1E8`.
- **Info blue (`#015C9A`)**: informational banners, vitals and data highlights, the focus ring.
- **Canvas `#F7F9FD`**, **surfaces `#FFFFFF`**, **muted fill `#EEF1F5`**, **hover fill `#E8EEF6`**.
- **Text `#212427`**, **secondary text `#5B6573`**, **borders `#D3DBE6`**, **control borders `#C6D0DE`**.
- **Status colors are semantic, not brand**, always a dot plus a label on a light tint: Confirmed/Completed `#047857` on `#ECFDF5`; Pending/Checked in `#92400E` on `#FFFBEB`; In progress `#015C9A` on `#E6F1F8`; Cancelled/No-show `#B91C1C` on `#FEF2F2`; Rescheduled `#5B6573` on `#EEF1F5`.

## Typography

Plus Jakarta Sans for titles, headings, names and big numbers; Inter for UI and data. Tabular figures on tables, times, prices and vitals. Arabic layouts mirror right-to-left.

## Layout

- **Desktop staff app:** fixed 260px white sidebar with a hairline right border; the active item is a navy-tinted pill (`#E8EEF6` fill, navy text, a 3px navy bar on the leading edge). Top bar white with a hairline bottom border: page title, branch switcher, global search, language toggle "EN | عربي", notification bell (orange unread dot), avatar.
- **Public site:** white navbar with hairline border, search-first hero with a large white search panel floating over a navy band or photo.
- **Mobile patient portal:** bottom navigation, 44px touch targets, full-width cards.

## Elevation & Shapes

Flat: white cards with a 1px `#D3DBE6` border and at most `0 1px 3px rgba(19,38,59,0.06)`. Menus and dialogs get `0 8px 24px rgba(19,38,59,0.10)`. Radius: inputs and buttons 10px, cards 12px, dialogs 16px, chips and pills full.

## Components

- **Primary button:** navy fill, white text, 10px radius, semibold. **Secondary:** white fill, navy text, `#C6D0DE` border. **Ghost:** transparent, `#5B6573` text, hover `#EEF1F5`. **Destructive:** `#B91C1C` fill.
- **Inputs:** white, `#C6D0DE` border, 10px radius, 2px `#015C9A` focus ring.
- **Search panel:** white, 12px radius, soft shadow, fields separated by hairline dividers, navy Search button.
- **Cards:** white, hairline border, 20px padding, title in Plus Jakarta Sans, meta in `#5B6573`.
- **Tabs and segmented filters:** navy text and a 2px navy underline for the active tab, or a navy pill for segmented controls.
- **Role badges:** pill chips with tinted backgrounds (Doctor navy, Patient info blue, Admin violet `#6B21A8` on `#F3E8FF`).
