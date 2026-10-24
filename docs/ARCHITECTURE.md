# ClinicFlow Frontend — Architecture (V2)

How the V2 app is put together: layers, startup, routing and access, the service layer and its mock backend, translation and right-to-left, the UI system, and the build. For what each screen does, see [FEATURES.md](FEATURES.md). For setup and day-to-day work, see [DEVELOPMENT.md](DEVELOPMENT.md). For the API, see [API_CONTRACT.md](API_CONTRACT.md); for the V2 plan, the backend repo's `docs/v2/`.

The V2 UI is a fresh build from the Stitch designs in [`design-v2/`](../design-v2/README.md), done in phases (see [KNOWN_ISSUES.md](KNOWN_ISSUES.md#v2)). Screens not built yet show a placeholder naming their phase and design.

---

## 1. Overview

| Concern | Technology |
|---|---|
| UI | React 19, TypeScript 5.9 (`strict`) |
| Build / dev server | Vite 7 (port 3000) |
| Routing | react-router-dom 7, `HashRouter` |
| Server state | TanStack Query 5 |
| Forms | react-hook-form + zod (schemas kept apart from the UI) |
| Translation | i18next + react-i18next; Arabic (default, right-to-left) and English |
| Styling | Tailwind CSS 3 on CSS-variable tokens (ClinicFlow Navy) |
| Components | Radix UI primitives (shadcn/ui, adapted to Tailwind 3) |
| HTTP | axios client with token refresh (kept for the HTTP adapters; not wired yet) |
| Feedback / icons / dates | sonner, lucide-react, date-fns + `Intl` |
| QR codes | qrcode (SVG, only in the two-step setup chunk) |
| Tests | Vitest, Testing Library, jsdom |

### Layers and folders

```
src/
├── main.tsx         Entry: starts i18n, picks the backend (mock today), renders <App>
├── app/             Composition root: App, providers, the service container, i18n setup,
│                    the screen catalog and router, navigation config, generic pages
├── shells/          The frames screens render in: public, auth, patient, staff, tablet, bare
├── features/<x>/    One folder per business domain (auth, org, catalog, doctors, recruitment, site, appointments,
│                    visits, billing, documents, profile, notifications, records, … more per phase):
│   ├── model/       types and pure domain rules (no React)
│   ├── api/         <x>.service.ts (the interface) and <x>.mock.ts (the in-memory adapter)
│   ├── hooks/       TanStack Query hooks over the service
│   ├── components/  presentational components (props in, markup out)
│   └── pages/       screens: compose hooks and components
├── shared/          Domain-free building blocks: ui/ (design system), lib/ (cn, format, intl,
│                    phone, password, branch-time, countdown, calendar, download, places, use-now,
│                    use-follow-link), i18n/ (languages, shared strings, error and validation
│                    messages), api/ (HTTP client, errors, paging)
├── mocks/           The in-memory backend: db.ts, seed data, session store, SMS-code store, slot
│                    generator and availability, notification rendering, sample PDF, createMockServices
├── styles/          tokens.css (the theme) and index.css (base styles)
└── test/            setup, fixtures, renderApp helper
```

Dependencies point inward: `shared` imports nothing from features; a feature uses `shared` and its own folders; `app` composes features and shells. Features reach the composition root only through `useServices()` (the service container) and `@/app/routes` helpers.

### How SOLID shows up

- **Single responsibility:** pages compose; components render props; rules live in `model/` functions; validation in zod schemas; data access in services.
- **Open/closed:** screens are entries in the route catalog, menus are entries in `app/navigation.ts`, statuses map to chip tones in one place. Adding a screen never edits a shell.
- **Liskov:** the mock adapters and the future HTTP adapters implement the same interfaces with contract-shaped data and `ServiceError` codes, so either can be wired in.
- **Interface segregation:** small per-domain services instead of one API object. Accounts alone are split by job: `AuthService` (session, sign-in, two-step code), `OtpService`, `RegistrationService`, `PasswordResetService`, `MfaService`, `InvitationService`, `AccountService`. Appointments likewise: `PatientAppointmentsService` (list, book, reschedule, cancel, deposit, review), `QueueStatusService` (the live queue) and `ReminderService` (the signed-out SMS link); documents and insurance cards are `DocumentsService` and `InsuranceService`. Demo-only capabilities are a separate optional `DemoAccountsService`.
- **Dependency inversion:** screens depend on interfaces from `useServices()`; `main.tsx` decides which implementation backs them.

## 2. Startup

1. **`index.html`** starts as `<html lang="ar" dir="rtl">` (Arabic is the default, FR-ACC-06), loads the fonts (IBM Plex Sans Arabic, Inter, Plus Jakarta Sans) and `src/main.tsx`.
2. **`src/main.tsx`**:
   - reloads once when a lazy chunk from an older deploy is gone (`vite:preloadError`, `shared/lib/chunk-reload.ts`);
   - installs the `MutationObserver` that strips Radix's `pointer-events`/`padding-right` body styles (keep it, with the matching rules in `styles/index.css`);
   - calls `initI18n()` (the stored language, else Arabic) and `createMockServices()`;
   - renders `<App services={…} />`.
3. **`app/App.tsx`**: `HashRouter` → `AppProviders` (services, TanStack Query, Radix's `DirectionProvider`, toasts) → `AppRoutes`.

## 3. Routing and access

### The screen catalog

Every screen is one entry in `app/routes/catalog/*.routes.ts` (`ScreenRoute`):

| Field | Meaning |
|---|---|
| `path` | Hash-router path, e.g. `/desk/queue` |
| `screen` | Title key in the `screens` namespace (page title and browser tab title) |
| `layout` | `public`, `auth`, `patient`, `staff`, `tablet` or `bare` |
| `access` | Who may open it (below) |
| `phase` / `design` | The frontend phase that builds it and its folder under `design-v2/screens/` |
| `component` | The lazily loaded page once built; until then `ComingSoonPage` stands in |

`app/routes/AppRoutes.tsx` turns the catalog into one layout route per frame with a guard per screen. Workspace layouts (`patient`, `staff`, `tablet`) first require a signed-in user, so their chrome never renders for visitors.

### Access rules

`Access` (`app/routes/types.ts`) and `decideAccess` (`app/routes/access.ts`):

| Kind | Allowed | Otherwise |
|---|---|---|
| `public` | everyone | — |
| `guest` | signed-out visitors | signed-in users continue to where they were going, or home |
| `signed-in` | any signed-in user | sign-in |
| `patient` | the patient capacity of an account | "no access" |
| `applicant` | doctor applicants | "no access" |
| `permission` | holders of one of `anyOf`, at `minScope` or wider | sign-in, two-step setup (staff who haven't set it up), or "no access" |

Staff screens check **permissions, never role names** (backend ADR 0002). `minScope: 'Branch'` keeps a grant over one's own records (a doctor's own reports) from opening branch-wide screens (the manager dashboard).

`RouteGuard` applies the decision. A signed-out user is sent to `/sign-in` with `state.from`; once signed in, the guard on the guest page sends them to `postSignInPath(user, from, canOpenPath)`: the requested page if they may open it, otherwise their home. Every sign-in path (password, two-step code, demo account) therefore lands the same way.

Staff without an authenticator (`needsMfaSetup`) get `setup-mfa` for every permission screen, which sends them to `/security/setup` (FR-STF-07); their home page is that screen too.

Multi-step account flows (sign-up → code, sign-in → two-step code, reset code → new password) hand data to the next screen through router state (`features/auth/model/flow-state.ts`). A step opened without it restarts its flow, so no code or challenge id sits in a URL. Lockouts and code limits always open `/locked?until=…`.

Home pages (`homePath`, 02 §8): Manager `/manager`, Admin `/admin`, Doctor `/doctor`, Receptionist `/desk`, Nurse `/nurse`, Accountant `/finance`, Patient `/patient`, doctor applicant `/my-application`. With several roles the first in that order wins.

### Why hash routing

Backend emails link to `/#/reset-password?…` and `/#/confirm-email?…` (API contract §8), so the app keeps `HashRouter`. In-page anchors therefore can't use `#id` links; the skip link moves focus itself.

### Navigation

`app/navigation.ts` holds the staff menu (groups: front desk, nurse station, clinical, management, finance, administration, account), the patient tab bar and the public links. An item names a path; `visibleStaffNav(user)` shows it only when that route's access rule allows the user, so menus and guards always agree. An item is highlighted on its own path and on the paths in its `activeFor` (`isNavItemActive`): the patient's Records tab stays selected on visits, invoices and documents, which share one set of tabs (`features/records/components/RecordsTabs.tsx`).

## 4. Services and the mock backend

- **Ports:** each feature declares an interface in `features/<x>/api/<x>.service.ts`. `app/services.ts` collects them in `Services`, provided by `ServicesProvider` and read with `useServices()`.
- **Adapters:** `features/<x>/api/<x>.mock.ts` implements the interface against `mocks/db.ts`, an in-memory database seeded from `mocks/seed/`. All adapters share one database, so a change on one screen shows up on the others. Every adapter gets `MockDeps`: the database, `latencyMs` (250 ms in the app, 0 in tests) so loading states are visible, `now()`, so tests control time, `outboxDelayMs` (2 s in the app: notifications arrive after the action, like the backend's outbox) and `queueTickMs` (20 s in the app: the demo queue moves on). Both timings are 0 in tests. Dated seeds (interviews, invitations, reviews, the patient's appointments, visits and invoices) are made relative to `now`, so the demo never goes stale.
- **What the mock enforces** (as the backend will): SMS codes (`mocks/otp-store.ts`: 6 digits, 5 minutes, 5 tries, 60 s between sends, 15-minute block), sign-in lockout (5 failures, 15 minutes), uniform answers that never reveal whether an account exists, single-use invitation and email-link tokens, price resolution (`features/catalog/model/pricing.ts`, FR-SVC-02), slot generation from weekly shifts in branch time (`mocks/slots.ts`), the doctor-application rules (one open application, PDF/DOCX up to 5 MB, 90-day cool-down), and the booking rules: a slot taken once (`mocks/slot-availability.ts` subtracts booked appointments from the generated slots), no booking in the past, consent required, changes only while Confirmed and more than `CHANGE_WINDOW_HOURS` (2, `features/appointments/model/policy.ts`, read by the screens and the mock alike) before the start, one review per visit. Reminder links stop working after the visit day. Notifications (`mocks/notifications.ts`) are rendered in the recipient's language when they are created, as the backend does, and queued with the outbox delay.
- **Errors:** adapters throw `ServiceError` with the API's codes (`Auth.InvalidCredentials`, …, `shared/api/service-error.ts`) and optional `details` (`attemptsLeft`, `retryAt`, from ProblemDetails extensions in the HTTP adapters). The query client never retries them.
- **Permissions in the mock:** `mocks/seed/role-permissions.ts` reproduces the default role × permission matrix (02 §6) that the real backend resolves into `/me`, including scopes; `grantsFor` keeps the widest scope across roles.
- **Session:** the mock auth service remembers the signed-in demo user in `localStorage` (`clinicflow:demo-session`), so a reload keeps the session.
- **Live data:** `QueueStatusService.watch(appointmentId, listener)` pushes queue changes and returns an unsubscribe; the HTTP adapter can back it with SignalR or polling without touching the screens. The unread-notification count polls every 60 s and refreshes on every page change until `/hubs/notifications` is wired.
- **Leaving the app:** payment checkouts return a URL; `useFollowLink` (`shared/lib/use-follow-link.ts`) navigates in the app for a path (the mock's "checkout" returns straight to `?payment=success`) and leaves for Paymob's page otherwise. Files the patient downloads (PDFs, `.ics`) go through `shared/lib/download.ts`.
- **Server state:** hooks wrap services in TanStack Query (`features/auth/hooks/use-session.ts` keeps the current user under `['auth', 'me']`). Signing out clears the whole cache.
- **Swapping in the API:** write `<x>.http.ts` adapters on `shared/api/http-client.ts`, map ProblemDetails to `ServiceError`, and build `Services` from them in `main.tsx`. Nothing else changes.

## 5. Session over HTTP (kept for the API adapters)

`shared/api/http-client.ts` is V1's tested axios client, moved unchanged. The auth adapter will use it once `/api/v2/auth` exists:
- tokens in memory and in `localStorage` (`saveSession()` / `clearSession()`, never `localStorage.clear()`);
- on a 401, one **single-flight refresh** under a cross-tab Web Lock (refresh tokens are single use; reusing a rotated one can revoke every session, contract §2.3), reusing a token another tab just stored;
- only a 4xx from the refresh ends the session (an `auth:logout` window event); network errors and 5xx keep the tokens;
- 20-second request timeout.

`http-client.test.ts` covers the refresh and cross-tab behavior.

## 6. Errors and states

- Business errors are `ServiceError` codes; screens branch on `code`, never on a message. `useErrorMessage()` (`shared/i18n/use-messages.ts`) turns one into a sentence from `common:errors.<Module>.<Reason>`, filled with its details, or a generic message for unknown codes and network failures. `shared/api/api-error.ts` (from V1) maps HTTP error bodies to codes and messages for the HTTP adapters; its messages move to translations when those adapters land.
- A failed load renders `ErrorState` with a retry, never an empty state. Loading renders `LoadingState`.
- Each screen sits in an `ErrorBoundary` keyed by path (`shells/ScreenOutlet.tsx`), so a crash shows "This page couldn't be displayed" and leaving the page clears it.

## 7. Translation and right-to-left

- **Languages:** `ar` (default) and `en` (`shared/i18n/languages.ts`). The choice is stored as `clinicflow:language`; `initI18n` and every change set `<html lang dir>`.
- **Namespaces:** `common`, `nav`, `screens` in `shared/i18n/locales/{en,ar}/`; features add their own and register them in `app/locales.ts`. The English files define the keys and are typed (`app/i18next.d.ts`), so a wrong key fails `npm run build`. `locales.test.ts` checks that Arabic has exactly the English keys and no empty strings.
- **Formatting:** `shared/lib/intl.ts` formats money (EGP), numbers, branch wall-clock times and dates with `Intl`, using Egyptian Arabic with Latin digits (`ar-EG-u-nu-latn`), so prices, phone numbers and ticket numbers read the same in both languages.
- **Layout:** logical utilities only (`ms-`, `ps-`, `start-`, `end-`, `text-start`, `border-e`); sheets open from the start side. Radix primitives read the direction from `DirectionProvider` in `AppProviders`; without it tabs, menus and selects lay their content out left to right. Directional icons (arrows, chevrons, sign-out) get the `rtl-flip` class; other icons, numbers, charts and photos are not mirrored. Wrap Latin or numeric values inside Arabic sentences in `<bdi dir="ltr">`. When the value comes inside a translation, wrap only the value, with `Trans` and a tag in the string (`"Invoice <num>{{number}}</num>"`, `components={{ num: <bdi dir="ltr" /> }}`); wrapping the whole sentence lays the Arabic words out backwards.
- **Reference data** has both names (`nameEn`/`nameAr`, R9); `nameIn(item, language)` (`shared/i18n/bilingual.ts`) and `branchName` pick one, and `textIn` picks a free text written in either or both languages (a doctor's bio).
- **Text people typed** (names, reviews, notes) gets `dir="auto"`, so a Latin sentence inside the Arabic layout keeps its punctuation in place.
- **Plurals** use i18next plural keys; Arabic has all six forms (`locales.test.ts` checks them).
- **Branch time:** `shared/lib/branch-time.ts` gives today, the wall-clock time, date arithmetic and wall-clock ↔ UTC conversion in a branch's zone (ADR 0003), independent of the viewer's device zone. UTC timestamps (an interview) are shown with `formatInstant(…, branch.timeZone)`.

## 8. UI system

The theme is **ClinicFlow Navy** (`design-v2/DESIGN.md`): a navy brand in the style of nawy.com, flat surfaces with hairline borders, and an orange accent used sparingly.

### Tokens

All colors are HSL triplets in **`src/styles/tokens.css`** (the one theme file), mapped in `tailwind.config.js` as `hsl(var(--x) / <alpha-value>)`, so opacity modifiers work. Use tokens, never raw palettes or gradients.

| Token | Value | Use |
|---|---|---|
| `primary` (+ `primary-hover`) | Navy `#1E4164` (`#16324E`) | Buttons, links, selected tabs, chips, dates and slots, active nav |
| `ink` | Deep navy `#13263B` | Logo mark, headings, dark bands, `strong` buttons |
| `secondary` / `accent` | `#E8EEF6` | Tonal buttons, selected nav item, avatars / hover fill |
| `highlight` (+ `highlight-strong`) | Orange `#FF5E00` (`#B33F00` for text on its tint) | Unread dots, small tags, the active link underline. Never body text or a large button |
| `info` | `#015C9A` | Information, vitals, the focus ring |
| `success` / `warning` / `destructive` | `#047857` / `#92400E` / `#B91C1C` | Statuses only, as text on a 10% tint of themselves |
| `violet` | `#6B21A8` | Admin role badge |
| `background` / `card` / `muted` | `#F7F9FD` / white / `#EEF1F5` | Canvas / cards and menus / fills inside cards |
| `foreground` / `muted-foreground` | `#212427` / `#5B6573` | Text / secondary text |
| `border` / `input` / `ring` | `#D3DBE6` / `#C6D0DE` / `#015C9A` | Hairlines / control borders / focus |
| `sidebar-*` | White, active `#E8EEF6` | Staff sidebar |

Fonts are tokens too (`--font-sans`, `--font-display`): Inter and Plus Jakarta Sans in English, IBM Plex Sans Arabic in Arabic.

### Type, shape, depth

- Type scale (`text-display-lg` … `text-caption`) as in V1; headings use `font-display`. `cn()` (`shared/lib/cn.ts`) knows the custom sizes; register new ones there.
- Radius: controls `rounded-lg` (10px), panels and cards `rounded-xl` (12px), dialogs `rounded-2xl` (16px), chips `rounded-full`.
- Shadows are faint and navy-tinted: `shadow-xs`, `shadow-card`, `shadow-hover`, `shadow-elevated`.
- Reduced motion is honored globally in `styles/index.css`.

### Shells

| Shell | Used by | Frame |
|---|---|---|
| `PublicLayout` | visitors | Navbar (links, language, sign-in or "My account"; sheet below `lg`), page, footer |
| `AuthLayout` | sign-in, sign-up, recovery, staff onboarding | Slim top bar, a narrow centred column; a screen marked `data-layout="wide"` (two-step setup) widens it |
| `PatientShell` | patient portal | Top bar; five-item bottom tab bar on mobile that moves into the top bar from `md` |
| `StaffShell` | staff workspaces | Fixed 260px sidebar from `lg` (logo, branch switcher, permission-filtered menu, user card), top bar with patient search, language, notifications; sheet below `lg` |
| `TabletShell` | nurse station | 72px icon rail, top bar with branch and user, large targets |
| `BareLayout` | waiting-room TV, SMS reminder page | No chrome |

All shells share `ScreenOutlet` (the `<main>` landmark, error boundary, loading fallback) and `SkipLink`. The staff branch lives in `ActiveBranchProvider` (`features/org`): limited to the user's branches, "All branches" for organization-wide roles, remembered as `clinicflow:active-branch`.

### Shared components (`shared/ui/`)

`Logo`, `LanguageToggle`, `Avatar`, `PageHeader`, `Breadcrumbs`, `Pagination`, `Stepper` (numbered steps, a bar on phones), form controls (`PasswordInput` with show/hide, `PasswordChecklist`, `OtpInput` (six boxes: SMS autofill, paste, auto-submit, always left to right), `PhoneInput` (+20), `Checkbox`, `ChoiceCard` (a radio drawn as a card), `FileDrop`), `FormAlert`, `CopyButton`, `StatusChip` (tones: success, warning, info, danger, neutral, highlight, primary; dot + label), `Field` (wires label, hint, error and `aria-*` to a control through a render prop), `StatTile`, `LoadingState` / `ErrorState` / `EmptyState`, `ErrorBoundary`, `SkipLink`, and the Radix primitives (button, card, dialog, alert-dialog, sheet, select, dropdown-menu, tabs, switch, input, textarea, label, badge, skeleton, spinner, sonner). The primitives use logical direction classes, translated close labels and a 2px focus ring. They were generated for Tailwind v4: v4-only syntax (`aria-invalid:`, `outline-hidden`, `max-h-(--var)`) does nothing in Tailwind 3, so use `aria-[invalid=true]:`, `[var(--x)]` and the compatibility utilities in `styles/index.css`.

Button variants: `default` (navy, the main action), `strong` (deep navy), `outline`, `secondary` (tonal), `ghost`, `destructive`, `destructive-outline`, `link`. Sizes `sm` (36px), `default` (40px), `lg` (44px), `icon*`.

## 9. Build and deployment

- **`vite.config.ts`:** `base: './'`, React plugin, port 3000, alias `@` → `src`, and a `react` chunk (React, React DOM, router) that stays cached across deploys. Screens are lazy chunks.
- **`vitest.config.ts`:** the Vite config plus jsdom and `src/test/setup.ts` (jest-dom, cleanup, English UI, a fresh `localStorage` per test).
- **`npm run build`:** `tsc -b` (type-check including tests and translation keys), then `vite build` into `dist/`.
- **`DockerFile`:** `node:22-alpine` runs `npm ci` and `npm run build`; `nginx:alpine` serves `dist/` on port 80.
- **`nginx.conf`:** SPA fallback (missing `/assets/*` return 404), a year of immutable caching for fingerprinted assets and `no-cache` for `index.html`, gzip, security headers (CSP: scripts from `'self'`; styles and fonts also from Google Fonts; `connect-src 'self'`), and `/api` proxied to `http://backend:8080` with forwarded-IP headers.

See [DEVELOPMENT.md](DEVELOPMENT.md) for running and building.
