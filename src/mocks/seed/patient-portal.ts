import type { Appointment } from '@/features/appointments/model/appointment';
import type { PatientInvoice } from '@/features/billing/model/invoice';
import type { InsurancePolicy, Payer, PatientDocument } from '@/features/documents/model/documents';
import type { AppNotification } from '@/features/notifications/model/notification';
import type { Allergy, NotificationChannel } from '@/features/profile/model/profile';
import type { VisitSummary } from '@/features/visits/model/visit';
import { CHANGE_WINDOW_HOURS } from '@/features/appointments/model/policy';
import { addDays, todayIn, wallClockIn, wallClockToUtc } from '@/shared/lib/branch-time';
import { BRANCH_IDS } from './branches';
import { SPECIALTY_IDS } from './catalog';

// Owner columns the API keeps but never returns to the patient.
export type AppointmentRecord = Appointment & { patientUserId: string; slotId?: string };
export type VisitRecord = VisitSummary & { patientUserId: string };
export type InvoiceRecord = PatientInvoice & { patientUserId: string };
export type DocumentRecord = PatientDocument & { patientUserId: string };
export type PolicyRecord = InsurancePolicy & { patientUserId: string };
export type NotificationRecord = AppNotification & { userId: string };

/** The organization-specific part of a patient (`PatientRecord`, 05 §3.3) plus their channel choice. */
export interface PatientRecordSeed {
  userId: string;
  mrn: string;
  memberSince: string;
  bloodType?: string;
  allergies: Allergy[];
  conditions: string[];
  notificationChannel: NotificationChannel;
}

export const PATIENT_ID = 'u-mohamed';
export const DEMO_REMINDER_TOKEN = 'demo-reminder';
const CAIRO = 'Africa/Cairo';

