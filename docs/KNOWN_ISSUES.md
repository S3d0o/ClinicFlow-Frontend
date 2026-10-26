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
| 1 | `feature/p1-ui-public-auth` | Public site, sign-in (one phone-or-email field), staff two-step, sign-up with SMS code, password reset, doctor application and "My application" (14 screens, plus the email-confirmation page) | Done (merged 2026-10-24) |
| 2 | `feature/p2-ui-patient-portal` | Patient portal: home with the live queue, booking in two steps and its confirmation, my appointments, appointment details (reschedule, cancel, deposit, review), the SMS reminder page, visits and visit summary, invoices, documents and insurance, profile and settings, notifications (13 screens) | Done (merged 2026-10-24) |
| 3 | `feature/p2-ui-front-desk` | Front desk and nurse station: today with check-in, patient search and registration with duplicate warnings, booking on behalf and walk-ins, the live queue board and waiting-room screen, checkout with receipts, the cash session, the triage queue and vitals form (10 screens, check-in as a panel) | In review |
| 4 | `feature/p4-ui-doctor` | Doctor workspace (4 screens) | To do |
| 5 | `feature/p2-ui-manager` | Manager workspace (9 screens) | To do |
| 6 | `feature/p1-ui-admin` | Administration (9 screens) | To do |
| 7 | `feature/p3-ui-accountant` | Finance (4 screens) | To do |

