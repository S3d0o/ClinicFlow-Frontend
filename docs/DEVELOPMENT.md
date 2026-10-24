# ClinicFlow Frontend — Development Guide (V2)

How to set up, run, change and check the V2 frontend. For how the code is organized, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Prerequisites

| Tool | Why |
|---|---|
| Node.js 22+ and npm | Install, run, build and test (Vitest needs Node 22; the Docker build uses it too) |
| Docker Desktop (optional) | Building the production image |

No backend is needed yet: V2 runs on an in-memory **mock backend** (`src/mocks`) until the `/api/v2` endpoints exist.

```bash
git clone https://github.com/S3d0o/ClinicFlow-Frontend.git
cd ClinicFlow-Frontend
git switch v2
npm install
```

## 2. Running the app

```bash
npm run dev     # http://localhost:3000
```

Open `/#/sign-in` and sign in with a phone or email and the demo password, or pick a **demo account** from the list under the form (it skips the password and two-step code). They are seeded in `src/mocks/seed/users.ts`:

| Account | Role(s) | Home |
|---|---|---|
| Dr. Hala Mostafa | Manager (organization) + Doctor (Nasr City) | `/manager` |
| Omar Saeed | Manager (Maadi branch) | `/manager` |
| Mona Samir | Receptionist (Nasr City) | `/desk` |
| Sara Ibrahim | Nurse (Nasr City) | `/nurse` |
| Dr. Ahmed Fathy | Doctor (Nasr City, Maadi) | `/doctor` |
| Youssef Kamal | Accountant (organization) | `/finance` |
| Karim Adel | Admin | `/admin` |
| Mohamed Adel | Patient | `/patient` |
| Dr. Nour El-Din Samy | Doctor applicant (no role) | `/my-application` |

Every demo password is **`Demo@1234`** and every SMS or authenticator code is **`123456`**. Staff recovery codes are in `users.ts` too. The session survives reloads; to start over, sign out or clear `clinicflow:demo-session` from local storage. **The mock data resets on every reload**, including accounts and applications made in the browser: a new account is gone after a reload (its session then reads as signed out).

Trying the phase 1 flows:
- **Sign-up:** `/#/sign-up` with any unused Egyptian mobile number (e.g. `0122 333 4444`), then the code `123456`. Five wrong codes open the lockout screen.
- **Lockout:** five wrong passwords for any account lock it for 15 minutes (until a reload).
- **Staff invitation:** "Try a staff invitation" under the demo accounts opens `/#/invitation/demo-nurse-invite` (a new nurse at Nasr City), then two-step setup.
- **Emails:** nothing is sent. Where a real email would carry a link (password reset, email confirmation), the screen shows a "Demo: open the link" button.
- **Applying as a doctor:** Dr. Ahmed Fathy and the other staff have confirmed emails, so they can go straight through `/#/join`; Mohamed Adel (patient, no email) shows the add-and-confirm-email step. Dr. Nour El-Din Samy already has an application at the interview stage.
- **Doctors and slots** are generated from weekly schedules in `src/mocks/seed/doctors.ts` for the next 14 days; about one slot in four is shown as taken, and so is every slot someone books.

