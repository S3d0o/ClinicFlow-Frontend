import type { Language } from '@/shared/i18n/languages';

/** How booking confirmations and reminders reach the patient (FR-NTF-04). `Phone` is WhatsApp, or SMS when the platform has it on (backend 06 §9.2). */
export type NotificationChannel = 'Phone' | 'Email' | 'Both';

export interface Allergy {
  name: string;
  severity?: 'Mild' | 'Moderate' | 'Severe';
}

/** The patient's own profile (`GET /api/v2/me` plus their patient record's summary lists). */
export interface PatientProfile {
  fullName: string;
  /** Record number at the clinic (FR-FD-02). */
  mrn: string;
  memberSince: string;
  phone: string;
  phoneVerified: boolean;
  email?: string;
  emailConfirmed: boolean;
  notificationChannel: NotificationChannel;
  preferredLanguage: Language;
  bloodType?: string;
  allergies: Allergy[];
  conditions: string[];
}

/** Email delivery needs a confirmed email (FR-NTF-04). */
export const channelAllowed = (channel: NotificationChannel, emailConfirmed: boolean) => channel === 'Phone' || emailConfirmed;
