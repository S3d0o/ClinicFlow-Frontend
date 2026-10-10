# ClinicFlow Frontend — Development Guide

How to set up, run, change and check the frontend. For how the code is organized, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Prerequisites

| Tool | Why |
|---|---|
| Node.js 20+ and npm | Install, run and build the app (the Docker build uses Node 20) |
| The ClinicFlow backend | The app has no mock data; every page talks to the API. See [BACKEND_OVERVIEW.md](BACKEND_OVERVIEW.md) and the backend repo's `docs/SETUP_AND_DEPLOYMENT.md` |
| Docker Desktop (optional) | Running the full stack (database + backend + frontend) in containers |

```bash
git clone https://github.com/S3d0o/ClinicFlow-Frontend.git
cd ClinicFlow-Frontend
npm install
```

## 2. Configuration

The only setting is **`VITE_API_URL`**: the backend's origin, **without** `/api`. The app adds `/api` itself.

| File | Committed | Value | Used by |
|---|---|---|---|
| `.env` | Yes | `VITE_API_URL=` (empty) | Default for every mode |
| `.env.production` | Yes | `VITE_API_URL=` (empty) | `npm run build` / Docker image |
| `.env.local` | **No** (git-ignored) | e.g. `VITE_API_URL=http://localhost:5143` | Your local development |

When it's empty, requests go to the **same origin** (`/api/...`). That's correct behind nginx in Docker, which forwards `/api` to the backend. The Vite dev server has **no proxy**, though, so for local development you must create `.env.local`:

```bash
# .env.local
VITE_API_URL=http://localhost:5143      # backend "http" launch profile
# VITE_API_URL=https://localhost:7129   # backend "https" profile (needs the .NET dev certificate trusted)
```

Restart `npm run dev` after changing env files; Vite reads them only at startup. Save the file as UTF-8. In Windows PowerShell 5.1, `echo … > .env.local` writes UTF-16, which Vite can't read.

**Keep port 3000.** The backend's CORS policy and email links use `Frontend:BaseUrl`, which defaults to `http://localhost:3000`. `vite.config.ts` pins the dev server to 3000 for that reason.

## 3. Running the app

### Frontend with a local backend

1. Start the backend: `dotnet run --project ClinicFlow/ClinicFlow.csproj` from the backend repo. It serves `http://localhost:5143`, applies migrations, and seeds demo data in Development.
2. Create `.env.local` as shown above.
3. Run `npm run dev` and open http://localhost:3000.

**Demo accounts:** in Development, the backend seeds an admin, doctors and patients. Their emails and passwords are listed in the backend repo's `docs/SETUP_AND_DEPLOYMENT.md` (section "Running locally").

### Full stack with Docker

The backend repo's `docker-compose.yml` runs SQL Server, the backend and this frontend together.

```bash
# in this repo
docker build -f DockerFile -t clinicflow-frontend .

# in the backend repo
docker build -t clinicflow-backend .
cp .env.example .env        # fill in DB_PASSWORD, JWT_SECRET, email settings, ADMIN_EMAIL/ADMIN_PASSWORD
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5001 |

Compose runs the backend in Production, so there's **no demo data**. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` to get a first admin account.

## 4. Scripts and checks

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:3000 with hot reload |
| `npm run build` | `tsc -b` type check, then production build to `dist/` |
| `npm run lint` | ESLint over the project |
| `npm run preview` | Serves the built `dist/` locally |

- **`npm run build` is the only type check.** Run it before committing.
- **There is no test framework yet.** Check changes by hand in the browser against a running backend.
- **Lint baseline:** `npm run lint` currently reports **22 known errors**. They're mainly the React Compiler rule `react-hooks/set-state-in-effect` (data loading inside `useEffect`) and `react-refresh/only-export-components` in `components/ui`. Treat any error *beyond* those as yours to fix. They're tracked in [KNOWN_ISSUES.md](KNOWN_ISSUES.md). To keep `only-export-components` happy, put non-component exports (constants, helpers) in `src/lib/`, not in `.tsx` component files.

## 5. How to…

### Add a page

1. Create `src/pages/MyPage.tsx` exporting a named component (`export function MyPage()`). Build it from the shared layout:

   ```tsx
   import { Page, PageHeader } from '@/components/layout/Page';
   import { EmptyState, ErrorState, LoadingState } from '@/components/states';

   export function MyPage() {
     return (
       <Page width="default">
         <PageHeader title="Reports" description="One sentence on what this page is for." actions={/* primary button */ null} />
         {/* LoadingState / ErrorState / EmptyState / content */}
       </Page>
     );
   }
   ```
2. Register it as a lazy page in `src/App.tsx`, then add a route wrapped in `AppLayout`, and in `ProtectedRoute` if it needs sign-in:

   ```tsx
   const MyPage = page(() => import('@/pages/MyPage'), 'MyPage');

   <Route
     path="/doctor/reports"
     element={
       <ProtectedRoute allowedRoles={['Doctor']}>
         <AppLayout><MyPage /></AppLayout>
       </ProtectedRoute>
     }
   />
   ```
