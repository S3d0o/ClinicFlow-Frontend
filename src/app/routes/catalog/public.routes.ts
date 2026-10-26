import { lazy } from 'react';
import type { ScreenRoute } from '../types';

const PUBLIC = { kind: 'public' } as const;
const GUEST = { kind: 'guest' } as const;

// Visitors, account access and the doctor application (phase 1); the reminder message page (phase 2).
export const publicRoutes: ScreenRoute[] = [
  {
    path: '/', screen: 'landing', layout: 'public', access: PUBLIC, phase: 1, design: 'public/01-outpatient-clinic-network-landing-page',
    component: lazy(() => import('@/features/site/pages/LandingPage')),
  },
  {
    path: '/doctors', screen: 'findDoctor', layout: 'public', access: PUBLIC, phase: 1, design: 'public/03-find-a-doctor',
    component: lazy(() => import('@/features/doctors/pages/FindDoctorPage')),
  },
  {
    path: '/doctors/:doctorId', screen: 'doctorProfile', layout: 'public', access: PUBLIC, phase: 1, design: 'public/04-doctor-profile-and-booking',
    component: lazy(() => import('@/features/doctors/pages/DoctorProfilePage')),
  },
  {
    path: '/join', screen: 'joinAsDoctor', layout: 'public', access: PUBLIC, phase: 1, design: 'public/05-join-as-a-doctor-application',
    component: lazy(() => import('@/features/recruitment/pages/JoinPage')),
  },
  {
    path: '/my-application', screen: 'myApplication', layout: 'public', access: { kind: 'applicant' }, phase: 1, design: 'public/06-my-application-status',
    component: lazy(() => import('@/features/recruitment/pages/MyApplicationPage')),
  },

  {
    path: '/sign-in', screen: 'signIn', layout: 'auth', access: GUEST, phase: 1, design: 'public/02-patient-and-staff-sign-in',
    component: lazy(() => import('@/features/auth/pages/SignInPage')),
  },
  {
    path: '/sign-in/verify', screen: 'staffMfa', layout: 'auth', access: GUEST, phase: 1, design: 'public/07-staff-sign-in-step-2-2fa',
    component: lazy(() => import('@/features/auth/pages/StaffMfaPage')),
  },
  {
    path: '/security/setup', screen: 'mfaSetup', layout: 'auth', access: { kind: 'signed-in' }, phase: 1, design: 'public/08-staff-two-step-sign-in-setup',
    component: lazy(() => import('@/features/auth/pages/MfaSetupPage')),
  },
  {
    path: '/invitation/:token', screen: 'acceptInvitation', layout: 'auth', access: GUEST, phase: 1, design: 'public/09-accept-staff-invitation',
    component: lazy(() => import('@/features/auth/pages/AcceptInvitationPage')),
  },
  {
    path: '/sign-up', screen: 'signUp', layout: 'auth', access: GUEST, phase: 1, design: 'patient/01-patient-sign-up',
    component: lazy(() => import('@/features/auth/pages/SignUpPage')),
  },
  {
    path: '/sign-up/verify', screen: 'verifyPhone', layout: 'auth', access: GUEST, phase: 1, design: 'patient/02-verify-your-phone',
    component: lazy(() => import('@/features/auth/pages/VerifyPhonePage')),
  },
  {
    path: '/forgot-password', screen: 'forgotPassword', layout: 'auth', access: GUEST, phase: 1, design: 'patient/03-reset-password-step-1',
    component: lazy(() => import('@/features/auth/pages/ForgotPasswordPage')),
  },
  {
    // The one-time code step reuses the verify-phone design
    path: '/forgot-password/verify', screen: 'resetCode', layout: 'auth', access: GUEST, phase: 1, design: 'patient/02-verify-your-phone',
    component: lazy(() => import('@/features/auth/pages/ResetCodePage')),
  },
  {
    // Opened from the reset email (`/#/reset-password?userId=…&token=…`, API contract §13.9), so it stays public
    path: '/reset-password', screen: 'resetPassword', layout: 'auth', access: PUBLIC, phase: 1, design: 'patient/04-set-new-password',
    component: lazy(() => import('@/features/auth/pages/ResetPasswordPage')),
  },
  {
    // Opened from the confirmation email (API contract §8); the designs leave this page out
    path: '/confirm-email', screen: 'confirmEmail', layout: 'auth', access: PUBLIC, phase: 1,
    component: lazy(() => import('@/features/auth/pages/ConfirmEmailPage')),
  },
  {
    path: '/locked', screen: 'locked', layout: 'auth', access: PUBLIC, phase: 1, design: 'patient/05-too-many-attempts',
    component: lazy(() => import('@/features/auth/pages/LockedPage')),
  },

  {
    // Opened from the reminder message without signing in (FR-APT-10)
    path: '/r/:token', screen: 'reminder', layout: 'bare', access: PUBLIC, phase: 2, design: 'patient/12-sms-visit-reminder-page',
    component: lazy(() => import('@/features/appointments/pages/ReminderPage')),
  },
];
