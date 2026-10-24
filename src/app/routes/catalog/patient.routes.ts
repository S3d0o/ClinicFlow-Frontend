import type { ScreenRoute } from '../types';

const PATIENT = { kind: 'patient' } as const;

// The patient portal (phase 2), mobile-first.
export const patientRoutes: ScreenRoute[] = [
  { path: '/patient', screen: 'patientHome', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/06-patient-home-and-live-queue' },
  { path: '/patient/book', screen: 'bookChoose', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/07-book-step-1-select-doctor' },
  { path: '/patient/book/:doctorId', screen: 'bookSlot', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/08-book-step-2-slot-and-payment' },
  { path: '/patient/booked/:appointmentId', screen: 'bookConfirmed', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/09-booking-confirmed' },
  { path: '/patient/appointments', screen: 'myAppointments', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/10-my-appointments' },
  { path: '/patient/appointments/:appointmentId', screen: 'appointmentDetails', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/11-appointment-details-and-queue' },
  { path: '/patient/visits', screen: 'visits', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/13-records-my-visits' },
  { path: '/patient/visits/:visitId', screen: 'visitSummary', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/14-visit-summary' },
  { path: '/patient/invoices', screen: 'invoices', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/15-invoices-and-receipts' },
  { path: '/patient/documents', screen: 'documents', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/16-documents-and-insurance' },
  { path: '/patient/profile', screen: 'profile', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/17-profile-and-settings' },
  { path: '/patient/notifications', screen: 'notifications', layout: 'patient', access: PATIENT, phase: 2, design: 'patient/18-notifications' },
];
