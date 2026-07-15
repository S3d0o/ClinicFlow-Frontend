# 🏥 ClinicFlow — Frontend

> React + TypeScript frontend for ClinicFlow — a full-stack clinic management platform connecting patients with doctors through a seamless booking experience.

**→ [Backend Repository](https://github.com/S3d0o/ClinicFlow) · [Live API Docs](https://registry.scalar.com/@default-team-2gu37/apis/clinicflow-v1@1.0.0) · [Live Demo on LinkedIn](https://www.linkedin.com/in/saad-mohamed-li/)**

> 📸 Screenshots, demo video, full feature breakdown, and seeded test accounts are all documented in the **[Backend Repository](https://github.com/S3d0o/ClinicFlow)**.

---

## Overview

This repository contains the **React/TypeScript frontend** for ClinicFlow. It interfaces with a [.NET 10 Clean Architecture REST API](https://github.com/S3d0o/ClinicFlow) to provide role-based dashboards for Patients, Doctors, and Admins.

- **Patient** — Browse and search doctors by specialty and city; book appointment slots; manage and cancel bookings; submit reviews; receive in-app and email notifications
- **Doctor** — Manage weekly schedules and slots; view, complete, and add clinical notes to appointments
- **Admin** — Platform-wide analytics dashboard; approve or reject pending doctor registrations; manage specialties

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| HTTP Client | Axios |
| Auth | JWT + Refresh Token rotation |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- The [ClinicFlow backend](https://github.com/S3d0o/ClinicFlow) running locally on `https://localhost:7129`

### Installation

```bash
git clone https://github.com/S3d0o/ClinicFlow-Frontend.git
cd ClinicFlow-Frontend/app
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### API Base URL

Configured in `src/api/axios.ts` — update if your backend runs on a different port:

```ts
const BASE_URL = 'https://localhost:YOUR_PORT/api';
```

---

## 📁 Project Structure

```
app/
├── public/
└── src/
    ├── api/                  # Axios instance + all API service modules
    │   ├── axios.ts          # Base client with JWT interceptors & token refresh
    │   ├── auth.ts
    │   ├── doctors.ts
    │   ├── appointments.ts
    │   ├── notifications.ts
    │   └── admin.ts
    ├── components/
    │   ├── ui/               # shadcn/ui component library
    │   └── Navbar.tsx        # Animated navbar with notification bell
    ├── context/
    │   └── AuthContext.tsx   # JWT auth state, role-based access
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
    │   └── index.ts          # All shared TypeScript interfaces
    ├── App.tsx               # Route definitions
    ├── main.tsx              # App entry point
    └── index.css             # Tailwind base + CSS variables (teal theme)
```

---

## 🔐 Authentication Flow

- Registration sends a **confirmation email** — user must verify before logging in
- Login returns a short-lived **access token** (JWT) and a **refresh token**
- Axios interceptors automatically refresh the access token on 401 responses
- Role-based routing enforces access to Patient, Doctor, and Admin pages

---

## 👥 Role-Based Access

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

## 📅 Appointment Flow

```
Patient books slot → Status: Confirmed
    │
    ├── Patient cancels (up to 2h before) → Status: Cancelled
    ├── Doctor cancels               → Status: Cancelled
    └── Doctor marks complete        → Status: Completed
                                           │
                                           └── Patient can leave a review
```

---

## 🔔 Notifications

- **In-app** — Bell icon in the navbar with unread count badge; click to mark as read; "Mark all read" support
- **Email** — Booking confirmations and appointment reminders sent via MailKit on the backend

---

## 👤 Author

**Saad Mohamed**
Final-year Physics & Computer Science student — Ain Shams University, Egypt

- GitHub: [@S3d0o](https://github.com/S3d0o)
- LinkedIn: [linkedin.com/in/saad-mohamed-li](https://linkedin.com/in/saad-mohamed-li)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