Trying the phase 2 flows (sign in as **Mohamed Adel**; his data is in `src/mocks/seed/patient-portal.ts`, dated relative to today):
- **Home:** today's cardiology visit, already checked in (ticket A-14, third in line). The queue moves on every 20 seconds until he is called in.
- **Appointments:** three upcoming (today's; an eye exam in 5 days with an optional EGP 100 deposit; a dental check-up in 9 days) and three past (a completed cardiology visit with a summary, waiting for a review; a reviewed dental cleaning; a cancelled dermatology visit). Booking, rescheduling and cancelling change the lists and add a notification about 2 seconds later.
- **SMS reminder:** "Open an SMS visit reminder" under the demo accounts opens `/#/r/demo-reminder` (the eye exam) without signing in.
- **Payments:** the deposit and the open invoice (EGP 350) "pay" at once and come back with "Payment received"; there is no Paymob page in the demo.
- **Records:** the cardiology visit summary (two medicines, a pending test, a follow-up window), the prescription and invoices as sample PDFs, an insurance card and two documents. An uploaded document or added card stays until a reload.
- **Profile:** no email yet, so email reminders are off until one is added and confirmed. Changing the number takes any unused mobile number and the code `123456`.
- **Notifications** are seeded in Arabic, Mohamed's language, so they stay Arabic in the English UI.

The UI starts in **Arabic** (right-to-left), as the docs require; switch with the "EN | عربي" toggle. The choice is remembered.

### Configuration

`VITE_API_URL` (the backend origin without `/api`) is only read by the HTTP client, which nothing calls until the HTTP adapters land. `.env` and `.env.production` leave it empty. Keep the dev server on **port 3000**; the backend's CORS policy and email links expect it.

## 3. Scripts and checks

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | `tsc -b` type-check (tests and translation keys included), then the production build |
| `npm run lint` | ESLint; must report 0 errors (CI fails otherwise) |
| `npm test` | Vitest once (`npm run test:watch` re-runs on change) |
| `npm run preview` | Serves `dist/` |

- **Tests** sit next to the code as `*.test.ts(x)` and import `describe`/`it`/`expect` from `vitest`. Cover:
  - pure rules in `model/` (and `mocks/seed` logic) with plain unit tests;
  - mock adapters through `createTestBackend({ signedInAs, now })` (`src/test/mock-backend.ts`): no delay, an in-memory session, and a clock you move with `advance(ms)` (code expiry, lockouts, invitation expiry);
  - screens with `renderApp({ path, signedInAs })` from `src/test/render-app.tsx`, which renders the real routes, shells and guards on a fresh mock backend (see `app/routes/AppRoutes.test.tsx` and the `*-flows.test.tsx` files, which walk whole flows such as sign-up → code → home). Tests run in English, with a 30 s per-test limit and 15 s for `findBy…` queries, because screens load as separate chunks. `src/test/setup.ts` adds the browser APIs Radix Select needs, so tests can open selects.
- **Lint:** non-component exports (constants, hooks, contexts) go in a `.ts` file, not next to a component in a `.tsx` file, or `react-refresh/only-export-components` fails.
- **CI:** `.github/workflows/ci.yml` runs `npm ci`, lint, tests and build on Node 22, plus `docker build -f DockerFile`.
- **Check screens by hand** in both languages, at desktop (1280px) and mobile (390px) widths, against `design-v2/screens/<area>/<screen>/screen.png`.

## 4. How to…

### Build a screen from the catalog

1. Find its entry in `src/app/routes/catalog/*.routes.ts`; `design` names its Stitch folder under `design-v2/screens/`.
2. Create the page in its feature: `src/features/<domain>/pages/MyPage.tsx` with a **default export** (it's lazily loaded).
3. Set `component: lazy(() => import('@/features/<domain>/pages/MyPage'))` on the entry. The placeholder disappears; access, layout and title come from the entry.
4. Compose the page from hooks (data) and presentational components (markup). Start with `PageHeader`; show `LoadingState` while loading and `ErrorState` with a retry on failure, never an empty state.
5. Take layout from the design and behavior from the V2 docs; leave out the invented Stitch content listed in `design-v2/README.md`.

### Add a screen that isn't in the catalog

Add a `ScreenRoute` entry (path, `screen` title key, layout, access, phase, design), add the title to both `screens.json` files, and, if it belongs in a menu, an item in `src/app/navigation.ts`. Its access rule decides who sees the menu item.

### Add a backend capability

1. **Interface:** declare it in `features/<domain>/api/<domain>.service.ts` with contract-shaped types (07_API_DESIGN: lists are arrays plus a total; slot times are branch wall-clock; money in EGP; errors are codes).
2. **Mock:** implement it in `<domain>.mock.ts` over `MockDb`, adding tables to `mocks/db.ts` and seed data to `mocks/seed/`. Throw `ServiceError('<Module>.<Reason>')` for business errors, and `await delay(latencyMs)` first.
3. **Wire:** add it to `Services` (`app/services.ts`) and `createMockServices` (`mocks/create-mock-services.ts`).
4. **Hook:** wrap it in a TanStack Query hook in `features/<domain>/hooks/`, with its query keys in the same file. Mutations invalidate the keys they change.
5. **Test** the adapter and any rules it applies.

### Add text

Add the key to the English file first (it defines the type), then the same key to the Arabic file; `locales.test.ts` fails if they differ. A new feature namespace is `features/<domain>/i18n/{en,ar}.json`, registered in `app/locales.ts`. Format money, numbers, times and dates with `shared/lib/intl.ts`, and wrap Latin or numeric values inside sentences in `<bdi dir="ltr">`.

### Add a Radix (shadcn/ui) primitive

`components.json` still targets the shadcn CLI; generated files go to `src/shared/ui/`. Convert Tailwind v4 syntax (`aria-invalid:` → `aria-[invalid=true]:`, `max-h-(--x)` → `max-h-[var(--x)]`), use logical direction classes, and translate any built-in labels.

### Change the API contract

The backend owns it ([API_CONTRACT.md §11](API_CONTRACT.md#11-how-to-change-this-contract)). After a backend bump on `v2`, copy it in on a `docs/` branch and update the related docs in the same change.

## 5. Conventions

- **Structure:** a page composes; a component renders props; a rule is a pure function in `model/`; validation is a zod schema; data access is a service. Screens never import mock files; they get services from `useServices()`.
- **Permissions, not roles:** guard screens with permission rules in the catalog, and actions with `can(user, permission, branchId)`. Use `minScope: 'Branch'` for branch-wide screens.
- **Imports:** the `@/` alias; `import type` for types (`verbatimModuleSyntax`); no `enum`s or constructor parameter properties (`erasableSyntaxOnly`); unused code fails the build.
- **Naming:** pages `PascalCasePage.tsx` (default export); components `PascalCase.tsx` (named export); hooks `use-thing.ts`; services `<domain>.service.ts` / `.mock.ts`.
- **UI:**
  - tokens only (`bg-primary`, `text-muted-foreground`, `bg-success/10 text-success`), no raw palettes or gradients, and orange (`highlight`) only for small accents;
  - logical direction classes (`ms-`, `ps-`, `start-`, `text-start`), and `rtl-flip` on directional icons;
  - form controls in a `Field`; icon-only buttons with an `aria-label`; statuses as `StatusChip` (dot + text); one primary button per area; 44px targets in the patient portal.
- **Forms:** react-hook-form with a zod schema in `model/`; schema messages are `common:validation.*` keys, shown with `useValidationMessage()`. Show a failed call with `useErrorMessage()(error)`, which translates the `ServiceError` code (`common:errors.<Module>.<Reason>`) and fills in its details (tries left, retry time).
- **Strings:** every visible string comes from a translation file, in both languages. Counts use i18next plurals: English needs `_one`/`_other`, Arabic all six forms (`_zero`, `_one`, `_two`, `_few`, `_many`, `_other`); `locales.test.ts` checks both.
- **Text people typed** (names, reviews, notes) can be in either language: give its element `dir="auto"` so punctuation lands on the right side. Phone numbers, emails, codes and times sit in `<bdi dir="ltr">`; show phones with `formatEgyptianPhone`.

## 6. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Stuck on someone else's workspace | The demo session is remembered. Sign out, or remove `clinicflow:demo-session` from local storage |
| A screen says "This screen is designed and will be built in phase N" | Expected: it is a placeholder until that phase |
| Text shows as a key such as `nav:items.deskToday` | The key is missing from a translation file or the namespace isn't registered in `app/locales.ts` |
| `npm run build` fails on a `t('…')` call | The key doesn't exist in the English file (keys are typed) |
| Layout looks wrong only in Arabic | A physical class (`ml-`, `pl-`, `left-`, `text-left`) instead of a logical one |
| An account made in the browser stopped working | The mock data resets on reload; sign up again or use a demo account |
| A screen opened from a bookmark sends you back a step (`/sign-up/verify`, `/sign-in/verify`, `/forgot-password/verify`) | Those steps need what the previous step handed over; they restart the flow when opened directly |
| `docker build` can't find a Dockerfile on Linux/CI | The file is named `DockerFile`. Use `docker build -f DockerFile …` |