Open points for the rebuild:
- **Real API:** each screen runs on the mock backend. Swapping in the API means writing HTTP adapters behind the same service interfaces (on `shared/api/http-client.ts`, which keeps V1's tested token refresh) as the backend phases ship their endpoints.
- **Error messages:** `shared/api/api-error.ts` still holds V1's English messages per error code; they move into the translation files when the HTTP adapters land.
- **Demo-only pieces:** the demo account list and sample invitation on the sign-in page, the "Demo: open the link" buttons where an email would arrive, and the demo session store exist only in the mock backend (`DemoAccountsService`) and disappear with it. So do the demo doctors (`mocks/queue-demo.ts`), who call patients in and finish visits every 20 seconds until the doctor screens (phase 4) exist.
- **Demo data resets on reload:** accounts, applications, bookings, payments, uploads and lockouts made in the browser live in memory. A persisted mock store is possible if reviewers need it.
- **Main chunk size:** phase 3 took the entry chunk past Vite's 500 kB warning (531 kB), so every translation file now has its own `locales` chunk (128 kB, 39 kB gzipped; `vite.config.ts`). The entry is about 403 kB (128 kB gzipped): TanStack Query, Radix, i18next and the mock backend with its seeds. Both still load at startup. Splitting the translations per screen and dropping the mock from the production build (with the HTTP adapters) are the next steps.
- **Dependencies:** `npm audit` reports 4 moderate advisories, all in Tailwind 3's build-time CSS tooling (`postcss-selector-parser` via `postcss-nested`). No fixed version exists for Tailwind 3; moving to Tailwind 4 clears them. The 12 others, including 11 high (axios, react-router, vite, postcss, …), were fixed by `chore/dependency-security` (2026-10-24).

### API contract §13: the agreed `/api/v2` shapes (2026-10-27)

`API_CONTRACT.md` §13 ("Planned `/api/v2` endpoints (agreed, not built)") fixes the shape of every `/api/v2` endpoint the patient portal and account screens use, written from this repo's service interfaces at `16a6dcb`. It settles P1 plan Q-A: the tables for phases 1 and 2 below record what was asked; §13 is now the answer. The mirror here was copied from the backend's **working tree** (branch `docs/v2-planned-contract`, not merged into its `v2` yet); copy it again from `git -C ../../ClinicFlow.Backend show v2:docs/API_CONTRACT.md` once it is.

**Done here** (§13.11): the channel preference is `Phone`; the reset link carries `userId` (`/#/reset-password?userId=…&token=…`); a fresh upload answers `File.NotScanned` until its scan passes (the mock waits 5 s, 0 in tests), with its own message on the documents screen, whose download and delete errors were silent before; the booking mock answers `Appointment.SlotNotFound` (unknown slot), `Appointment.SlotInPast` (started), `Booking.ServiceNotOffered`, `Deposit.NotOffered` and `Deposit.AlreadyPaid` as §13.7 does; every code §13 can return for these calls has an English and Arabic message (`File.TooLarge` no longer says 5 MB, since documents allow 20 MB). `mocks/contract-errors.test.ts` fails when a mock throws a code §13 doesn't list for its service, or when a §13 code has no message.

**Not in §13 yet:** the front desk and nurse station ports (`PatientsService`, `DeskService`, `QueueBoardService`, `TriageService`, `CheckoutService`, `CashSessionService`). The backend adds them from this repo's interfaces once `feature/p2-ui-front-desk` is merged; the phase 3 table below lists what they need.

**For the HTTP adapters** (no screen changes):

| Item | What the adapter does |
|---|---|
| Ids | Every `/api/v2` id is a JSON string, as the app already types them |
| Sessions | Login, MFA, sign-up verification (`POST /auth/register/verify`), invitation acceptance and refresh return `Session`: `{ accessToken, refreshToken, expiresAt, user: Me }`. V1's `LoginResponse` fields (`email`, `fullName`, `role`) are gone, so `saveSession()` in `shared/api/http-client.ts` keeps the tokens and `expiresAt`, and the current user comes from `user` |
| Sign-in result and enums | Login returns `{ status: "SignedIn", ...Session }` or `{ status: "MfaRequired", challenge }`; map it to the interface's `signed-in` / `mfa-required`. Enum values in responses are PascalCase; query-string enums are case-insensitive, so `sort=soonest` and `category=billing` work as sent. `AppNotification.link.kind` arrives as `Appointment`, `Invoice` or `Visit`: map it to lower case |
| Errors | 401 on `/api/v2` only ever means a token problem, and "not signed in" is a 401 without a code (map it to `Auth.Unauthorized`). A wrong password, code or MFA code is 400; a lockout, cooldown or rate limit is 429 with `retryAt`; a blocked account is 403. Every coded error is ProblemDetails with `title` = the code, and `attemptsLeft` / `retryAt` at the top level. Branch on `title`, never on the status |
| Invalid phone | A 400 validation error on the field (`errors.phone`), not a code: map it to `Validation.InvalidPhone` |
| Paged lists | The patient's appointments, visits, invoices and documents are bare arrays with `X-Total-Count` (`pageNumber`, `pageSize` up to 100). The adapters fetch every page, or the screens add paging |
| Profile updates | `PATCH /api/v2/me` and `POST /me/phone/confirm` return `Me`, not `PatientProfile`: re-read `GET /api/v2/me/patient-profile`, or invalidate both queries |
| Link tokens | Tokens from links (invitation, reminder, confirm email, reset) go in request bodies, e.g. `POST /api/v2/auth/invitations/preview { token }`, `POST /api/v2/public/reminders/view { token }` |
| Idempotency | `Idempotency-Key` (a UUID) on booking, the deposit checkout and the invoice checkout |

### Backend plan changes of 2026-10-26

The backend merged three doc changes into its `v2` (`d86eee8`, `fb64973`, `48df27a`): the P1 plan, WhatsApp as the first phone channel, and ADR 0008 (many clinics on one platform, with modules per subscription). `API_CONTRACT.md` didn't change, so there is nothing to mirror. What they mean here:

| Change | Status in the backend | Frontend impact |
|---|---|---|
| **WhatsApp is the first phone channel; SMS is built but switched off** (06 §9.2, FR-NTF-01, FR-ACC-02). One-time codes and patient messages go by WhatsApp, and by SMS only when WhatsApp can't reach the number and SMS is on | Decided (decisions log, 2026-10-26); built in P1 PR 9 | **Done (2026-10-27, on the phase 3 branch):** the channel preference is `Phone`, `Email` or `Both` (05, 07 `PATCH /me`); the profile explains that phone messages come by WhatsApp, or SMS without WhatsApp; the copy that said SMS (landing, join, sign-up, password reset, booking confirmation, desk, demo panel) is channel-neutral or says WhatsApp; the reset option is `phone`, not `sms`. **To ask:** the `OtpTicket` could say which channel delivered the code (`channel: WhatsApp \| Sms`), so the screen can say where to look. §13.2's `OtpTicket` doesn't have it; ask for a §13 change before using it |
| New error **`Messaging.PhoneUnreachable`**: WhatsApp can't reach the number and SMS is off (06 §9.2, P1 PR 9) | Planned for P1 | **Done (2026-10-27):** a translated message in `common:errors` ("We couldn't reach this number on WhatsApp…"). The mock never returns it, since it has no phone channels |
| **P1 plan merged** (`docs/v2/plans/P1.md`, still a draft for review). Its §7 lists this app's shapes; **Q-A** (take the frontend's shapes where richer) is still the owner's to answer. Q-B adds `Auth:RequireStaffMfa` for demos (the demo panel here already skips the two-step code); Q-E sends booking messages by phone to phone-only patients in P1 | Draft; nothing started | None now. The phase 1 table below now points at the merged plan |
| **ADR 0008:** one multi-tenant platform; each clinic's plan switches add-on modules (FD, BIL, EMR, INS, RPT beyond the dashboard, PAT, REC, BOT) and limits on. `GET /api/v2/organization/entitlements` returns the effective modules, limits, usage and subscription status; `Subscription.ModuleNotEnabled` and `Subscription.LimitReached` are new 403 codes; a lapsed subscription is read-only; staff working for several clinics choose one; patients reach a clinic from its own address (Q18: sub-domain or path) | **Proposed**, not accepted. If accepted, P1 builds the foundation and a new platform phase the rest (Q20) | **None until it's accepted.** Then: each catalog route and nav item gets its module, and access combines the permission with the module (so a Starter clinic sees no desk, billing or portal screens, and a receptionist's home can't be `/desk` there); "upgrade" messages for the two codes; a read-only mode; an organization switcher in the staff frame; and, if Q18 picks a path, a clinic prefix in the patient and public routes. A platform operator console would be a new screen set, not designed yet |