export const payersSeed: Payer[] = [
  { id: 'payer-nile', name: 'Nile Health Insurance' },
  { id: 'payer-delta', name: 'Delta Care (TPA)' },
  { id: 'payer-cmn', name: 'Cairo Medical Network' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const plusMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

/** The patient portal's sample data for Mohamed Adel, dated around `now`. */
export function patientPortalSeed(now: Date) {
  const today = todayIn(CAIRO, now);
  const iso = (ms: number) => new Date(ms).toISOString();
  const ago = (days: number, time = '12:00') => wallClockToUtc(addDays(today, -days), time, CAIRO).toISOString();

  /** A visit time `days` from today at `time` (branch wall clock), with the derived fields. */
  const slotAt = (days: number, time: string, minutes = 30) => {
    const date = addDays(today, days);
    const startsAt = wallClockToUtc(date, time, CAIRO);
    return {
      date,
      startTime: time,
      endTime: plusMinutes(time, minutes),
      startsAtUtc: startsAt.toISOString(),
      changeableUntil: iso(startsAt.getTime() - CHANGE_WINDOW_HOURS * 3_600_000),
    };
  };

  // Today's visit starts at the next half hour after now + 20 minutes (latest 21:30)
  const [h, m] = wallClockIn(CAIRO, now).split(':').map(Number);
  const nextHalfHour = Math.ceil((h * 60 + m + 20) / 30) * 30;
  const todayTime = nextHalfHour > 21 * 60 + 30 ? '21:30' : `${pad(Math.floor(nextHalfHour / 60))}:${pad(nextHalfHour % 60)}`;

  const base = { patientUserId: PATIENT_ID, source: 'Online' as const, attendanceConfirmed: false, hasReview: false, depositPaid: false };

  const appointments: AppointmentRecord[] = [
    {
      ...base,
      id: 'apt-today', reference: 'CF-26-08731', status: 'CheckedIn',
      doctorId: 'doc-ahmed', doctorName: 'Dr. Ahmed Fathy', specialtyId: SPECIALTY_IDS.cardiology,
      branchId: BRANCH_IDS.nasrCity, serviceId: 'svc-car-f', ...slotAt(0, todayTime, 15), price: 200,
      bookedAt: ago(13, '19:20'), attendanceConfirmed: true, checkedInAt: iso(now.getTime() - 10 * 60_000),
      queue: {
        ticketNo: 'A-14', stage: 'ReadyForDoctor', position: 3, estimatedWaitMinutes: 20, roomName: 'Room 204',
        doctorDelayMinutes: 15, checkedInAt: iso(now.getTime() - 10 * 60_000), triagedAt: iso(now.getTime() - 4 * 60_000),
        updatedAt: now.toISOString(),
      },
    },
    {
      ...base,
      id: 'apt-eyes', reference: 'CF-26-09154', status: 'Confirmed',
      doctorId: 'doc-omar-h', doctorName: 'Dr. Omar Hegazy', specialtyId: SPECIALTY_IDS.ophthalmology,
      branchId: BRANCH_IDS.nasrCity, serviceId: 'svc-oph-c', ...slotAt(5, '18:00', 20), price: 350, depositAmount: 100,
      bookedAt: ago(2, '09:45'),
    },
    {
      ...base,
      id: 'apt-dental-checkup', reference: 'CF-26-09202', status: 'Confirmed',
      doctorId: 'doc-mona-k', doctorName: 'Dr. Mona Khalil', specialtyId: SPECIALTY_IDS.dentistry,
      branchId: BRANCH_IDS.maadi, serviceId: 'svc-den-c', ...slotAt(9, '16:00', 45), price: 250,
      bookedAt: ago(1, '21:10'),
    },
    {
      ...base,
      id: 'apt-cardio-consult', reference: 'CF-26-07720', status: 'Completed',
      doctorId: 'doc-ahmed', doctorName: 'Dr. Ahmed Fathy', specialtyId: SPECIALTY_IDS.cardiology,
      branchId: BRANCH_IDS.nasrCity, serviceId: 'svc-car-c', ...slotAt(-14, '10:30'), price: 450, depositAmount: 100,
      depositPaid: true, bookedAt: ago(18, '13:05'), attendanceConfirmed: true, checkedInAt: ago(14, '10:14'),
      completedAt: ago(14, '11:05'), visitId: 'visit-cardio',
    },
    {
      ...base,
      id: 'apt-dental-cleaning', reference: 'CF-26-05518', status: 'Completed',
      doctorId: 'doc-mona-k', doctorName: 'Dr. Mona Khalil', specialtyId: SPECIALTY_IDS.dentistry,
      branchId: BRANCH_IDS.maadi, serviceId: 'svc-den-cln', ...slotAt(-45, '16:00', 45), price: 500,
      bookedAt: ago(50, '18:30'), checkedInAt: ago(45, '15:52'), completedAt: ago(45, '16:50'), visitId: 'visit-dental', hasReview: true,
    },
    {
      ...base,
      id: 'apt-derm', reference: 'CF-26-06931', status: 'Cancelled',
      doctorId: 'doc-yasmine', doctorName: 'Dr. Yasmine Fawzy', specialtyId: SPECIALTY_IDS.dermatology,
      branchId: BRANCH_IDS.sheikhZayed, serviceId: 'svc-der-c', ...slotAt(-20, '12:00', 20), price: 400, depositAmount: 100,
      bookedAt: ago(26, '10:00'), cancelledAt: ago(22, '08:15'), cancelledBy: 'Patient', cancellationReason: 'ScheduleConflict',
    },
  ];

  const visits: VisitRecord[] = [
    {
      patientUserId: PATIENT_ID, id: 'visit-cardio', appointmentId: 'apt-cardio-consult', appointmentReference: 'CF-26-07720',
      startsAtUtc: appointments[3].startsAtUtc, doctorId: 'doc-ahmed', doctorName: 'Dr. Ahmed Fathy',
      specialtyId: SPECIALTY_IDS.cardiology, branchId: BRANCH_IDS.nasrCity,
      diagnoses: ['Mild high blood pressure (hypertension, stage 1)'],
      findings: 'Your resting blood pressure was slightly high (142/90). Heart rhythm and heart sounds were normal. We are starting a gentle daily medicine and will check your levels again in two weeks.',
      prescriptions: [
        { drug: 'Concor', strength: '5 mg', genericName: 'Bisoprolol', dosage: '1 tablet every morning', durationDays: 30, instructions: 'Take with water before breakfast.' },
        { drug: 'Aspirin', strength: '81 mg', dosage: '1 tablet daily after lunch', durationDays: 30, instructions: 'Take after your main meal.' },
      ],
      prescriptionCode: 'RX-NC-48213',
      orders: [
        { name: 'Fasting lipid profile', detail: 'Cholesterol and triglycerides, within 7 days', status: 'Pending' },
        { name: 'Resting 12-lead ECG', detail: 'Done at the clinic during the visit', status: 'ResultReceived', resultNote: 'Normal sinus rhythm.' },
      ],
      instructions: [
        'Cut down on added salt and processed snacks.',
        'Measure your blood pressure in the morning three times a week and write it down.',
        'Walk briskly for 20 minutes, four days a week.',
      ],
      followUp: { from: addDays(today, -1), to: addDays(today, 3), serviceId: 'svc-car-f' },
    },
    {
      patientUserId: PATIENT_ID, id: 'visit-dental', appointmentId: 'apt-dental-cleaning', appointmentReference: 'CF-26-05518',
      startsAtUtc: appointments[4].startsAtUtc, doctorId: 'doc-mona-k', doctorName: 'Dr. Mona Khalil',
      specialtyId: SPECIALTY_IDS.dentistry, branchId: BRANCH_IDS.maadi,
      diagnoses: ['تنظيف الأسنان الدوري وإزالة الجير'],
      findings: 'اللثة سليمة ولا توجد تسوسات. تم تنظيف الأسنان وإزالة الجير.',
      prescriptions: [],
      orders: [],
      instructions: ['نظّف أسنانك مرتين يوميًا واستخدم خيط الأسنان مساءً.'],
      followUp: { from: addDays(today, 135), to: addDays(today, 165), serviceId: 'svc-den-c' },
    },
  ];

  const invoices: InvoiceRecord[] = [
    {
      patientUserId: PATIENT_ID, id: 'inv-nc-412', number: 'NC-2026-000412', branchId: BRANCH_IDS.nasrCity,
      doctorName: 'Dr. Ahmed Fathy', issuedAt: ago(14, '11:10'), status: 'PartiallyPaid',
      lines: [
        { description: 'Cardiology consultation', amount: 450 },
        { description: '12-lead ECG', amount: 150 },
      ],
      total: 600,
      deductions: [
        { kind: 'Deposit', amount: 100 },
        { kind: 'Insurance', label: 'Nile Health Insurance', amount: 150 },
      ],
      payments: [],
      balanceDue: 350,
    },
    {
      patientUserId: PATIENT_ID, id: 'inv-ma-914', number: 'MA-2026-000914', branchId: BRANCH_IDS.maadi,
      doctorName: 'Dr. Mona Khalil', issuedAt: ago(45, '16:55'), status: 'Paid',
      lines: [{ description: 'Scaling and polishing', amount: 500 }],
      total: 500,
      deductions: [],
      payments: [{ method: 'Card', amount: 500, paidAt: ago(45, '16:58') }],
      balanceDue: 0,
    },
  ];

  const documents: DocumentRecord[] = [
    {
      patientUserId: PATIENT_ID, id: 'doc-cbc', fileName: 'CBC results.pdf', contentType: 'application/pdf',
      sizeBytes: 2_516_582, uploadedAt: ago(10, '20:40'), sharedWithDoctorName: 'Dr. Ahmed Fathy',
    },
    {
      patientUserId: PATIENT_ID, id: 'doc-xray', fileName: 'Chest X-ray report.jpg', contentType: 'image/jpeg',
      sizeBytes: 8_493_465, uploadedAt: ago(120, '18:05'),
    },
  ];

  const policies: PolicyRecord[] = [
    {
      patientUserId: PATIENT_ID, id: 'pol-nile', payerName: 'Nile Health Insurance', planName: 'Gold outpatient',
      memberNo: 'NHI-994022-01', holderName: 'Mohamed Adel', coveragePercent: 50,
      validTo: `${Number(today.slice(0, 4)) + 1}-12-31`, isDefault: true, status: 'Verified',
    },
  ];

  const patients: PatientRecordSeed[] = [
    {
      userId: PATIENT_ID, mrn: 'MRN-000412', memberSince: '2024-11-03', bloodType: 'O+',
      allergies: [{ name: 'Penicillin', severity: 'Severe' }, { name: 'Dust mites' }],
      conditions: ['Mild hypertension'], notificationChannel: 'Sms',
    },
  ];

  return {
    appointments,
    visits,
    invoices,
    documents,
    policies,
    patients,
    reminderTokens: [{ token: DEMO_REMINDER_TOKEN, appointmentId: 'apt-eyes' }],
    /** Notifications are rendered by `mocks/notifications.ts` in the patient's language. */
    notificationEvents: [
      { type: 'AppointmentReminder' as const, appointmentId: 'apt-today', at: ago(1, '10:00'), read: false },
      { type: 'AppointmentConfirmed' as const, appointmentId: 'apt-eyes', at: ago(2, '09:45'), read: false },
      { type: 'PrescriptionReady' as const, appointmentId: 'apt-cardio-consult', at: ago(14, '11:06'), read: true },
      { type: 'InvoiceIssued' as const, appointmentId: 'apt-cardio-consult', at: ago(14, '11:10'), read: true },
      { type: 'AppointmentCancelled' as const, appointmentId: 'apt-derm', at: ago(22, '08:15'), read: true },
      { type: 'PaymentReceived' as const, appointmentId: 'apt-dental-cleaning', at: ago(45, '16:58'), read: true },
    ],
  };
}
