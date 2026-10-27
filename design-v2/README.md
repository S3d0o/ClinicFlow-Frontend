# ClinicFlow V2 — Stitch designs

The V2 screen designs, generated in Google Stitch (project **ClinicFlow_V2**, `projects/14355761777684120104`) from the V2 plan in the backend repo (`docs/v2/` on its `v2` branch). They are the visual reference for the V2 frontend. The V1 Stitch export in `design/` stays local and git-ignored; this folder is tracked.

| File | What it is |
|---|---|
| `DESIGN.md` | The **ClinicFlow Navy** design system: colors, type scale, radius, layout and component rules (Stitch asset `assets/02e2c86abf1344a5b8aa224c79518a91`) |
| `UX_NOTES.md` | UX enhancements from research on similar products (Vezeeta reviews, reminder and wait-time studies, OTP and patient-portal guidance), mapped to screens |
| `screens/<area>/<NN-name>/` | One folder per screen: `code.html` (Stitch's HTML + Tailwind) and `screen.png` (screenshot, 1280 px wide for desktop and tablet, 390 px for mobile) |
| `screens.json` | Index of every screen: area, order, name, folder, device and Stitch screen id |
| `export-stitch.mjs` | Re-exports the screens: `node design-v2/export-stitch.mjs <list_screens.json> design-v2`, where the JSON is the output of the Stitch MCP `list_screens` call |

## Visual direction

Navy brand in the style of nawy.com: primary `#1E4164`, deep navy `#13263B`, a sparing orange accent `#FF5E00`, info blue `#015C9A`, canvas `#F7F9FD`, hairline borders `#D3DBE6`. Plus Jakarta Sans for headings, Inter for UI. Green appears only in semantic statuses (Confirmed, Completed). Screens are in English; Arabic (right-to-left, the default language) is handled in code.

## Screens (63)

| Area | Device | Screens |
|---|---|---|
| `public` | Desktop | Landing, sign in, find a doctor, doctor profile, join as a doctor, my application, staff 2FA step, 2FA setup, accept invitation |
| `patient` | Mobile | Sign up, verify phone, reset password, set new password, too many attempts, home with live queue, book (2 steps), booking confirmed, my appointments, appointment details, SMS reminder page, my visits, visit summary, invoices, documents and insurance, profile and settings, notifications |
| `front-desk` | Desktop | Today, patient search and register, book / walk-in, check-in, queue board, waiting-room TV, checkout, cash session |
| `nurse` | Tablet | Triage queue, vitals and triage form |
| `doctor` | Desktop | Today, encounter workspace, patient history, my schedule and leave |
| `manager` | Desktop | Dashboard (4 KPI tiles, 4 charts), services and price list, recruitment, application detail, doctor schedules, leave and reschedule worklist, approvals, daily close, reports |
| `accountant` | Desktop | Overview, invoices, payers and plans, claims |
| `admin` | Desktop | Overview, staff, staff detail, roles and permissions, branches, settings, integrations and templates, audit log, specialties |

Not designed yet: the patient chat assistant (phase P7; its scope is decided at that phase's kickoff).

## Using these designs

- Take layout, hierarchy and components from the screens; take behavior, rules and data shapes from the V2 docs and `docs/API_CONTRACT.md`. Where they disagree, the docs win.
- Stitch filled the screens with sample content, some of it invented. Don't carry these into the app: the "Emergency Admit" button (V2 is outpatient only), valet parking, refreshments, hotline numbers, "zero waiting queues", "reserve in 30 seconds", ValU installments, named insurers, and hex codes or anomaly notes in chart captions; on the doctor's screens, "Send to ECG Room", "Dictate", "ETA Slip & SMS", in-clinic ECG strips, the "Smart Dispatch Engine", leave categories, a leave balance and shift swaps. WhatsApp reminders are no longer invented: since 2026-10-26 WhatsApp is the first phone channel (backend 06 §9.2), so a screen may say a reminder went by WhatsApp.
- The sign-in screen's "Patient / Doctor-Staff" tabs are not needed: everyone signs in with one phone-or-email field, and staff then get the two-step code (pending the owner's confirmation).
