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
- `npm run build` — `tsc -b` type-check (tests and translation keys included), then `vite build` to `dist/`. This is the only type-check; run it to validate changes
- `npm run lint` — ESLint (flat config, typescript-eslint + react-hooks + react-refresh)
- `npm run preview` — serve the built `dist/`
- `npm test` — run the Vitest suite once (`npm run test:watch` to re-run on change); single file: `npx vitest run src/app/routes/access.test.ts`

Node 22 is required. Tests use Vitest + jsdom + Testing Library, sit next to the code as `*.test.ts(x)` (setup in `src/test/setup.ts`, which runs the UI in English; config in `vitest.config.ts`), and import `describe`/`it`/`expect` from `vitest` explicitly (no globals). Test pure rules directly, mock adapters with `createMockDb()` + `memorySessionStore()` + `latencyMs: 0`, and screens with `renderApp({ path, signedInAs })` (`src/test/render-app.tsx`: real routes, shells and guards on a fresh mock backend). `src/shared/api/http-client.test.ts` swaps axios's adapter so the real interceptors run. `npm run lint` is clean (0 errors) and CI fails on any error. Non-component exports (constants, helpers, hooks, contexts) go in a `.ts` file, not in a `.tsx` component file, or `react-refresh/only-export-components` fails (e.g. `shared/ui/button-variants.ts`, `shared/ui/main-content.ts`, `features/org/hooks/active-branch.ts`).

CI (`.github/workflows/ci.yml`, GitHub Actions) runs on every push and on PRs to `main`: `npm ci`, lint, test and build on Node 22, plus a `docker build -f DockerFile` in a separate job.

## Documentation

Human-facing docs live in `docs/`: `ARCHITECTURE.md`, `FEATURES.md`, `DEVELOPMENT.md` (demo accounts, how to build a screen or add a service), `BACKEND_OVERVIEW.md`, `KNOWN_ISSUES.md` (open issues + the V2 phase tracker), and `API_CONTRACT.md`. The V2 designs are in `design-v2/` (`README.md`, `DESIGN.md`, `UX_NOTES.md`, `screens/<area>/<NN-name>/` with `code.html` + `screen.png`). When a change alters behavior described in the docs (routes, auth flow, page rules, known issues), update the matching doc in the same change.

## Backend / API

