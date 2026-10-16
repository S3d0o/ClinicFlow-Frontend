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
| `ForgotPasswordPage` shows success even when the server failed to send the email | The user waits for an email that never arrives |

### Missing features — P2 (to confirm)
| Issue | Notes |
|---|---|
| Doctors can't cancel appointments in the UI | The API supports it (contract #22) |
| The doctor's Practice tab can't show current values | Needs a backend endpoint |
| No real-time notifications (polling only) | The contract has no push channel |

### Performance and security — P2
- `nginx.conf` sets no security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame ancestors).
- Tokens are stored in `localStorage`, so an XSS bug could steal them. Moving to cookies needs backend changes.
- `recharts` is still a dependency but no page uses it (only the unused `components/ui/chart.tsx` template). It can be removed together with that file.

### Code health — P3
- **Lint:** 22 known errors. 13 are `react-hooks/set-state-in-effect` from loading data inside `useEffect` (a shared data-loading hook would fix them). 8 are `only-export-components` and 1 is `purity`, both in the generated `components/ui` files.
- **Unused code:**
  - about 40 unused `components/ui` files;
  - unused dependencies (`zod`, `@hookform/resolvers`, `kimi-plugin-inspect-react`, `tw-animate-css`, and libraries only used by unused ui files).
- **No automated tests and no CI.** Visual checks so far have been screenshot runs with stubbed API data.
- **Docker file name:** git tracks the file as `DockerFile` (capital F), so Linux builds need `-f DockerFile`.

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| 0 | Toolchain baseline (build, lint) | Done |
| 1 | Critical correctness and contract compliance | Done |
| 2 | Navigation, return-after-login, notification polling | Done in the redesign |
| 3 | Types aligned with the contract, date/time helpers, form validation, profile load errors | Mostly done (types and phone validation remain) |
| 4 | Shared components, dead-code removal | Done (unused ui files and dependencies remain) |
| 5 | Accessibility and UI polish, landing page content | Done; doctor cancel UI remains (to confirm) |
| 6 | Code splitting, font loading, nginx security headers | Code splitting and fonts done; headers remain |
| 7 | Tests (Vitest + Testing Library) and documentation upkeep | Planned |

Open questions for the maintainer:
- Should test tooling be added?
- Should unused dependencies and ui files be removed?
- Should doctors be able to cancel from the UI?