3. Add it to the role's entry in `navByRole` in `src/components/Navbar.tsx` if it belongs in the main navigation (it then appears on desktop and in the mobile menu).

### Call a new endpoint

1. Read the endpoint in [API_CONTRACT.md](API_CONTRACT.md): its body, response, error codes and quirks.
2. Add or adjust the request and response types in `src/types/index.ts`. Use string unions for enums, and mark fields `| null` where the contract says so.
3. Add a function to the right module in `src/api/`. If you create a new module, re-export it from `src/api/index.ts`.
4. Call it from the page and handle failures with `getApiErrorMessage`:

   ```ts
   try {
     await doctorsApi.createSchedule(form);
     toast.success('Schedule created');
   } catch (err) {
     toast.error(getApiErrorMessage(err, 'Failed to create schedule'));
   }
   ```
5. If the endpoint has new error codes, add friendly messages for them to `messagesByCode` in `src/lib/api-error.ts`.

### Ignore out-of-date responses

If the user can start a new request before the previous one finishes (filters, pickers), use the request-id pattern from [ARCHITECTURE.md §7](ARCHITECTURE.md#7-data-fetching-and-state).

### Add a shadcn/ui component

The project is configured for the shadcn CLI (`components.json`: style "new-york", aliases under `@/components/ui`). Most common components already exist in `src/components/ui/`, so check there first. Use `cn()` from `@/lib/utils` to merge class names.

### Change the API contract

The contract is shared with the backend. Follow [API_CONTRACT.md §11](API_CONTRACT.md#11-how-to-change-this-contract):
- the change is made in the backend repo first;
- `docs/API_CONTRACT.md` here is kept identical to the backend's copy;
- breaking changes are agreed with both sides before release.

## 6. Conventions

- **Imports:** use the `@/` alias (`@/api`, `@/components/ui/button`, `@/lib/api-error`), not long relative paths.
- **Type-only imports:** `import type { … }`. This is required by `verbatimModuleSyntax`.
- **No TypeScript `enum`s and no constructor parameter properties.** This is enforced by `erasableSyntaxOnly`; use string unions instead.
- **Unused variables and parameters fail the build** (`noUnusedLocals`, `noUnusedParameters`).
- **Naming:**
  - pages are `PascalCasePage.tsx` with a named export;
  - API modules are `camelCase.ts` exporting `somethingApi`;
  - shared helpers live in `src/lib/`.
- **Errors:** use `getApiErrorMessage`; never put `err.response.data.title` in a toast. Use `catch (err)` rather than `catch (err: any)`.
- **Session data:** use `saveSession` / `clearSession` from `@/api`; don't call `localStorage.clear()`.
- **Dates:** follow the date and time rules in [ARCHITECTURE.md §8](ARCHITECTURE.md#8-shared-helpers-and-types). Display times with `formatTime`/`formatTimeRange`, and parse API timestamps with `parseUtc`.
- **UI:**
  - Use the design tokens (`bg-primary`, `text-muted-foreground`, `bg-success/10 text-success`) and the shared components in [ARCHITECTURE.md §9](ARCHITECTURE.md#9-ui-system). Don't use raw palettes (`teal-600`, `slate-500`) or decorative gradients.
  - Form controls go in a `Field`, so the label, hint and error are wired up.
  - Icon-only buttons need an `aria-label`.
  - Statuses need text, not just color.
  - One primary button per area.

## 7. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Requests go to `http://localhost:3000/api/...` and return 404 | `VITE_API_URL` isn't set for development. Create `.env.local` ([§2](#2-configuration)) and restart `npm run dev` |
| CORS error in the browser console | The frontend isn't on `http://localhost:3000`, or the backend's `Frontend:BaseUrl` was changed. Use port 3000 or update the backend setting |
| `https://localhost:7129` requests fail with a certificate error | Trust the .NET dev certificate (`dotnet dev-certs https --trust`) or use `http://localhost:5143` |
| Signed out unexpectedly | The refresh token was rejected: it expired after 7 days, was used in another tab or device and then reused, the password was reset, or the account was suspended. See [ARCHITECTURE.md §5](ARCHITECTURE.md#5-authentication-and-session) |
| Email link opens the 404 page | The link must use the hash routes `/#/confirm-email` and `/#/reset-password`. Check the backend's `Frontend:BaseUrl` |
| Blank page after deploying `dist/` to a sub-path | Assets use relative paths (`base: './'`); serve `index.html` for unknown paths (see `nginx.conf`) |
| `docker build` can't find a Dockerfile on Linux/CI | The file is named `DockerFile` (capital F). Use `docker build -f DockerFile …` |
| Login works but pages show "Failed to load …" | The backend is unreachable or returning 5xx. Check that it's running and that `VITE_API_URL` points to it |
