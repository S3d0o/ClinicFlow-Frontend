import type { NotificationLink, NotificationType } from '@/features/notifications/model/notification';
import type { Language } from '@/shared/i18n/languages';
import { formatDay, formatMoney, formatWallClock } from '@/shared/lib/intl';
import type { MockDb } from './db';
import type { AppointmentRecord, InvoiceRecord, NotificationRecord } from './seed/patient-portal';

// The backend renders every notification from AR/EN templates in the recipient's language (R10,
// FR-NTF-02). These stand in for those templates.
type Template = { title: string; message: string };
const TEMPLATES: Record<Language, Record<NotificationType, Template>> = {
  en: {
    AppointmentConfirmed: { title: 'Appointment confirmed', message: 'Your visit with {{doctor}} on {{date}} at {{time}} is confirmed.' },
    AppointmentReminder: { title: 'Visit reminder', message: 'Reminder: your visit with {{doctor}} is on {{date}} at {{time}}.' },
    AppointmentRescheduled: { title: 'Visit rescheduled', message: 'Your visit with {{doctor}} moved to {{date}} at {{time}}.' },
    AppointmentCancelled: { title: 'Appointment cancelled', message: 'Your visit with {{doctor}} on {{date}} was cancelled.' },
    DepositReceived: { title: 'Deposit received', message: 'We received your {{amount}} deposit for your visit on {{date}}.' },
    InvoiceIssued: { title: 'New invoice', message: 'Invoice {{invoice}} is ready. Amount due: {{amount}}.' },
    PaymentReceived: { title: 'Payment received', message: 'Thank you. We received {{amount}} for invoice {{invoice}}.' },
    PrescriptionReady: { title: 'Visit summary ready', message: '{{doctor}} published your visit summary and prescription.' },
  },
  ar: {
    AppointmentConfirmed: { title: 'تم تأكيد الموعد', message: 'تم تأكيد زيارتك مع {{doctor}} يوم {{date}} الساعة {{time}}.' },
    AppointmentReminder: { title: 'تذكير بالزيارة', message: 'تذكير: زيارتك مع {{doctor}} يوم {{date}} الساعة {{time}}.' },
    AppointmentRescheduled: { title: 'تم تغيير موعد الزيارة', message: 'تم نقل زيارتك مع {{doctor}} إلى يوم {{date}} الساعة {{time}}.' },
    AppointmentCancelled: { title: 'تم إلغاء الموعد', message: 'تم إلغاء زيارتك مع {{doctor}} يوم {{date}}.' },
    DepositReceived: { title: 'تم استلام العربون', message: 'استلمنا عربونك بقيمة {{amount}} لزيارتك يوم {{date}}.' },
    InvoiceIssued: { title: 'فاتورة جديدة', message: 'الفاتورة {{invoice}} جاهزة. المبلغ المستحق: {{amount}}.' },
    PaymentReceived: { title: 'تم استلام الدفع', message: 'شكرًا لك. استلمنا {{amount}} للفاتورة {{invoice}}.' },
    PrescriptionReady: { title: 'ملخص الزيارة جاهز', message: 'نشر {{doctor}} ملخص زيارتك والروشتة.' },
  },
};

interface Context {
  appointment?: AppointmentRecord;
  invoice?: InvoiceRecord;
  amount?: number;
}

const fill = (text: string, values: Record<string, string>) => text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');

/** A notification as the backend would store it for `userId`, in their language. */
export function renderNotification(
  db: MockDb,
  userId: string,
  type: NotificationType,
  context: Context,
  createdAt: string
): NotificationRecord {
  const language = db.users.find((u) => u.id === userId)?.preferredLanguage ?? 'ar';
  const { appointment, invoice } = context;
  const values = {
    doctor: appointment?.doctorName ?? invoice?.doctorName ?? '',
    date: appointment ? formatDay(appointment.date, language, { weekday: 'long', day: 'numeric', month: 'long' }) : '',
    time: appointment ? formatWallClock(appointment.startTime, language) : '',
    invoice: invoice?.number ?? '',
    amount: formatMoney(context.amount ?? invoice?.balanceDue ?? 0, language),
  };
  const template = TEMPLATES[language][type];
  let link: NotificationLink | undefined;
  if (type === 'PrescriptionReady' && appointment?.visitId) link = { kind: 'visit', id: appointment.visitId };
  else if (invoice) link = { kind: 'invoice', id: invoice.id };
  else if (appointment) link = { kind: 'appointment', id: appointment.id };

  return {
    id: `ntf-${crypto.randomUUID()}`,
    userId,
    type,
    title: template.title,
    message: fill(template.message, values),
    createdAt,
    isRead: false,
    link,
  };
}

/**
 * Delivers a notification the way the outbox does: after `delayMs` (about 2 s in the app, at once in
 * tests), never inside the request (contract 4.0.0-p0 §1).
 */
export function notify(db: MockDb, delayMs: number, userId: string, type: NotificationType, context: Context, now: () => Date) {
  const deliver = () => db.notifications.push(renderNotification(db, userId, type, context, now().toISOString()));
  if (delayMs > 0) setTimeout(deliver, delayMs);
  else deliver();
}