- **V2 runs on an in-memory mock backend** (`src/mocks`) until the `/api/v2` endpoints exist. Screens never know: they use service interfaces, and HTTP adapters will replace the mocks behind them.
- `docs/API_CONTRACT.md` is the source of truth for endpoints, shapes, enums, error codes and quirks, and the backend's `docs/v2/07_API_DESIGN.md` for the `/api/v2` direction; model service types on them. The contract is a mirrored copy of `ClinicFlow.Backend/docs/API_CONTRACT.md` (from the backend's `v2` branch on `v2`, from `master` on `main`).
- `src/shared/api/http-client.ts` (V1's tested axios client: `${VITE_API_URL}/api`, single-flight token refresh under a cross-tab Web Lock, `saveSession()`/`clearSession()`, never `localStorage.clear()`) is kept for the HTTP adapters. `.env` files leave `VITE_API_URL` empty (relative `/api`, proxied by nginx in Docker; there is no Vite dev proxy).
- Contract conventions that bite: enums are strings; `DateOnly` = `yyyy-MM-dd`; slot/schedule times are branch wall-clock (don't timezone-convert); timestamps are UTC and end in `Z` on `v2` (`parseUtc` handles both); lists are bare arrays with `X-Total-Count`; money is EGP; error bodies are ProblemDetails where `title` is the error code (e.g. `Doctor.NotFound`). In the app, business errors are `ServiceError` codes (`src/shared/api/service-error.ts`): branch on `code`, never on a message or status.

## Architecture

Details and rationale: `docs/ARCHITECTURE.md`. Clean code and SOLID are a requirement of the owner.
- **Layers** (feature-first): `src/app` (composition root: `App`, `AppProviders`, `services.ts` DI container, `i18n.ts`, `locales.ts`, `routes/`, `navigation.ts`, generic pages) → `src/shells` (frames) → `src/features/<domain>/{model,api,hooks,components,pages,i18n}` → `src/shared/{ui,lib,i18n,api}` (domain-free). `src/mocks` is the mock backend; `src/styles` the theme. Shared code never imports features.
- **Responsibilities:** a page composes hooks and components; a component renders props; a rule is a pure function in `model/` (unit-tested); validation is a zod schema (react-hook-form); data access is a service.
- **Services (ports and adapters):** each feature declares an interface in `api/<domain>.service.ts` and a mock in `api/<domain>.mock.ts` over the shared `MockDb` (`src/mocks/db.ts`, seeds in `src/mocks/seed/`). `Services` (`src/app/services.ts`) collects them; `createMockServices()` wires them in `main.tsx`; screens get them with `useServices()` and wrap them in TanStack Query hooks (query keys next to the hook; mutations invalidate what they change). Mocks `await delay(latencyMs)` and throw `ServiceError`. Pages never import from `src/mocks`.
- **Routing:** `HashRouter` is required (backend emails link to `/#/confirm-email` and `/#/reset-password`; API contract §8). Every screen is a `ScreenRoute` in `src/app/routes/catalog/*.routes.ts` (path, `screen` title key, layout, access, phase, design folder, lazy `component`); `AppRoutes` builds the tree, and a screen without `component` shows `ComingSoonPage`. To build a screen, set its lazy default-export page as `component`.
- **Access:** `decideAccess` (`src/app/routes/access.ts`) with kinds `public`, `guest`, `signed-in`, `patient`, `applicant`, `permission` (`anyOf`, optional `minScope`). Check **permissions, never role names** (backend ADR 0002); actions use `can(user, permission, branchId)` from `features/auth/model/access.ts`. `RouteGuard` sends signed-out users to `/sign-in` with `state.from` and, once signed in, on to `postSignInPath` (the requested page if `canOpenPath`, else `homePath`). The mock's permissions come from the 02 §6 matrix in `src/mocks/seed/role-permissions.ts`.
- **Navigation:** `src/app/navigation.ts` (staff groups, patient tabs, public links). Items show when their route's access allows, so adding a screen never edits a shell. Staff branch: `ActiveBranchProvider` / `useActiveBranch()` (`features/org`).
- **Translation and RTL:** Arabic (default, RTL) and English via i18next; namespaces in `src/shared/i18n/locales/{en,ar}/` and feature `i18n/` folders, registered in `src/app/locales.ts`. English files define typed keys (`src/app/i18next.d.ts`); Arabic must have the same keys (`locales.test.ts`). Every visible string is translated. Format with `src/shared/lib/intl.ts` (EGP, numbers, wall-clock times, dates; Latin digits in Arabic). Use logical classes only (`ms-`, `ps-`, `start-`, `end-`, `text-start`, `border-e`); `rtl-flip` on directional icons; wrap Latin or numeric values inside Arabic text in `<bdi dir="ltr">` (`Trans` for translated strings).
- **UI / design system** (ClinicFlow Navy, `design-v2/DESIGN.md`; details `docs/ARCHITECTURE.md` §8):
  - Colors and fonts are tokens in `src/styles/tokens.css` (the one theme file), mapped in `tailwind.config.js` as `hsl(var(--x) / <alpha-value>)`. Use tokens: `primary` navy (actions, selected states), `ink` deep navy (structure, headings), `secondary`/`accent` tonal, `highlight` orange **only** for small accents (unread dots, tags, active underline), `success`/`warning`/`info`/`destructive` on a `/10` tint of themselves. No raw palettes or gradients; no green brand color. Fonts: Inter + Plus Jakarta Sans (`font-display`) in English, IBM Plex Sans Arabic in Arabic. Type scale `text-headline-xl`, `text-title-sm`, `text-body-md`, `text-label-md`, …; `cn()` (`src/shared/lib/cn.ts`) knows these sizes, so register new ones there. Radius: controls `rounded-lg`, cards `rounded-xl`, dialogs `rounded-2xl`, chips `rounded-full`.
  - Frames in `src/shells`: `PublicLayout`, `AuthLayout`, `PatientShell` (mobile bottom tabs), `StaffShell` (260px sidebar + top bar), `TabletShell` (nurse rail), `BareLayout`; all render pages through `ScreenOutlet` (`<main>`, per-path `ErrorBoundary`, `Suspense`).
  - Shared components in `src/shared/ui`: `PageHeader`, `StatusChip` (tone + dot + text; features map their statuses to tones in one place), `Field` (render prop wiring label, hint, error and aria), `StatTile`, `Avatar`, `Logo`, `LanguageToggle`, `LoadingState`/`ErrorState`/`EmptyState` (a failed load shows `ErrorState` with a retry, never an empty state), and the Radix primitives. Toasts: `toast` from `sonner`.
  - The Radix (shadcn/ui) primitives were generated for **Tailwind v4** but the project runs **Tailwind 3**: v4-only syntax (`aria-invalid:`, `outline-hidden`, `max-h-(--var)`, `*:data-[…]`) silently does nothing. Use `aria-[invalid=true]:`, `[var(--x)]` etc.
  - Icons: `lucide-react` (decorative icons `aria-hidden`; icon-only buttons need `aria-label`). Charts: `recharts`, only inside the lazily loaded manager dashboard (phase 5).
  - Take layout from `design-v2/screens/*` and behavior and data from the V2 docs; leave out the invented Stitch content listed in `design-v2/README.md`.
- **Path alias**: `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## TypeScript

`tsconfig.app.json` is strict with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (use `import type` for type-only imports) and `erasableSyntaxOnly` (no `enum`s or parameter properties). Unused imports fail `npm run build`.

## Deployment

`DockerFile` (tracked in git with a capital F; use `docker build -f DockerFile`) builds with Node 22 (Vitest needs it) and serves `dist/` from nginx on port 80 (`nginx.conf`, SPA fallback to `index.html`, `/api` proxied to the `backend` service). `vite.config.ts` sets `base: './'` and puts React and the router in their own `react` chunk so it stays cached across deploys.
