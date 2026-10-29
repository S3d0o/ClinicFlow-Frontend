import { lazy } from 'react';
import type { ScreenRoute } from '../types';

const PATIENT = { kind: 'patient' } as const;

// The patient portal (phase 2), mobile-first.
export const patientRoutes: ScreenRoute[] = [
  {
    path: '/patient', screen: 'patientHome', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/06-patient-home-and-live-queue',
    component: lazy(() => import('@/features/appointments/pages/PatientHomePage')),
  },
  {
    path: '/patient/book', screen: 'bookChoose', layout: 'patient', access: { ...PATIENT, module: 'PAT' }, phase: 2, design: 'patient/07-book-step-1-select-doctor',
    component: lazy(() => import('@/features/appointments/pages/BookChoosePage')),
  },
  {
    path: '/patient/book/:doctorId', screen: 'bookSlot', layout: 'patient', access: { ...PATIENT, module: 'PAT' }, phase: 2, design: 'patient/08-book-step-2-slot-and-payment',
    component: lazy(() => import('@/features/appointments/pages/BookSlotPage')),
  },
  {
    path: '/patient/booked/:appointmentId', screen: 'bookConfirmed', layout: 'patient', access: { ...PATIENT, module: 'PAT' }, phase: 2, design: 'patient/09-booking-confirmed',
    component: lazy(() => import('@/features/appointments/pages/BookingConfirmedPage')),
  },
  {
    path: '/patient/appointments', screen: 'myAppointments', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/10-my-appointments',
    component: lazy(() => import('@/features/appointments/pages/MyAppointmentsPage')),
  },
  {
    path: '/patient/appointments/:appointmentId', screen: 'appointmentDetails', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/11-appointment-details-and-queue',
    component: lazy(() => import('@/features/appointments/pages/AppointmentDetailsPage')),
  },
  {
    path: '/patient/visits', screen: 'visits', layout: 'patient', access: { ...PATIENT, module: 'EMR' }, phase: 2, design: 'patient/13-records-my-visits',
    component: lazy(() => import('@/features/visits/pages/VisitsPage')),
  },
  {
    path: '/patient/visits/:visitId', screen: 'visitSummary', layout: 'patient', access: { ...PATIENT, module: 'EMR' }, phase: 2, design: 'patient/14-visit-summary',
    component: lazy(() => import('@/features/visits/pages/VisitSummaryPage')),
  },
  {
    path: '/patient/invoices', screen: 'invoices', layout: 'patient', access: { ...PATIENT, module: 'BIL' }, phase: 2, design: 'patient/15-invoices-and-receipts',
    component: lazy(() => import('@/features/billing/pages/InvoicesPage')),
  },
  {
    path: '/patient/documents', screen: 'documents', layout: 'patient', access: { ...PATIENT, module: 'EMR' }, phase: 2, design: 'patient/16-documents-and-insurance',
    component: lazy(() => import('@/features/documents/pages/DocumentsPage')),
  },
  {
    path: '/patient/profile', screen: 'profile', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/17-profile-and-settings',
    component: lazy(() => import('@/features/profile/pages/ProfilePage')),
  },
  {
    path: '/patient/notifications', screen: 'notifications', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/18-notifications',
    component: lazy(() => import('@/features/notifications/pages/NotificationsPage')),
  },
];