### Phase 1 (public site and account access): to confirm with the backend

**Settled by `API_CONTRACT.md` §13 (2026-10-27).** The rows below are what this app asked for; §13.3–§13.6 are the agreed answer, and the adapter items above are what remains.

The screens run on the mock, which follows 04 (FR-ACC, FR-STF-01/02/07, FR-REC), 07 §4 and the V1 contract. The backend's P1 plan (`docs/v2/plans/P1.md`, merged on 2026-10-26, still a draft for review) compares these interfaces with 07 in its §7, and its question **Q-A** (for the owner) recommends taking the frontend's shapes where they are richer and 07's names otherwise. Settled shapes go into `API_CONTRACT.md` 4.0.0 with each backend PR, then into this repo's mirror.

**Already on the backend's list** (P1 plan §7 and its PRs): the `OtpTicket` answer from `otp/send` and `register` (`{ phone, expiresAt, resendAt }`); `attemptsLeft` on `Otp.InvalidCode` and `retryAt` on `Otp.TooManyAttempts` and `Auth.AccountLockedOut` (PR 0 adds ProblemDetails extensions); the reset code check before the new password; the two-step challenge (`challenge: { id, identifier, roleLabel }`, `Auth.MfaChallengeExpired`, recovery codes); `/me` roles with scopes and branch ids, `mfaEnabled`, `mfaEnrolled`; `phone` vs 07's `phoneNumber` (the HTTP adapter maps whichever name is chosen); the account usable only after its one-time code (PR 10); the reapply cool-down as a setting (PR 13).

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

