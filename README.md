# ClinicFlow — Frontend

> A clinic-booking web app built with React, TypeScript and Vite. Patients find doctors and book appointments, doctors manage their schedules and visits, and admins run the platform.

This repository is the **React frontend**. It talks to the [ClinicFlow .NET 10 backend](https://github.com/S3d0o/ClinicFlow-Backend) through a REST API described in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

**→ [Backend Repository](https://github.com/S3d0o/ClinicFlow-Backend) · [Live API Docs](https://registry.scalar.com/@default-team-2gu37/apis/clinicflow-v1@1.0.0) · [Live Demo on LinkedIn](https://www.linkedin.com/posts/saad-mohamed-li_dotnet-csharp-react-ugcPost-7483058574588379136-R35x/?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAAFtidxABr0vs0HxJVu7Xnwvp_d1T8J8FNdM)**

> **Looking for the original UI?** It is kept on the [`legacy-ui`](https://github.com/S3d0o/ClinicFlow-Frontend/tree/legacy-ui) branch (tag `v0-legacy-ui`). The LinkedIn demo shows that version.

> **This is the `v2` branch.** V2 turns ClinicFlow into the operating system of a multi-branch clinic (seven roles, front desk, nurse station, clinical records, billing, insurance), in Arabic and English. Its UI is being rebuilt in phases from the designs in [`design-v2/`](design-v2/README.md) and runs on sample data until the V2 API exists; see [docs/FEATURES.md](docs/FEATURES.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). The feature list below describes V1, which lives on `main`.

---

## Features

- **Patients:**
  - search doctors by name, city and specialty, and sort by rating, fee or experience;
  - book an available slot in the next 14 days;
  - cancel up to 2 hours before an appointment;
  - review completed visits;
  - manage personal and medical information;
  - read in-app notifications.
- **Doctors:**
  - publish weekly availability (one schedule per weekday; slots are generated automatically);
  - see today's appointments;
  - complete visits and add clinical notes;
  - manage their professional profile.
- **Admins:**
  - platform dashboard with charts;
  - approve or reject newly registered doctors;
  - manage medical specialties.
- **Accounts:**
  - email confirmation and password reset by email;
  - sessions that stay signed in and renew their tokens silently.

The full feature guide, with every page and its rules, is in [docs/FEATURES.md](docs/FEATURES.md).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.9 |
| Build tool | Vite 7 |
| Routing | React Router 7 (`HashRouter`) |
| Styling | Tailwind CSS 3 |
| UI components | shadcn/ui (Radix UI primitives), lucide-react icons |
| HTTP | axios (JWT + refresh-token interceptors) |
| Toasts | sonner |
| Tests | Vitest, Testing Library (jsdom) |
| Deployment | Docker (Node build → nginx) |

## Getting started

**Prerequisites:**
- Node.js 20+ and npm;
- the [ClinicFlow backend](https://github.com/S3d0o/ClinicFlow-Backend) running locally (by default on `http://localhost:5143`).

```bash
git clone https://github.com/S3d0o/ClinicFlow-Frontend.git
cd ClinicFlow-Frontend
npm install
```

The dev server has no proxy, so tell it where the backend is. Create a file named `.env.local` in the project root containing:

```
VITE_API_URL=http://localhost:5143
```

Then start the app:

```bash
npm run dev
```

Open http://localhost:3000. Keep port 3000, because the backend only allows that origin by default (CORS).

In Development the backend seeds demo accounts (admin, doctors, patients). Their logins are listed in the backend repo's `docs/SETUP_AND_DEPLOYMENT.md`.

To run the whole stack (SQL Server + backend + frontend) with Docker, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#full-stack-with-docker).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Type check (`tsc -b`) and production build to `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Run the unit and component tests (Vitest) |
| `npm run preview` | Serve the production build |

## Documentation

| Document | Contents |
|---|---|
| [docs/FEATURES.md](docs/FEATURES.md) | What each role can do, page by page, with the business rules |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Routing, API layer, authentication and token refresh, error handling, UI system, build |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, configuration, running with the backend or Docker, how-to recipes, conventions, troubleshooting |
| [docs/BACKEND_OVERVIEW.md](docs/BACKEND_OVERVIEW.md) | The .NET backend in brief, the rules that shape the UI, and how the two apps connect |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | The shared backend ↔ frontend API contract (endpoints, payloads, errors, auth) |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | Open issues, recent fixes and the improvement roadmap |

## Project structure

On the `v2` branch:

```
ClinicFlow-Frontend/
├── design-v2/            V2 Stitch designs: screens (HTML + screenshot), design system, UX notes
├── docs/                 Documentation (see above)
├── src/
│   ├── app/              Composition root: providers, service container, i18n, screen catalog and routes
│   ├── shells/           Frames: public, auth, patient, staff, tablet, bare
│   ├── features/         One folder per domain: model, service interface + mock, hooks, components, pages
│   ├── shared/           Design system (ui), helpers (lib), translations (i18n), HTTP client (api)
│   ├── mocks/            In-memory backend and seed data
│   ├── styles/           Theme tokens and base styles
│   └── main.tsx          Entry point
├── DockerFile            Production image (Node build → nginx)
└── nginx.conf            Serves the app and proxies /api to the backend
```

## Backend

The backend is a **.NET 10 Clean Architecture REST API**:
- ASP.NET Core, Entity Framework Core and SQL Server;
- ASP.NET Core Identity with JWT and rotating refresh tokens;
- MailKit for email;
- an hourly reminder job.

Repository: https://github.com/S3d0o/ClinicFlow-Backend. For a summary aimed at frontend developers, see [docs/BACKEND_OVERVIEW.md](docs/BACKEND_OVERVIEW.md).

---

## Author

**Saad Mohamed**
Final-year Physics & Computer Science student — Ain Shams University, Egypt

- GitHub: [@S3d0o](https://github.com/S3d0o)
- LinkedIn: [linkedin.com/in/saad-mohamed-li](https://linkedin.com/in/saad-mohamed-li)

---

## License

This project is for educational and portfolio purposes.
