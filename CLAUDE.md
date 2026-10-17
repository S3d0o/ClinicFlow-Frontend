# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on http://localhost:3000 (the backend's CORS default expects this port)
- `npm run build` — `tsc -b` type-check, then `vite build` to `dist/`. This is the only type-check; run it to validate changes
- `npm run lint` — ESLint (flat config, typescript-eslint + react-hooks + react-refresh)
- `npm run preview` — serve the built `dist/`
- `npm test` — run the Vitest suite once (`npm run test:watch` to re-run on change); single file: `npx vitest run src/api/axios.test.ts`

Tests use Vitest + jsdom + Testing Library, sit next to the code as `*.test.ts(x)` (setup in `src/test/setup.ts`, config in `vitest.config.ts`), and import `describe`/`it`/`expect` from `vitest` explicitly (no globals). Page tests mock `@/api` with `vi.mock`; `src/api/axios.test.ts` swaps axios's adapter so the real interceptors run. `npm run lint` is clean (0 errors) and CI fails on any error. Non-component exports (constants, helpers, hooks, contexts) go in a `.ts` file, not in a `.tsx` component file, or `react-refresh/only-export-components` fails: usually `src/lib/`; next to the component when it belongs to it (`ui/button-variants.ts`, `context/auth-context.ts`).

CI (`.github/workflows/ci.yml`, GitHub Actions) runs on every push and on PRs to `main`: `npm ci`, lint, test and build on Node 22, plus a `docker build -f DockerFile` in a separate job.

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
- **Routing**: all routes live in `src/App.tsx`, nested under the `AppLayout` layout route, which stays mounted across navigation and renders pages via `<Outlet />` (skip link; for signed-in users the `shell/AppShell` sidebar + top bar, for visitors the top `Navbar` and `Footer`; `<main>` with a per-route `ErrorBoundary` and `Suspense`); role-restricted pages are nested under the layout route `<Route element={<ProtectedRoute roles={['Doctor']} />}>`, which passes `state.from` to `/login` (and sends a wrong role to its own `homeByRole`); `/login`, `/register/*` and `/forgot-password` sit under `GuestOnlyRoute`. After sign-in, `postLoginPath(role, from)` in `src/lib/navigation.ts` picks the destination. Route prefixes: `/patient/*`, `/doctor/*`, `/admin/*`; `/notifications` is any authenticated user. Pages other than `LandingPage` are lazy-loaded via the `page()` helper — register new pages the same way. Role navigation lives in `navByRole` in `src/lib/navigation.ts`.
- **API layer** (`src/api/`): one module per resource exporting a plain object of typed functions (e.g. `appointmentsApi.book`, `.cancel`), all re-exported from `src/api/index.ts`. Import from `@/api`. Response/request types live in `src/types/index.ts`.
- **Auth** is split across two files:
  - `src/api/axios.ts` holds the tokens in module variables (seeded from `localStorage`), injects the Bearer header, and on 401 performs a single-flight refresh (`POST /auth/refresh-token`; refresh tokens are single-use, and reusing a rotated one can revoke all the user's sessions) while queuing concurrent requests. The refresh runs under a cross-tab Web Lock and first re-reads `localStorage`, so a tab reuses a token another tab just obtained; a `storage` listener keeps tabs in sync. Requests time out after 20 s. Queued requests are rejected if the refresh fails. Only a 4xx from refresh ends the session (`clearSession()` + a `window` `auth:logout` event); network errors and 5xx keep the tokens (API contract §2.3 rule 4).
  - `src/context/AuthContext.tsx` (`AuthProvider`; `useAuth()` and the context live in `src/context/auth-context.ts`) owns React auth state (`isAuthenticated`, `role`, `user`, `isLoading`), restores the session on load by calling `profileApi.getMyProfile()` (clears it only on a 4xx), and listens for `auth:logout` to reset state and redirect to `/login`.
  - Session data in `localStorage`: `accessToken`, `refreshToken`, `expiresAt`, `userRole`, `userName`, `userEmail`. Always go through `saveSession()` / `clearSession()` from `@/api`; never `localStorage.clear()`.
- **Pages** (`src/pages/`) are self-contained: they load data with `useApiQuery(load, key)` from `src/hooks/use-api-query.ts` (returns `data`, `loading`, `error`, `reload`, `setData`; put every request input in `key`, older responses are ignored) and render `ErrorState` with `onRetry={reload}` on `error`, never an empty state. No data-fetching library or global store. Mutations report results with `toast` from `sonner`. Error pattern: `catch (err) { toast.error(getApiErrorMessage(err, '<fallback>')) }` from `@/lib/api-error` — never show `err.response.data.title` (it's an error code).
- **UI / design system** (details: `docs/ARCHITECTURE.md` §9):
  - Tokens are HSL triplets in `src/index.css`, mapped in `tailwind.config.js` as `hsl(var(--x) / <alpha-value>)`, so opacity modifiers work. Use tokens (`primary`, `secondary`, `muted-foreground`, `success`/`warning`/`info`/`destructive` on a `/10` tint of themselves), never raw palettes (`teal-600`, `slate-500`) or decorative gradients. `primary` is eucalyptus (actions), `ink` is deep slate (structure, `strong` buttons). Fonts: Inter (UI) and Plus Jakarta Sans via `font-display` (titles, headings, names). Use the Stitch type scale (`text-headline-xl`, `text-title-sm`, `text-body-md`, `text-label-md`, …); `cn()` knows these sizes, so register any new one in `src/lib/utils.ts`. Radius: controls `rounded-lg`, panels `rounded-xl`, cards `rounded-2xl`, chips `rounded-full`.
  - Build pages from the shared components: `layout/Page` (`Page`, `PageHeader`), `layout/AuthLayout`, `states` (`LoadingState`/`EmptyState`/`ErrorState`), `form/Field` (wires label/hint/error/aria to the control), `form/PasswordInput`, `form/IconInput`, `form/FormAlert`, `StatusBadge`, `RoleBadge`, `UserAvatar`, `DateTile`, `FilterTabs`, `Pagination`, `StatCard`, `Rating`.
  - Display times with `formatTime`/`formatTimeRange` and parse API timestamps with `parseUtc` (`src/lib/format.ts`).
  - shadcn/ui primitives in `src/components/ui/` were generated for **Tailwind v4** but the project runs **Tailwind 3**: v4-only syntax (`aria-invalid:`, `outline-hidden`, `max-h-(--var)`, `*:data-[…]`) silently does nothing. Use `aria-[invalid=true]:`, `[var(--x)]` etc. when editing or adding them.
  - Icons: `lucide-react` (decorative icons `aria-hidden`; icon-only buttons need `aria-label`). No animation library: the landing page's scroll reveal is an `IntersectionObserver` plus `motion-safe:` transitions, so it respects reduced motion. No charts library in use: the admin breakdown is token-colored `div`s.
- **Path alias**: `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## TypeScript

`tsconfig.app.json` is strict with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (use `import type` for type-only imports) and `erasableSyntaxOnly` (no `enum`s or parameter properties). Unused imports fail `npm run build`.

## Deployment

`DockerFile` (tracked in git with a capital F; use `docker build -f DockerFile`) builds with Node 22 (Vitest needs it) and serves `dist/` from nginx on port 80 (`nginx.conf`, SPA fallback to `index.html`, `/api` proxied to the `backend` service). `vite.config.ts` sets `base: './'` and puts React and the router in their own `react` chunk so it stays cached across deploys.
