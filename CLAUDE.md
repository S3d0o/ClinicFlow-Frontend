# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on http://localhost:3000 (the backend's CORS default expects this port)
- `npm run build` — `tsc -b` type-check, then `vite build` to `dist/`. This is the only type-check; run it to validate changes
- `npm run lint` — ESLint (flat config, typescript-eslint + react-hooks + react-refresh)
- `npm run preview` — serve the built `dist/`

There is no test framework configured. `npm run lint` has a known baseline of 22 errors (mostly `react-hooks/set-state-in-effect`); don't add new ones. Non-component exports (constants, helpers) belong in `src/lib/`, not in `.tsx` component files, or `react-refresh/only-export-components` fails.

## Documentation

Human-facing docs live in `docs/`: `ARCHITECTURE.md`, `FEATURES.md`, `DEVELOPMENT.md`, `BACKEND_OVERVIEW.md`, `KNOWN_ISSUES.md` (open issues + roadmap), and `API_CONTRACT.md`. When a change alters behavior described there (routes, auth flow, page rules, known issues), update the matching doc in the same change.

## Backend / API

- The app talks to the ClinicFlow .NET backend (separate repo). `docs/API_CONTRACT.md` is the source of truth for endpoints, request/response shapes, enums, error codes and known quirks — read the relevant section before adding or changing an API call. It is a mirrored copy of `ClinicFlow.Backend/docs/API_CONTRACT.md`.
- Base URL comes from `VITE_API_URL` (`src/api/axios.ts`); the axios instance uses `${VITE_API_URL}/api`. `.env` and `.env.production` leave it empty, so requests are relative `/api/...`:
  - In Docker, `nginx.conf` proxies `/api` to `http://backend:8080`.
  - `vite.config.ts` has **no dev proxy**, so for local dev set `VITE_API_URL` (e.g. `https://localhost:7129` or `http://localhost:5143`) in `.env.local`.
- Contract conventions that bite: enums are strings; `DateOnly` = `yyyy-MM-dd`; slot/schedule times are clinic wall-clock (don't timezone-convert); DB timestamps are UTC but may lack the `Z` suffix; list endpoints return bare arrays; business errors are ProblemDetails where `title` is the error code (e.g. `Doctor.NotFound`) — branch on the code (`getApiErrorCode`), not status. Validation errors (400) have PascalCase keys under `errors`.

## Architecture

- **Entry**: `src/main.tsx` mounts `<HashRouter>` (hash routing is required — backend emails link to `/#/confirm-email` and `/#/reset-password`; see API contract §8). It also installs a MutationObserver that strips Radix's `pointer-events`/`padding-right` body styles; keep it.
- **Routing**: all routes live in `src/App.tsx`. Every page is wrapped in `AppLayout` (skip link, sticky Navbar, `<main>` with `Suspense`, Footer); role-restricted pages are wrapped in `ProtectedRoute allowedRoles={['Patient'|'Doctor'|'Admin']}`, which passes `state.from` to `/login` so users return after signing in. Route prefixes: `/patient/*`, `/doctor/*`, `/admin/*`; `/notifications` is any authenticated user. Pages other than `LandingPage` are lazy-loaded via the `page()` helper — register new pages the same way. Role navigation lives in `navByRole` in `src/components/Navbar.tsx`.
- **API layer** (`src/api/`): one module per resource exporting a plain object of typed functions (e.g. `appointmentsApi.book`, `.cancel`), all re-exported from `src/api/index.ts`. Import from `@/api`. Response/request types live in `src/types/index.ts`.
- **Auth** is split across two files:
  - `src/api/axios.ts` holds the tokens in module variables (seeded from `localStorage`), injects the Bearer header, and on 401 performs a single-flight refresh (`POST /auth/refresh-token`; refresh tokens are single-use) while queuing concurrent requests. Queued requests are rejected if the refresh fails. Only a 4xx from refresh ends the session (`clearSession()` + a `window` `auth:logout` event); network errors and 5xx keep the tokens (API contract §2.3 rule 4).
  - `src/context/AuthContext.tsx` (`useAuth()`) owns React auth state (`isAuthenticated`, `role`, `user`, `isLoading`), restores the session on load by calling `profileApi.getMyProfile()` (clears it only on a 4xx), and listens for `auth:logout` to reset state and redirect to `/login`.
  - Session data in `localStorage`: `accessToken`, `refreshToken`, `expiresAt`, `userRole`, `userName`, `userEmail`. Always go through `saveSession()` / `clearSession()` from `@/api`; never `localStorage.clear()`.
- **Pages** (`src/pages/`) are self-contained: they call `@/api` directly with `useState`/`useEffect` (no data-fetching library or global store), and report results with `toast` from `sonner`. Error pattern: `catch (err) { toast.error(getApiErrorMessage(err, '<fallback>')) }` from `@/lib/api-error` — never show `err.response.data.title` (it's an error code). Where users can fire requests faster than they resolve, ignore stale responses with a `useRef` request counter (see `DoctorsPage`, `BookAppointmentPage`).
- **UI / design system** (details: `docs/ARCHITECTURE.md` §9):
  - Tokens are HSL triplets in `src/index.css`, mapped in `tailwind.config.js` as `hsl(var(--x) / <alpha-value>)`, so opacity modifiers work. Use tokens (`primary`, `secondary`, `muted-foreground`, `success`/`warning`/`info`/`destructive` on a `/10` tint of themselves), never raw palettes (`teal-600`, `slate-500`) or decorative gradients. Fonts: Inter (UI) and Fraunces via `font-display` (page titles only).
  - Build pages from the shared components: `layout/Page` (`Page`, `PageHeader`), `layout/AuthLayout`, `states` (`LoadingState`/`EmptyState`/`ErrorState`), `form/Field` (wires label/hint/error/aria to the control), `form/PasswordInput`, `StatusBadge`, `UserAvatar`, `DateTile`, `FilterTabs`, `Pagination`, `StatCard`, `Rating`.
  - Display times with `formatTime`/`formatTimeRange` and parse API timestamps with `parseUtc` (`src/lib/format.ts`).
  - shadcn/ui primitives in `src/components/ui/` were generated for **Tailwind v4** but the project runs **Tailwind 3**: v4-only syntax (`aria-invalid:`, `outline-hidden`, `max-h-(--var)`, `*:data-[…]`) silently does nothing. Use `aria-[invalid=true]:`, `[var(--x)]` etc. when editing or adding them.
  - Icons: `lucide-react` (decorative icons `aria-hidden`; icon-only buttons need `aria-label`). Animation: `framer-motion` under `<MotionConfig reducedMotion="user">`. Charts: `recharts` (admin dashboard only; colors are hex copies of the tokens).
- **Path alias**: `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## TypeScript

`tsconfig.app.json` is strict with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (use `import type` for type-only imports) and `erasableSyntaxOnly` (no `enum`s or parameter properties). Unused imports fail `npm run build`.

## Deployment

`DockerFile` (tracked in git with a capital F; use `docker build -f DockerFile`) builds with Node 20 and serves `dist/` from nginx on port 80 (`nginx.conf`, SPA fallback to `index.html`, `/api` proxied to the `backend` service). `vite.config.ts` sets `base: './'`.