### Phase 2 (patient portal): to confirm with the backend

**Settled by `API_CONTRACT.md` §13 (2026-10-27).** The rows below are what this app asked for; §13.7–§13.8 are the agreed answer, and the adapter items above are what's left.

The screens run on the mock, which follows 04 (FR-PAT, FR-APT-02/08/10, FR-NTF-04, FR-INS-03), 05 §4.1 (appointment states), 07 §4 and the V1 contract. Nothing here blocks the backend; each point is what the HTTP adapter will need, and the adapter maps names and shapes once they are settled.

| Point | What the frontend does now |
|---|---|
| Patient-own reads | The patient reads only their own records: appointments (07 lists `GET /me/appointments`), visit summaries with medicines, tests, instructions and follow-up, the prescription PDF, invoices with lines, deductions and payments, invoice and receipt PDFs, documents (upload, download, delete), insurance cards (list, add with card photos), and their medical information (blood type, allergies, conditions; read-only). 07's routes for these are staff ones (`encounters.view`, `invoices.view`, `attachments.upload`, `policies.manage`, `patients.view`). Needs `/me/...` routes or an "own" rule on them, and a patient-facing visit summary that leaves out draft notes |
| Appointment fields | The patient's appointment carries `reference`, `changeableUntil` (UTC: start minus the 2-hour window, so the screens never compute the rule), `depositAmount`, `depositPaid`, `price`, `hasReview`, `visitId` (the summary, once published), `cancelledBy` and `cancellationReason`, `rescheduledToId`, `attendanceConfirmed` (from the reminder link), and `queue` once checked in |
| Cancellation reasons | The cancel form sends a reason from a fixed list (`ScheduleConflict`, `FeelingBetter`, `BookedElsewhere`, `CostOrInsurance`, `Other`) and an optional note. No doc lists reasons yet |
| Consent on booking | Booking sends `acceptTerms: true` (FR-PAT-08); without it the mock answers `Consent.Required` |
| Booking step 1 | `listBranchServices(branchId)`: the services offered at a branch with the lowest price there and how many doctors offer each; and the doctor search filtered by service. `/public/services` and `/public/doctors` could carry both |
| Patient's live queue | Home and details show the patient's own ticket, place in line, estimated wait, the doctor's delay and the room, pushed as they change (`QueueStatusService.watch`). `/hubs/queue` needs `queue.view` and is per branch; patients need their own entry (a patient group on the hub, or a polled `GET /me/appointments/{id}/queue`) |
| SMS reminder links | `/#/r/:token` reads the appointment by a token without signing in (doctor, service, branch with address and phone, time, fee) and confirms or cancels with it. The token stops working after the visit day (`Reminder.LinkInvalid`). 07 §6 mentions confirm/cancel links only for messaging-provider replies |
| Paymob return | The deposit and invoice checkouts (`POST /appointments/{id}/deposit`, `POST /payments/online-checkout`) need a return URL into the hash route (`/#/patient/appointments/{id}?payment=success`, `/#/patient/invoices?payment=success`). The screens show "Payment received" on return and refetch; the webhook settles the payment |
| Notifications in the patient's language | The inbox shows each notification's title and body as stored, written in the recipient's preferred language when it was created, with a `type` (for the category filter) and the appointment, visit or invoice it's about (to open it). The bell polls the unread count every 60 s until `/hubs/notifications` |
| Changing the phone | `POST /me/phone` in two steps: send a code to the new number (`Auth.PhoneAlreadyUsed` if another account has it), then confirm with the code; the OTP purpose is `ChangePhone` |
| Error codes no doc names | `Consent.Required`, `Reminder.LinkInvalid`, `Visit.NotFound`, `Visit.NoPrescription`, `Invoice.NotFound`, `Invoice.NothingDue`, `Payer.NotFound`, `Profile.EmailRequired` (email reminders without a confirmed email). From 07: `Slot.CapacityReached`, `Auth.PhoneAlreadyUsed`, `Auth.PhoneNotVerified`. From the V1 contract: the `Appointment.*` codes. Each has a translated message in `common:errors` |

