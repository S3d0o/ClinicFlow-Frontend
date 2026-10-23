# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## V1 and V2: two product lines

This repo holds two separate products, like the backend (`docs/v2/adr/0007-v2-separate-product-line.md` in the backend repo):
- **`main` is V1.** It's finished, talks to the backend's `master` (contract 3.x) and stays untouched. Change it only when the owner explicitly asks for a V1 fix, on a `fix/<name>` branch off `main`. `legacy-ui` (tag `v0-legacy-ui`) is the original UI: never delete or rewrite it.
- **`v2` is V2.** It started from V1's code and talks to the backend's `v2` branch (contract 4.0.0, pre-releases `4.0.0-p<n>`). Every piece of work gets its own branch off `v2` (`feature/p<phase>-<kebab-case-name>`, or `fix/`, `docs/`, `test/`, `chore/`) and is merged back into `v2`. Never build directly on `v2`, `main` or another feature's branch. If the working tree has uncommitted changes when work starts, ask whether to commit, stash or carry them over.
- Commit or push only when asked.

**The V2 plan lives in the backend repo**, cloned next to this one at `../../ClinicFlow.Backend`. Its working tree may be on a feature branch, so read the merged docs with `git -C ../../ClinicFlow.Backend show v2:<path>`:
- `docs/v2/09_MIGRATION_FROM_V1.md` §4: the frontend work for each phase. A phase is done only when its frontend track is.
- `docs/v2/07_API_DESIGN.md`: the `/api/v2` endpoints and the V1 → V2 differences this app has to handle.
- `docs/v2/10_ROADMAP.md`: phases P0–P7 and the decisions log.
- `docs/v2/plans/P<n>.md`: the backend plan and status of the current phase (which PR changes what the API returns).

**The contract on `v2`:**
- The backend owns it. On `v2`, `docs/API_CONTRACT.md` is a verbatim copy of the backend's `v2` copy; on `main` it mirrors `master` (3.x). Never edit it here, and never copy a 4.x contract onto `main`.
- After a backend contract bump on `v2`, copy it in on a `docs/` branch off `v2` and update the related docs (`KNOWN_ISSUES.md`, `FEATURES.md`, `ARCHITECTURE.md`) in the same change.
- Until a phase adds `/api/v2` endpoints, V2 uses the inherited unversioned `/api/...` routes, which keep working on the backend's `v2` branch. The backend deletes each one once this app stops calling it (backend `docs/v2/09_MIGRATION_FROM_V1.md` §3). For screens whose `/api/v2` endpoints aren't built yet, mock them from the contract and the backend's `docs/openapi.json`.

**Running V2 locally:**
- `dotnet run` on the backend's `v2` branch serves `http://localhost:5143`, the same port as V1, so `.env.local` stays the same. Run only one backend at a time. V2 uses its own database (`ClinicFlowV2`) with the same demo logins.
- Docker: the backend's compose stack (project `clinicflow-v2`) serves this app on port 3001 and the backend on 5002. Build the image from this repo's `v2` branch: `docker build -t clinicflow-frontend-v2 -f DockerFile .`

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

- The app talks to the ClinicFlow .NET backend (separate repo). `docs/API_CONTRACT.md` is the source of truth for endpoints, request/response shapes, enums, error codes and known quirks — read the relevant section before adding or changing an API call. It is a mirrored copy of `ClinicFlow.Backend/docs/API_CONTRACT.md` (from the backend's `v2` branch on `v2`, from `master` on `main`).
- Base URL comes from `VITE_API_URL` (`src/api/axios.ts`); the axios instance uses `${VITE_API_URL}/api`. `.env` and `.env.production` leave it empty, so requests are relative `/api/...`:
  - In Docker, `nginx.conf` proxies `/api` to `http://backend:8080`.
  - `vite.config.ts` has **no dev proxy**, so for local dev set `VITE_API_URL` (e.g. `https://localhost:7129` or `http://localhost:5143`) in `.env.local`.
- Contract conventions that bite: enums are strings; `DateOnly` = `yyyy-MM-dd`; slot/schedule times are clinic wall-clock (don't timezone-convert); timestamps are UTC and end in `Z` on `v2` (contract 4.0.0-p0; on `main` DB timestamps may lack it, and `parseUtc` handles both); list endpoints return bare arrays (notifications and pending doctors add an `X-Total-Count` header); every error body is ProblemDetails (401/403/404/500 have no code in `title`); business errors are ProblemDetails where `title` is the error code (e.g. `Doctor.NotFound`) — branch on the code (`getApiErrorCode`), not status. Validation errors (400) have PascalCase keys under `errors`.

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
