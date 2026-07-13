# ClinicFlow — Frontend

> A modern clinic management platform built with React, TypeScript, and Vite — connecting patients with doctors through a seamless booking experience.

---

## Overview

ClinicFlow is a full-stack clinic management system. This repository contains the **React/TypeScript frontend**. It interfaces with a [.NET 10 REST API backend](#backend) to provide role-based dashboards for Patients, Doctors, and Admins.

### Key Features

- **Patient** — Browse and search doctors by name, city, and specialty; book appointments; manage and cancel bookings; submit reviews; receive email and real-time notifications
- **Doctor** — Manage weekly schedules and appointment slots; view and complete appointments; add clinical notes; track dashboard metrics
- **Admin** — Platform-wide analytics dashboard with charts; manage specialties; approve/reject pending doctor registrations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Animations | Framer Motion |
| Charts | Recharts |
| HTTP Client | Axios |
| Email (backend) | MailKit |
| Auth | JWT + Refresh Tokens |
| Notifications | SignalR (real-time) |

---

## Screenshots

> _Add screenshots here after deployment_

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- The [ClinicFlow backend API](#backend) running locally on `https://localhost:7129`

### Installation

```bash
# Clone the repository
git clone https://github.com/S3d0o/clinicflow-frontend.git
cd clinicflow-frontend/app

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment

The API base URL is configured in `src/api/axios.ts`. Update it if your backend runs on a different port:

```ts
const BASE_URL = 'https://localhost:YOUR_PORT/api';
```

---

## Project Structure

```
app/
├── public/
└── src/
    ├── api/              # Axios instance + all API service modules
    │   ├── axios.ts      # Base client with JWT interceptors & token refresh
    │   ├── auth.ts
    │   ├── doctors.ts
    │   ├── appointments.ts
    │   ├── notifications.ts
    │   └── admin.ts
    ├── components/
    │   ├── ui/           # shadcn/ui component library
    │   └── Navbar.tsx    # Animated navbar with notification bell
    ├── context/
    │   └── AuthContext.tsx  # JWT auth state, role-based access
    ├── pages/
    │   ├── LandingPage.tsx
    │   ├── DoctorsPage.tsx
    │   ├── DoctorDetailPage.tsx
    │   ├── PatientAppointmentsPage.tsx
    │   ├── DoctorDashboardPage.tsx
    │   ├── DoctorSchedulesPage.tsx
    │   ├── AdminDashboardPage.tsx
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   ├── ConfirmEmailPage.tsx
    │   └── ResetPasswordPage.tsx
    ├── types/
    │   └── index.ts      # All shared TypeScript interfaces
    ├── App.tsx           # Route definitions
    ├── main.tsx          # App entry point
    └── index.css         # Tailwind base + CSS variables (teal theme)
```

---

## Authentication Flow

- Registration sends a **confirmation email** via MailKit — the user must verify before logging in
- Login returns an **access token** (short-lived JWT) and a **refresh token** (stored in `localStorage`)
- Axios interceptors automatically refresh the access token on 401 responses
- Role-based routing enforces access to Patient, Doctor, and Admin pages

---

## Role-Based Access

| Route | Patient | Doctor | Admin |
|---|:---:|:---:|:---:|
| `/` | ✅ | ✅ | ✅ |
| `/doctors` | ✅ | ✅ | ✅ |
| `/doctors/:id` | ✅ | ✅ | ✅ |
| `/patient/appointments` | ✅ | ❌ | ❌ |
| `/doctor/dashboard` | ❌ | ✅ | ❌ |
| `/doctor/schedules` | ❌ | ✅ | ❌ |
| `/admin/dashboard` | ❌ | ❌ | ✅ |

---

## Appointment Flow

```
Patient books slot → Status: Confirmed (auto, doctor schedule is trusted)
    │
    ├── Patient cancels (up to 2h before) → Status: Cancelled
    ├── Doctor cancels → Status: Cancelled
    └── Doctor marks complete → Status: Completed
                                      │
                                      └── Patient can leave a review
```

---

## Notifications

- **In-app** — Bell icon in the navbar shows unread count with a red badge; click any notification to mark it as read; "Mark all read" clears all
- **Email** — Appointment confirmation and reminder emails sent via MailKit with a branded HTML template
- **Real-time** — SignalR connection pushes new notifications live without page refresh

---

## Backend

The backend is a **.NET 10 clean-architecture REST API** with:

- ASP.NET Core Web API
- Entity Framework Core + SQL Server
- ASP.NET Core Identity (JWT + Refresh Tokens)
- MailKit (transactional email)
- background jobs — appointment reminders

> Backend repository: _add link here_

---

## Author

**Saad Mohamed**
Final-year Physics & Computer Science student — Ain Shams University, Egypt

- GitHub: [@S3d0o](https://github.com/S3d0o)
- LinkedIn: [linkedin.com/in/saad-mohamed-li](https://linkedin.com/in/saad-mohamed-li)

---

## License

This project is for educational and portfolio purposes.