### Phase 3 (front desk and nurse station): to confirm with the backend

The screens run on the mock, which follows 04 (FR-FD-01..06, FR-APT-03/04/07, FR-EMR-02, FR-BIL-01/02/05/09/10/14), 05 §3.3, §3.5 and §4.1, and 07 §4. As in phase 2, each point is what the HTTP adapters will need; names and shapes map once they are settled.

| Point | What the frontend does now |
|---|---|
| Patients without an account | A desk-registered patient has a record (MRN, name, mobile, gender, date of birth, optional national ID and emergency contact) and no login (05 §3.3). Registering sends those fields; the answer is the patient summary below |
| Patient search | `GET /patients?q=` with an optional filter (has a balance, insured), at most 20 results, each with the MRN, name, mobile, gender, date of birth, national ID, whether there's a portal account, the last visit (date, doctor), the balance due and the default insurance card (company, status). The search rules (partial phone, Arabic letter folding, MRN, national ID, birth date) are FR-FD-01's |
| Duplicate check | The registration form asks for likely duplicates while typing: same mobile, or same name and date of birth (FR-FD-02). Needs a `GET /patients/duplicates?phone=&fullName=&dateOfBirth=` or equivalent; registering never refuses a duplicate |
| The desk's day | `GET /branches/{id}/calendar` for one date, each appointment with the patient (name, MRN, mobile, date of birth), status, source, the queue ticket and stage, the doctor's room (both names, R9), `attendanceConfirmed`, the deposit, `amountDue` and whether an invoice exists |
| Check-in panel | `GET /appointments/{id}/amount-due` (07) plus the patient's national ID, whether the phone was verified, and the default insurance card. One call or three |
| Walk-ins | `POST /appointments/walk-in` with patient, doctor, branch, service and the reason for the visit. The mock takes the doctor's free slot if it starts within 30 minutes, else an unslotted queue place, and caps unslotted walk-ins at 5 per doctor per day (`Appointment.WalkInCapReached`) |
| Queue entries | `GET /branches/{id}/queue`: ticket, stage, position, patient (name, age, gender, MRN, allergies), doctor, room, source, booked start, checked-in, triaged, called and completed times, how late they checked in, the priority reason, the vitals summary (BP, pulse), the reason for the visit and the amount due. Positions are branch-wide while waiting for triage and per doctor once ready |
| Reordering | 07 has `PUT /branches/{id}/queue/order` (the whole order). The board moves one patient to the front with a required reason; the adapter can build the order, but the reason (audited, FR-FD-05) needs a field |
| Calling in | `POST /appointments/{id}/call` answers `Appointment.DoctorBusy` when the doctor already has someone in the room (05 §4.1 guard; the code is the mock's) |
| Waiting-room screen | A names-free projection per doctor: room, ticket now serving, next two tickets, waiting count, today's average wait. Needs `GET /branches/{id}/queue/display` (device token, FR-FD-06) and the same `/hubs/queue` push |
| Live updates | Every front desk screen subscribes to the branch's queue (`QueueBoardService.subscribe`) and refetches on a change, standing in for `/hubs/queue` |
| Triage | 07's `POST /encounters/{id}/vitals` needs the encounter created at check-in, which arrives with EMR (backend P4). Until then the mock keys triage by appointment. The form sends the vitals, pain score, chief complaint and `allergiesConfirmed`; submitting moves the visit to ready for the doctor. Drafts are saved server-side in the mock (`Triage.saveDraft`); they could stay in the browser instead |
| Checkout | Per visit: the booked service plus lines the desk adds while the invoice is a draft (FR-BIL-02), then `POST /payments` with `{ method, amount, tendered?, reference? }`, answering `{ receiptNo, invoiceNumber, change, remaining }`. The first payment issues the invoice (number `<BRANCH>-<YYYY>-<000001>`). A receipt PDF per payment |
| Cash sessions | The user's open session (`GET /me/cash-session` or a filter), the branch's drawers with who has each open, open with a float, close with the counted amount answering the variance and whether it needs approval, and the interim or closing report as PDF |
| Settings used as constants | Check-in opens 60 minutes before the visit, no-show after 15 minutes, 5 unslotted walk-ins per doctor, variance approval above EGP 50 (`features/desk/model/policy.ts`, `features/billing/model/cash-session.ts`). They become organization settings (FR-ORG-05) |
| Error codes no doc names | `Appointment.NoShowTooEarly` (from V1), `Appointment.WalkInCapReached`, `Appointment.DoctorBusy`, `Queue.ReasonRequired`, `Vitals.OutOfRange`, `Triage.AllergiesNotConfirmed`, `Patient.NotFound`, `Invoice.NothingDue`, `Payment.InvalidAmount`, `Payment.NotFound`, `CashSession.AlreadyOpen`, `CashSession.NotOpen`, `CashDrawer.InUse`, `CashDrawer.NotFound`, `Service.NotFound`. From 07: `Appointment.CheckInWindowClosed`, `Payment.NoOpenCashSession`, `Invoice.NotDraft`, `Access.OutOfScope`. Each has a translated message in `common:errors` |

**Not in phase 3, on purpose:** discounts, refunds and voids at the desk (FR-BIL-03/08/11) need the approvals inbox (phase 5); merging duplicate patients (FR-FD-08) and printing the visit slip on a thermal printer (FR-FD-07) aren't designed yet; cancelling or rescheduling on a patient's behalf from the desk reuses the patient-side rules and comes with the manager's worklist (phase 5); insurance shares at checkout come with insurance (P5).

### P0: foundation (contract 4.0.0-p0)
| Item | Backend change | Status |
|---|---|---|
| Point at the V2 API and database | Separate `ClinicFlowV2` database; same port under `dotnet run`, ports 5002/3001 under compose | Done: `v2` branch and docs set up |
| URL fields must be `http`/`https` (contract 4.0.0-p0) | `profilePictureUrl` and `iconUrl` with another scheme return 400 with a field message | The phase 2 profile has no URL field (no picture upload in the design). Still to do for specialties (phase 6) and the doctor profile photo: validate the scheme in their zod schemas, since `type="url"` accepts `javascript:` and `file:` |
| Timestamps end in `Z` | Backend P0 PR 4, merged 2026-10-23 (contract 4.0.0-p0 changelog) | Nothing to change: `parseUtc` (`shared/lib/format.ts`) accepts both forms |
| New appointment statuses `CheckedIn`, `InProgress`, `Rescheduled` | Backend P0 PR 7, merged 2026-10-23 (contract 4.0.0-p0 changelog and §7) | Patient side done in phase 2: the appointment model with every status, one chip-tone map (`features/appointments/model/rules.ts`) and the actions each status allows. Staff side done in phase 3: check-in, walk-ins (`CheckedIn`), calling in (`InProgress`) and no-shows, with the queue stages |
| New error code `Appointment.InvalidStatusTransition` (409) | Backend P0 PR 7 | Handled as a `ServiceError` code by the rebuilt screens |
| `hasReview` was always `false` on `GET /api/appointments/{id}` and the doctor's list | Backend P0 PR 7 bug fix | Nothing to change: the rebuilt screens can rely on it |
| Notifications and emails are sent about 2 s after the action (outbox) | Backend P0 PR 9, merged 2026-10-24 (contract 4.0.0-p0 §1, #22 and changelog). Every response, status code and error code is unchanged | Done in phase 2: the mock delivers notifications 2 s after the action, and the bell refetches on focus, on every page change and every 60 s. Forgot-password needs nothing: the backend now retries failed emails and answers as fast for unknown emails as for registered ones |
