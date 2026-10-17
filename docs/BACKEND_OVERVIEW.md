# ClinicFlow Backend — Overview for Frontend Developers

A short summary of the API this app talks to: what it is, the rules that shape the UI, and how the two apps connect. The backend has its own detailed documentation; this page links to it rather than repeating it.

| Resource | Where |
|---|---|
| Backend repository | https://github.com/S3d0o/ClinicFlow-Backend |
| API contract (endpoints, payloads, errors, auth) | [API_CONTRACT.md](API_CONTRACT.md) (identical copy of the backend's) |
| System overview, business rules, domain model | Backend repo: `docs/PROJECT_OVERVIEW.md` |
| Setup, configuration, Docker, demo logins | Backend repo: `docs/SETUP_AND_DEPLOYMENT.md` |
| Known backend issues and their status | Backend repo: `docs/REVIEW.md` |

When both repos are checked out side by side (`Clinic/ClinicFlow.Backend` and `Clinic/ClinicFlow.Frontend`), those files are in `../ClinicFlow.Backend/docs/`. At the time of writing they're on the backend's `docs/review-and-claude-md` branch.

---

## 1. What it is

A **.NET 10 REST API** built with Clean Architecture:

| Concern | Technology |
|---|---|
| Web | ASP.NET Core 10 controllers |
| Data | Entity Framework Core 10, SQL Server 2022 |
| Auth | ASP.NET Core Identity, JWT bearer tokens, rotating refresh tokens |
| Validation / mapping | FluentValidation, AutoMapper |
| Email | MailKit (SMTP) |
| Logging | Serilog (console, file, Seq) |
| API docs | OpenAPI + Scalar at `/scalar` (Development only) |
| Background work | An hourly appointment-reminder job |

```
ClinicFlow (host: startup, middleware, reminder job, seeding)
 ├── Presentation          controllers, request validators
 │    └── Services.Abstraction   service interfaces
 ├── Services              business logic, email, JWT
 │    └── Persistence      EF Core DbContext, migrations, repositories
 └── Domain                entities and enums
Shared                     DTOs, Result/Error types, error codes
```

Services return a `Result` instead of throwing for expected failures. One base controller turns each error into an HTTP status and a ProblemDetails body whose `title` is the error code. That's why the frontend shows errors through `src/lib/api-error.ts` (see [ARCHITECTURE.md §6](ARCHITECTURE.md#6-error-handling)).

## 2. Domain model (simplified)

```
User (Identity: email, password, names, gender, date of birth, active flag, one role)
├── PatientProfile   blood type, allergies, chronic conditions, emergency contact
├── DoctorProfile    specialty, bio, experience, fee, clinic address/city,
│   │                approved-by-admin flag, average rating, review count
│   ├── DoctorSchedule   weekly template: day, start, end, slot length, active
│   └── AppointmentSlot  a concrete slot: date, start, end, status (Available / Booked / Blocked)
├── Notification     title, message, type, read flag, related appointment id
└── RefreshToken     hashed token with rotation history

Appointment  patient ↔ slot ↔ doctor: status, reason, doctor notes, cancellation info
Review       one per completed appointment: rating 1–5, comment
Specialty    unique name, description, icon URL, active flag
```

## 3. Rules that shape the UI

| Area | Rule | Where it shows in the frontend |
|---|---|---|
| Doctor visibility | Search returns only **approved and active** doctors | New doctors wait on the admin's Pending page |
| Schedules | **One schedule per doctor per weekday**; slot length 10–120 minutes; the window must fit at least one slot | Schedules page hides "+ Add" on scheduled days and validates times |
| Slot generation | Slots are generated for the **next 14 days** from active schedules. Editing a schedule regenerates future available slots; booked slots are kept | Booking date picker stops at 14 days |
| Booking | The slot must be available and not started. A database-level guard makes sure only one booking wins | "Slot already booked" message and slot refresh |
| Patient cancel | Own appointment, not cancelled or completed, **at least 2 hours before** the start | Cancel dialog note; error message after the window |
| Doctor / admin cancel | Any time | Not in the UI yet |
| Completion and notes | Only the owning doctor; not on cancelled appointments | Doctor appointments page |
| Reviews | Only for a completed appointment, **once**; rating 1–5, comment ≤ 300 characters | Review button and dialog |
| Login | 5 wrong passwords lock the account for 15 minutes; suspended or unconfirmed accounts can't sign in | Login error messages |
| Sessions | Access token 15 minutes; refresh token 7 days, **single use**. Reusing an old refresh token can revoke all of the user's sessions | Single-flight refresh in `axios.ts` |
| Suspension / password reset | Revokes the user's refresh tokens | User is signed out on the next refresh |
| Reminders | Hourly job: email and notification for confirmed appointments starting within 24 hours | Reminder notifications |
| Times | Slot dates and times are clinic wall-clock time; timestamps are UTC, often without a `Z` | Date handling in [ARCHITECTURE.md §8](ARCHITECTURE.md#8-shared-helpers-and-types) |

A booking is `Confirmed` immediately; `Pending` is never used. Since contract 3.0.0 the owning doctor or an admin can mark a missed visit as `NoShow`, 15 minutes after its start (#24b).

## 4. How the two apps connect

| Setup | Frontend | Backend | How API requests reach the backend |
|---|---|---|---|
| Local development | `npm run dev` → http://localhost:3000 | `dotnet run` → http://localhost:5143 (or https://localhost:7129) | Directly, via `VITE_API_URL` in `.env.local` |
| Docker Compose (backend repo) | nginx container → http://localhost:3000 | container on port 8080, published as http://localhost:5001 | The browser calls `/api` on port 3000, and nginx forwards it to `http://backend:8080` |

The backend setting that matters most to the frontend is **`Frontend:BaseUrl`** (default `http://localhost:3000`). It is:
- the **only origin allowed by CORS**;
- the base of the **links in emails** (`/#/confirm-email`, `/#/reset-password`).

If the frontend moves to another URL, update this setting.

**Startup behavior:**
- The backend applies database migrations and seeds roles and specialties on every start.
- In **Development** it also seeds a demo clinic (admin, doctors, patients, appointments). The demo logins are listed in the backend's `docs/SETUP_AND_DEPLOYMENT.md`.
- In **Production** (including Compose) there's no demo data. A first admin is created from `Seeding:AdminEmail` / `Seeding:AdminPassword` (`ADMIN_EMAIL` / `ADMIN_PASSWORD` in Compose).

## 5. Known backend issues that affect the frontend

These are tracked in the backend's `docs/REVIEW.md` and contract [§9](API_CONTRACT.md#9-pending-contract-changes):
- Unapproved doctors can sign in. They just don't appear in search.
- There's no endpoint for a doctor to read their own professional profile, so the frontend's Professional tab starts blank.

Fixed since: expected errors return 400/404/409 instead of 500 (contract 2.0.0); time rules use the clinic's time zone instead of UTC, and slots no longer run out after 14 days (3.0.0).
