// In-app notifications (V1 feature, FR-NTF-03 events). Title and message are rendered by the backend
// in the recipient's preferred language (R10), like emails and SMS.

export type NotificationType =
  | 'AppointmentConfirmed'
  | 'AppointmentReminder'
  | 'AppointmentRescheduled'
  | 'AppointmentCancelled'
  | 'DepositReceived'
  | 'InvoiceIssued'
  | 'PaymentReceived'
  | 'PrescriptionReady';

export type NotificationCategory = 'appointments' | 'billing' | 'prescriptions';

export const CATEGORY_OF: Record<NotificationType, NotificationCategory> = {
  AppointmentConfirmed: 'appointments',
  AppointmentReminder: 'appointments',
  AppointmentRescheduled: 'appointments',
  AppointmentCancelled: 'appointments',
  DepositReceived: 'billing',
  InvoiceIssued: 'billing',
  PaymentReceived: 'billing',
  PrescriptionReady: 'prescriptions',
};

/** What a notification opens. */
export type NotificationLink = { kind: 'appointment' | 'invoice' | 'visit'; id: string };

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: NotificationLink;
}

/** The app path a notification opens. */
export function linkPath(link: NotificationLink): string {
  switch (link.kind) {
    case 'appointment':
      return `/patient/appointments/${link.id}`;
    case 'invoice':
      return '/patient/invoices';
    case 'visit':
      return `/patient/visits/${link.id}`;
  }
}
