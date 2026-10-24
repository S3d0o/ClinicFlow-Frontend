# ClinicFlow Frontend — Known Issues and Roadmap

Open problems in the frontend, the improvements planned for them, and recent fixes. It's based on a full code audit (October 2026), updated after the UI/UX redesign (branch `feature/ui-ux-redesign`). Backend issues are tracked separately in the backend repo's `docs/REVIEW.md`.

> **On the `v2` branch:** "Recently fixed", "Open issues" and "Roadmap" describe the **V1** UI (still live on `main`). The V2 UI is a fresh build from `design-v2/`; its progress and V2-specific items are in [V2](#v2) at the end.

**Priority:** P1 = broken or wrong behavior in a core workflow · P2 = usability, correctness at the edges, accessibility, maintainability · P3 = polish and cleanup.

---

## Recently fixed

### Correctness (Phase 1)
| Area | What changed |
|---|---|
| Error messages | All pages use `src/lib/api-error.ts`, so users see sentences instead of raw codes like `Appointment.SlotAlreadyBooked` |
| Session handling | A network error or 5xx during token refresh or on page load no longer signs the user out. Requests waiting during a failed refresh are rejected instead of hanging. Sign-out removes only the app's storage keys |
| Booking | Changing the date clears the selected slot, so a slot from a different day can't be booked. The confirmation shows the slot's own date. Slots reload after "slot taken" errors. The date picker is limited to the 14-day window. Out-of-date responses are ignored |
| Find a doctor | Changing specialty or sort resets to page 1. Paging stays visible on an empty later page. Load errors show a retry instead of "No doctors found" |
| Doctor dashboard | Sends the paging values the API requires, so today's list and stats are correct. "Complete" only appears after the start time |
| Doctor profile | The consultation fee is required and validated, so saving no longer fails |
| Admin specialties | Empty optional fields are no longer sent as `""` |
| Doctor schedules | "+ Add" uses the right day. Days that already have a schedule can't be added again. Times are validated. Days are sent as strings. The edit dialog shows the day name |

### UI/UX redesign
| Area | What changed |
|---|---|
| Design system | One token-based palette, typography and elevation system (see [ARCHITECTURE.md §9](ARCHITECTURE.md#9-ui-system)). The color tokens now support opacity modifiers; before, hover and focus colors such as `bg-primary/90` silently did nothing. The shadcn components were adapted from Tailwind v4 syntax to Tailwind 3 |
| Navigation | Role-aware navigation with active states. Admin menu items fixed. Mobile slide-in menu with Dashboard, Notifications and Profile. "View all notifications" is always available. Users return to the page they asked for after signing in |
| Notifications | The bell refreshes on navigation, on window focus, every 60 seconds and after changes on the Notifications page |
| Dates and times | Times show as "9:30 AM", not "09:30:00". UTC timestamps without a `Z` are parsed correctly (`parseUtc`), so notification and review times are no longer shifted |
| Load failures | Doctor details, profile pages and the admin dashboard show an error with **Try again** instead of a misleading empty or "not found" state |
| Forms | Labels are linked to their controls. Required fields are marked. Registration checks gender and specialty and shows a live password checklist. Reset password shows the rules and a "passwords don't match" message. The registration form now renders the emergency-contact fields it was already sending |
| Accessibility | Accessible names on icon-only buttons, a keyboard-operable star rating, status shown with text (never color alone), a skip link, visible focus rings, and reduced-motion support |
| Avatars | Initials ignore "Dr." (doctors previously all showed "D", and patient appointment cards showed a blank avatar) |
| Performance | Each page except the landing page is its own chunk: the main bundle dropped from 1.19 MB to 611 kB (198 kB gzipped), and the admin dashboard no longer loads recharts (its chunk is about 6 kB). Fonts load with `preconnect` instead of a CSS `@import` |
| Content | The landing page no longer shows invented statistics. The "Live data" badge, the unused "Pending" filter and the misleading bar chart were removed. "Reject" clearly says it suspends the account |
| Dead code | `src/pages/Home.tsx` and `src/App.css` removed |

### Code review fixes (branch `feature/stitch-redesign`)
| Area | What changed |
|---|---|
| Session across tabs | Two tabs refreshing at once used the same single-use refresh token: one tab was signed out, and the reuse could revoke every session of the user. Refreshes now run one at a time across tabs (Web Locks), a tab reuses a token another tab just obtained, and sign-in and sign-out follow across tabs |
| Sign-in | If loading the profile failed right after signing in, the tokens stayed stored while the page said "Sign in failed". A 4xx now clears the session; a server hiccup still signs the user in. The error shows once (inline), not also as a toast |
| Redirects | After signing in, a page that belongs to another role is ignored (no more bounce to `/`). A user on a page of another role goes to their own home. Signed-in users opening sign-in or sign-up pages are sent on |
| Load failures | Eight pages showed "No appointments yet", zeros or "Doctor not found" when loading failed. They now show "Couldn’t load …" with **Try again**. Loading uses the shared `useApiQuery` hook |
| Doctor dashboard | "Upcoming" counted past confirmed visits; it now counts only visits that haven't started |
| Patient cancel | "Cancel appointment" is hidden inside the 2-hour window, with an explanation, instead of failing on the server |
| App shell | The shell is a layout route, so it is no longer rebuilt when moving between public and signed-in pages |
| Deployment | nginx: long-term caching for fingerprinted assets, `no-cache` for `index.html`, gzip, security headers (CSP and others), forwarded-IP headers, real 404s for missing assets. Requests time out after 20 seconds. A tab left open across a deploy reloads once instead of failing to load a page. Favicon and Open Graph tags added |
| Polling | Hidden tabs no longer poll notifications; they refresh when shown again |
| Cleanup | 37 unused `components/ui` templates, `use-mobile`, `info.md` and 32 unused dependencies (including recharts, zod, react-hook-form) removed. Package renamed to `clinicflow-frontend`. `DoctorsPage` moved to `useApiQuery`. Lint errors went from 22 to 4 |
| Bundle | framer-motion removed (the landing page's scroll reveal is now an `IntersectionObserver` and a CSS transition), and React and the router get their own long-cached chunk. JavaScript loaded on first visit went from 617 kB (201 kB gzipped) to 493 kB (161 kB gzipped), split into a 261 kB entry chunk and a 232 kB `react` chunk |
| Tests | Vitest + Testing Library added (`npm test`): the token refresh and cross-tab sync, `useApiQuery`, the `src/lib` helpers and `DoctorsPage`. The cross-tab tests fail against the old `axios.ts`. The Docker build moved to Node 22, which Vitest needs (Node 20 is past end of life) |
| Lint and CI | The last 4 lint errors fixed: `buttonVariants` moved to `ui/button-variants.ts`, `badgeVariants` no longer exported, `useAuth` and the context moved to `context/auth-context.ts`, and the session restore no longer sets state synchronously in an effect (signed-out users skip the loading state). GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests, build and a Docker build on every push |

### Contract 3.0.0 follow-ups
The backend moved to contract 3.0.0 (see [API_CONTRACT.md §10](API_CONTRACT.md#10-changelog)). Error bodies on 401/403/404/500 have no `Feature.Reason` code, so `api-error.ts` falls back to its generic text as before (pinned by a test), and every list request already sent valid paging.

| Area | What changed |
|---|---|
| Unread badge | The bell asks for the 5 newest unread notifications and takes the count from `X-Total-Count`. Before, it counted the returned list, which the API now caps at 50 |
| Notifications page | 20 per page with "Page 2 of 5" paging; the unread count covers every page. Before, only the newest 50 were reachable |
| No-show | Doctors get **Mark as no-show** (Confirmed visits, 15 minutes after the start, with a confirmation) and a No-show filter; notes are allowed on no-shows, as the API allows. `Appointment.NoShowTooEarly` and `Appointment.AlreadyNoShow` have messages |
| Specialties | The add/edit dialog has an **Active** switch, so admins can deactivate and reactivate a specialty (`isActive`) |

### Contract 3.1.x follow-ups
The backend moved to contract 3.1.x (see [API_CONTRACT.md §10](API_CONTRACT.md#10-changelog)). Nothing breaks: every request that worked before gets the same response. 3.1.1 only renames the doctor-notes validation key (#24) from `notes` to `Notes`, which the app doesn't read.

| Area | What changed |
|---|---|
| Rate limiting | A 429 `RateLimit.Exceeded` (contract §2.7) shows "Too many attempts. Please wait N seconds and try again." on every auth form, from the `Retry-After` header, or "a minute" when the browser can't read it. `isRateLimited()` in `src/lib/api-error.ts`. Forgot password no longer shows "Check your email" after a 429 (no email was sent), and Confirm email shows "Too many attempts" with **Try again** instead of "This link didn't work". Nothing retries automatically |
| Doctor reviews | The unused `doctorsApi.getReviews` (`GET doctors/{id}/reviews`, #12) is removed; the contract plans to drop that route. `DoctorDetailsPage` uses #26 (`reviewsApi.getDoctorReviews`) |

## Open issues

### Data correctness — P2
| Issue | Impact |
|---|---|
| Patients can't clear a medical field; an empty field keeps its old value | Outdated medical info stays |
| Some types differ from the contract (`PatientProfile`, nullability, pending doctors' response type) | Type safety only |
| The doctor dashboard's stats use the 50 most recent appointments | Stats can be incomplete for busy doctors |

### Forms and validation — P2/P3
| Issue | Impact |
|---|---|
| Empty required fields use the browser's native validation bubbles, while other checks show inline messages | Two validation styles. Both are accessible, but they look different |
| Phone formats are only hinted at, not checked, before sending | Server error instead of inline help |
| `ResetPasswordPage` decodes the token twice (`decodeURIComponent` after `URLSearchParams`) | Harmless for current tokens, but breaks if a token contains `%` |
| `ForgotPasswordPage` shows success even when the server failed to send the email. Since contract 1.0.2 the backend itself returns 204 in that case (so a mail outage doesn't reveal registered emails), so the page can't detect it | The user waits for an email that never arrives. Only the backend can fix this, by queuing emails with retries (backend REVIEW.md NM3) |

### Missing features — P2 (to confirm)
| Issue | Notes |
|---|---|
| Doctors can't cancel appointments in the UI | The API supports it (contract #22) |
| Admins have no appointment list, so they can't cancel or mark no-shows in the UI | The API supports both (contract #22, #24b) but has no endpoint that lists every appointment |
| The doctor's Practice tab can't show current values | Needs a backend endpoint |
| No real-time notifications (polling only) | The contract has no push channel |

### Performance and security — P2
- Tokens are stored in `localStorage`, so an XSS bug could steal them (the CSP now limits scripts to the app's own origin). Moving to cookies needs backend changes.
- The entry chunk is about 261 kB (≈ 86 kB gzipped) and the `react` chunk about 232 kB (≈ 74 kB gzipped). What's left is mostly React DOM, axios, sonner and tailwind-merge, which are all in use.

### Contract 3.1.x follow-ups — P3
| Issue | Impact | Fix |
|---|---|---|
| Sign-out with an expired access token refreshes first | Logout no longer needs an access token ([§2.6](API_CONTRACT.md#26-logout)), so the refresh is an extra request. Nothing fails | Optional: send `POST /auth/logout` without triggering the 401 refresh retry |

### Code health — P3
- **Tests cover the core, not every page.** `npm test` covers auth refresh, session restore, `useApiQuery`, the `src/lib` helpers and `DoctorsPage`. The other pages (booking, appointments, schedules, profiles, admin) have no tests yet.
- **Docker file name:** git tracks the file as `DockerFile` (capital F), so Linux builds need `-f DockerFile`.

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| 0 | Toolchain baseline (build, lint) | Done |
| 1 | Critical correctness and contract compliance | Done |
| 2 | Navigation, return-after-login, notification polling | Done in the redesign |
| 3 | Types aligned with the contract, date/time helpers, form validation, profile load errors | Mostly done (types and phone validation remain) |
| 4 | Shared components, dead-code removal | Done |
| 5 | Accessibility and UI polish, landing page content | Done; doctor cancel UI remains (to confirm) |
| 6 | Code splitting, font loading, nginx security headers | Done |
| 7 | Tests (Vitest + Testing Library), CI and documentation upkeep | Mostly done: core tests and CI in place; page tests remain |

Open questions for the maintainer:
- Should doctors be able to cancel from the UI?

## V2

V2 is built on the `v2` branch against the backend's `v2` branch (see `CLAUDE.md`, "V1 and V2"). Its phases P0–P7 and the frontend work for each are planned in the backend repo: `docs/v2/09_MIGRATION_FROM_V1.md` §4 and `docs/v2/10_ROADMAP.md`.

### UI rebuild (frontend phases)

The V2 UI is a fresh build from the 63 Stitch screens in `design-v2/`, on an in-memory mock backend until the `/api/v2` endpoints exist (see [ARCHITECTURE.md](ARCHITECTURE.md)). Each phase is its own branch and pull request, reviewed before the next starts.

| # | Branch | Scope | Status |
|---|---|---|---|
| 0 | `feature/p1-ui-foundation` | Theme (ClinicFlow Navy), Arabic/English with right-to-left, service layer and mock backend, permission model and demo sign-in, the six frames, screen catalog with access rules, shared UI | Done (merged 2026-10-24) |
| 1 | `feature/p1-ui-public-auth` | Public site, sign-in (one phone-or-email field), staff two-step, sign-up with SMS code, password reset, doctor application and "My application" (14 screens, plus the email-confirmation page) | In review |
| 2 | `feature/p2-ui-patient-portal` | Patient portal (13 screens) | To do |
| 3 | `feature/p2-ui-front-desk` | Front desk and nurse station (10 screens) | To do |
| 4 | `feature/p4-ui-doctor` | Doctor workspace (4 screens) | To do |
| 5 | `feature/p2-ui-manager` | Manager workspace (9 screens) | To do |
| 6 | `feature/p1-ui-admin` | Administration (9 screens) | To do |
| 7 | `feature/p3-ui-accountant` | Finance (4 screens) | To do |

Open points for the rebuild:
- **Real API:** each screen runs on the mock backend. Swapping in the API means writing HTTP adapters behind the same service interfaces (on `shared/api/http-client.ts`, which keeps V1's tested token refresh) as the backend phases ship their endpoints.
- **Error messages:** `shared/api/api-error.ts` still holds V1's English messages per error code; they move into the translation files when the HTTP adapters land.
- **Demo-only pieces:** the demo account list and sample invitation on the sign-in page, the "Demo: open the link" buttons where an email would arrive, and the demo session store exist only in the mock backend (`DemoAccountsService`) and disappear with it.
- **Demo data resets on reload:** accounts, applications and lockouts made in the browser live in memory. A persisted mock store is possible if reviewers need it.
- **Dependencies:** `npm audit` reports 4 moderate advisories, all in Tailwind 3's build-time CSS tooling (`postcss-selector-parser` via `postcss-nested`). No fixed version exists for Tailwind 3; moving to Tailwind 4 clears them. The 12 others, including 11 high (axios, react-router, vite, postcss, …), were fixed by `chore/dependency-security` (2026-10-24).

### Phase 1 (public site and account access): to confirm with the backend

The screens run on the mock, which follows 04 (FR-ACC, FR-STF-01/02/07, FR-REC), 07 §4 and the V1 contract. The backend's draft P1 plan (`docs/v2/plans/P1.md` on its `docs/p1-plan` branch, not merged yet) already compares these interfaces with 07 in its §7, and its question **Q-A** (for the owner) recommends taking the frontend's shapes where they are richer and 07's names otherwise. Settled shapes go into `API_CONTRACT.md` 4.0.0 with each backend PR, then into this repo's mirror.

**Already on the backend's list** (P1 plan §7 and its PRs): the `OtpTicket` answer from `otp/send` and `register` (`{ phone, expiresAt, resendAt }`); `attemptsLeft` on `Otp.InvalidCode` and `retryAt` on `Otp.TooManyAttempts` and `Auth.AccountLockedOut` (PR 0 adds ProblemDetails extensions); the reset code check before the new password; the two-step challenge (`challenge: { id, identifier, roleLabel }`, `Auth.MfaChallengeExpired`, recovery codes); `/me` roles with scopes and branch ids, `mfaEnabled`, `mfaEnrolled`; `phone` vs 07's `phoneNumber` (the HTTP adapter maps whichever name is chosen); the account usable only after its SMS code (PR 10); the reapply cool-down as a setting (PR 13).

**Not on the backend's list yet:**

| Point | What the frontend does now |
|---|---|
| Ids are strings | The app types every id as a string (`branchIds: string[]`, `doctorId`, …). If the API keeps integer ids, the HTTP adapters convert them; nothing else changes. Listed in P1 plan §7 as a difference, without a decision |
| Error codes no doc names | Chosen by the mock: `Auth.Unauthorized`, `Invitation.NotFound`, `Invitation.Expired`, `DoctorApplication.ReapplyTooSoon`, `File.NotFound`, `Validation.InvalidPhone`. Reused from the V1 contract: `Auth.InvalidPasswordResetToken`, `Auth.InvalidEmailConfirmationToken`, `Auth.UserNotFound`. Each has a translated message in `common:errors`; a different code only needs a new message |
| Reading an invitation | The accept screen first reads the invitation by its token (email, name, roles with branches, inviter's name, expiry). P1 PR 6 has only `POST /auth/invitations/accept`; it needs a public `GET` too |
| Accepting an invitation | Sends the name, a mobile number and a password, and gets a signed-in session back (two-step setup follows). PR 6 says "sets the password and activates" |
| Application cool-down date | `canReapplyFrom` (branch-local date) on the applicant's own application after a rejection or withdrawal, so My application and Join can show the date |
| Public doctor search | `/public/doctors` with text, branch, specialty, availability (today, tomorrow, this week), language, sort (soonest, rating, price) and paging, returning each doctor's lowest consultation price and next three free slots; slots for a doctor at a branch with `from` optional (today at the branch). P1 has `public/branches` and `public/services` but no doctor search; prices on public routes are P2 (FR-SVC-04) |
| Booking hand-off | "Continue to book" opens `/patient/book/:doctorId?branch=&service=&slot=&deposit=` (phase 2); frontend only |

### P0: foundation (contract 4.0.0-p0)
| Item | Backend change | Status |
|---|---|---|
| Point at the V2 API and database | Separate `ClinicFlowV2` database; same port under `dotnet run`, ports 5002/3001 under compose | Done: `v2` branch and docs set up |
| URL fields must be `http`/`https` (contract 4.0.0-p0) | `profilePictureUrl` and `iconUrl` with another scheme return 400 with a field message | To do in the rebuilt forms (patient profile, phase 2; specialties, phase 6): validate the scheme in their zod schemas, since `type="url"` accepts `javascript:` and `file:` |
| Timestamps end in `Z` | Backend P0 PR 4, merged 2026-10-23 (contract 4.0.0-p0 changelog) | Nothing to change: `parseUtc` (`shared/lib/format.ts`) accepts both forms |
| New appointment statuses `CheckedIn`, `InProgress`, `Rescheduled` | Backend P0 PR 7, merged 2026-10-23 (contract 4.0.0-p0 changelog and §7) | Part of the rebuild: the appointment model with all eight statuses, their chip tones and the actions each allows arrive with the patient portal (phase 2) and the front desk (phase 3) |
| New error code `Appointment.InvalidStatusTransition` (409) | Backend P0 PR 7 | Handled as a `ServiceError` code by the rebuilt screens |
| `hasReview` was always `false` on `GET /api/appointments/{id}` and the doctor's list | Backend P0 PR 7 bug fix | Nothing to change: the rebuilt screens can rely on it |
| Notifications and emails are sent about 2 s after the action (outbox) | Backend P0 PR 9, merged 2026-10-24 (contract 4.0.0-p0 §1, #22 and changelog). Every response, status code and error code is unchanged | To do in the rebuilt notification screens (bell and list, phase 2): don't expect a notification the moment an action returns. Refetch on focus, on navigation and on an interval (as V1 did), and let the mock deliver notifications after a short delay so the screens are built for it. Forgot-password needs nothing: the backend now retries failed emails and answers as fast for unknown emails as for registered ones |
