# ClinicFlow Frontend — Known Issues and Roadmap

Open problems in the frontend, the improvements planned for them, and recent fixes. It's based on a full code audit (October 2026), updated after the UI/UX redesign (branch `feature/ui-ux-redesign`). Backend issues are tracked separately in the backend repo's `docs/REVIEW.md`.

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

V2 is built on the `v2` branch against the backend's `v2` branch (see `CLAUDE.md`, "V1 and V2"). Its phases P0–P7 and the frontend work for each are planned in the backend repo: `docs/v2/09_MIGRATION_FROM_V1.md` §4 and `docs/v2/10_ROADMAP.md`. The table below tracks the frontend side of the current phase.

### P0: foundation (contract 4.0.0-p0)
| Item | Backend change | Status |
|---|---|---|
| Point at the V2 API and database | Separate `ClinicFlowV2` database; same port under `dotnet run`, ports 5002/3001 under compose | Done: `v2` branch and docs set up |
| URL fields must be `http`/`https` (contract 4.0.0-p0) | `profilePictureUrl` and `iconUrl` with another scheme return 400 with a field message | The message reaches the user through `getApiErrorMessage`. Optional: check the scheme in the form before sending, since `type="url"` accepts `javascript:` and `file:` |
| Timestamps end in `Z` | Backend P0 PR 4 | Nothing to change: `parseUtc` already accepts both forms. Check the screens once PR 4 is merged |
| New appointment statuses `CheckedIn`, `InProgress`, `Rescheduled` | Backend P0 PR 7 | To do: types, `StatusBadge`, filters and the actions each status allows |
