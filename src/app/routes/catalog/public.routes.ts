import { lazy } from 'react';
import type { ScreenRoute } from '../types';

const PUBLIC = { kind: 'public' } as const;
const GUEST = { kind: 'guest' } as const;

// Visitors, account access and the doctor application (phase 1); the SMS reminder page (phase 2).
export const publicRoutes: ScreenRoute[] = [
  { path: '/', screen: 'landing', layout: 'public', access: PUBLIC, phase: 1, design: 'public/01-outpatient-clinic-network-landing-page' },
  { path: '/doctors', screen: 'findDoctor', layout: 'public', access: PUBLIC, phase: 1, design: 'public/03-find-a-doctor' },
  { path: '/doctors/:doctorId', screen: 'doctorProfile', layout: 'public', access: PUBLIC, phase: 1, design: 'public/04-doctor-profile-and-booking' },
  { path: '/join', screen: 'joinAsDoctor', layout: 'public', access: PUBLIC, phase: 1, design: 'public/05-join-as-a-doctor-application' },
  { path: '/my-application', screen: 'myApplication', layout: 'public', access: { kind: 'applicant' }, phase: 1, design: 'public/06-my-application-status' },

  {
    path: '/sign-in', screen: 'signIn', layout: 'auth', access: GUEST, phase: 1, design: 'public/02-patient-and-staff-sign-in',
    // The demo account picker stands in for the sign-in screen until phase 1 builds it
    component: lazy(() => import('@/features/auth/pages/DemoSignInPage')),
  },
  { path: '/sign-in/verify', screen: 'staffMfa', layout: 'auth', access: GUEST, phase: 1, design: 'public/07-staff-sign-in-step-2-2fa' },
  { path: '/security/setup', screen: 'mfaSetup', layout: 'auth', access: { kind: 'signed-in' }, phase: 1, design: 'public/08-staff-two-step-sign-in-setup' },
  { path: '/invitation/:token', screen: 'acceptInvitation', layout: 'auth', access: GUEST, phase: 1, design: 'public/09-accept-staff-invitation' },
  { path: '/sign-up', screen: 'signUp', layout: 'auth', access: GUEST, phase: 1, design: 'patient/01-patient-sign-up' },
  { path: '/sign-up/verify', screen: 'verifyPhone', layout: 'auth', access: GUEST, phase: 1, design: 'patient/02-verify-your-phone' },
  { path: '/forgot-password', screen: 'forgotPassword', layout: 'auth', access: GUEST, phase: 1, design: 'patient/03-reset-password-step-1' },
  // Opened from the reset email (`/#/reset-password?…`, API contract §8), so it stays public
  { path: '/reset-password', screen: 'resetPassword', layout: 'auth', access: PUBLIC, phase: 1, design: 'patient/04-set-new-password' },
  { path: '/locked', screen: 'locked', layout: 'auth', access: PUBLIC, phase: 1, design: 'patient/05-too-many-attempts' },

  { path: '/r/:token', screen: 'reminder', layout: 'bare', access: PUBLIC, phase: 2, design: 'patient/12-sms-visit-reminder-page' },
];
