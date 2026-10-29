import { CHANGE_WINDOW_HOURS } from '@/features/appointments/model/policy';
import type { DeskPaymentMethod } from '@/features/billing/model/checkout';
import type { CashSessionStatus } from '@/features/billing/model/cash-session';
import type { RoomKind } from '@/features/org/model/branch-admin';
import type { Room } from '@/features/queue/model/queue';
import type { TriageForm } from '@/features/triage/model/vitals';
import type { Bilingual } from '@/shared/i18n/bilingual';
import { todayIn, wallClockIn, wallClockToUtc } from '@/shared/lib/branch-time';
import { BRANCH_IDS } from './branches';
import { servicesSeed, SPECIALTY_IDS } from './catalog';
import type { AppointmentRecord, InvoiceRecord, PatientRecordSeed } from './patient-portal';

/** A room (FR-ORG-04). */
export interface RoomSeed extends Room {
  branchId: string;
  kind: RoomKind;
  isActive: boolean;
}

/** The room a doctor's schedule reserves at a branch (FR-ORG-04). */
export interface DoctorRoomSeed {
  doctorId: string;
  branchId: string;
  roomId: string;
}

export interface DrawerSeed extends Bilingual {
  id: string;
  branchId: string;
}

/** A payment or refund (05 §3.5 `Payment`, `Refund`). Refunds are stored with a negative amount. */
export interface PaymentRecord {
  id: string;
  receiptNo: string;
  kind: 'Payment' | 'Refund';
  branchId: string;
  patientId: string;
  appointmentId?: string;
  invoiceId?: string;
  serviceId?: string;
  method: DeskPaymentMethod;
  amount: number;
  reference?: string;
  cashSessionId?: string;
  receivedBy: string;
  receivedAt: string;
}

export interface CashSessionRecord {
  id: string;
  branchId: string;
  drawerId: string;
  openedBy: string;
  openedAt: string;
  openingFloat: number;
  status: CashSessionStatus;
  closedAt?: string;
  countedAmount?: number;
  expectedAmount?: number;
  variance?: number;
  note?: string;
}

const { nasrCity: NC, maadi: MA, sheikhZayed: SZ } = BRANCH_IDS;
const room = (id: string, branchId: string, number: string, kind: RoomSeed['kind'] = 'Consultation'): RoomSeed => ({
  id,
  branchId,
  kind,
  isActive: true,
  nameEn: kind === 'Triage' ? `Triage ${number}` : `Room ${number}`,
  nameAr: kind === 'Triage' ? `غرفة الفرز ${number}` : `غرفة ${number}`,
});

export const roomsSeed: RoomSeed[] = [
  room('room-nc-201', NC, '201'), room('room-nc-202', NC, '202'), room('room-nc-203', NC, '203'),
  room('room-nc-204', NC, '204'), room('room-nc-205', NC, '205'), room('room-nc-206', NC, '206'),
  room('room-nc-t1', NC, '1', 'Triage'),
  room('room-ma-101', MA, '101'), room('room-ma-102', MA, '102'), room('room-ma-103', MA, '103'),
  room('room-sz-301', SZ, '301'), room('room-sz-302', SZ, '302'), room('room-sz-303', SZ, '303'),
];

export const doctorRoomsSeed: DoctorRoomSeed[] = [
  { doctorId: 'doc-ahmed', branchId: NC, roomId: 'room-nc-204' },
  { doctorId: 'doc-laila', branchId: NC, roomId: 'room-nc-201' },
  { doctorId: 'doc-hala', branchId: NC, roomId: 'room-nc-203' },
  { doctorId: 'doc-sherif', branchId: NC, roomId: 'room-nc-202' },
  { doctorId: 'doc-omar-h', branchId: NC, roomId: 'room-nc-205' },
  { doctorId: 'doc-yasmine', branchId: NC, roomId: 'room-nc-206' },
  { doctorId: 'doc-ahmed', branchId: MA, roomId: 'room-ma-101' },
  { doctorId: 'doc-khaled', branchId: MA, roomId: 'room-ma-101' },
  { doctorId: 'doc-tamer', branchId: MA, roomId: 'room-ma-102' },
  { doctorId: 'doc-mona-k', branchId: MA, roomId: 'room-ma-103' },
  { doctorId: 'doc-tamer', branchId: SZ, roomId: 'room-sz-301' },
  { doctorId: 'doc-rania', branchId: SZ, roomId: 'room-sz-301' },
  { doctorId: 'doc-sherif', branchId: SZ, roomId: 'room-sz-302' },
  { doctorId: 'doc-yasmine', branchId: SZ, roomId: 'room-sz-303' },
];

export const drawersSeed: DrawerSeed[] = [
  { id: 'drw-nc-1', branchId: NC, nameEn: 'Desk 1', nameAr: 'مكتب 1' },
  { id: 'drw-nc-2', branchId: NC, nameEn: 'Desk 2', nameAr: 'مكتب 2' },
  { id: 'drw-ma-1', branchId: MA, nameEn: 'Desk 1', nameAr: 'مكتب 1' },
  { id: 'drw-sz-1', branchId: SZ, nameEn: 'Desk 1', nameAr: 'مكتب 1' },
];

type Person = Pick<PatientRecordSeed, 'id' | 'fullName' | 'phone' | 'gender' | 'dateOfBirth'> & Partial<PatientRecordSeed>;
const person = (p: Person): PatientRecordSeed => ({
  mrn: `MRN-${p.id.slice(4)}`,
  memberSince: '2025-03-01',
  allergies: [],
  conditions: [],
  notificationChannel: 'Phone',
  ...p,
});

/** Patients registered at the desk, without portal accounts. Two Arabic names show the search folding. */
export const deskPatientsSeed: PatientRecordSeed[] = [
  person({ id: 'pat-000398', fullName: 'Mona Adel', phone: '+201012345678', gender: 'Female', dateOfBirth: '1992-11-22', memberSince: '2024-11-03' }),
  person({ id: 'pat-000101', fullName: 'Hazem Mostafa', phone: '+201001112233', gender: 'Male', dateOfBirth: '1979-03-02', nationalId: '27903020101122', conditions: ['Hypertension'] }),
  person({ id: 'pat-000102', fullName: 'Nadia Soliman', phone: '+201112223344', gender: 'Female', dateOfBirth: '1985-07-19' }),
  person({ id: 'pat-000103', fullName: 'Sameh Mahmoud', phone: '+201223334455', gender: 'Male', dateOfBirth: '1990-01-30', memberSince: '2026-10-01' }),
  person({ id: 'pat-000104', fullName: 'Youssef Omar', phone: '+201098887766', gender: 'Male', dateOfBirth: '2021-09-10', emergencyContactName: 'Omar Farouk', emergencyContactPhone: '+201098887766' }),
  person({ id: 'pat-000105', fullName: 'Farida Karim', phone: '+201156667788', gender: 'Female', dateOfBirth: '2026-02-15', emergencyContactName: 'Dina Nabil', emergencyContactPhone: '+201156667788' }),
  person({ id: 'pat-000106', fullName: 'Tamer Zaki', phone: '+201287776655', gender: 'Male', dateOfBirth: '2020-04-05', allergies: [{ name: 'Amoxicillin', severity: 'Moderate' }] }),
  person({ id: 'pat-000107', fullName: 'Alyaa Mansour', phone: '+201066554433', gender: 'Female', dateOfBirth: '1975-12-01', conditions: ['Type 2 diabetes'] }),
  person({ id: 'pat-000108', fullName: 'Mariam Nader', phone: '+201544332211', gender: 'Female', dateOfBirth: '1984-06-23' }),
  person({ id: 'pat-000109', fullName: 'Kamal Fouad', phone: '+201033221100', gender: 'Male', dateOfBirth: '1961-08-17', conditions: ['Type 2 diabetes', 'Hypertension'] }),
  person({ id: 'pat-000110', fullName: 'Hassan Ali', phone: '+201277889900', gender: 'Male', dateOfBirth: '1995-02-11' }),
  person({ id: 'pat-000111', fullName: 'أحمد إبراهيم', phone: '+201122334455', gender: 'Male', dateOfBirth: '1987-10-03', nationalId: '28710030104455' }),
  person({ id: 'pat-000112', fullName: 'Salma Nabil', phone: '+201011223344', gender: 'Female', dateOfBirth: '1998-03-27' }),
  person({ id: 'pat-000113', fullName: 'Omar Khaled', phone: '+201099001122', gender: 'Male', dateOfBirth: '1997-05-05' }),
  person({ id: 'pat-000114', fullName: 'Zeinab Mahmoud', phone: '+201555667788', gender: 'Female', dateOfBirth: '2019-11-30' }),
  person({ id: 'pat-000115', fullName: 'فاطمة حسن', phone: '+201200112233', gender: 'Female', dateOfBirth: '1970-01-09', allergies: [{ name: 'Sulfa drugs', severity: 'Severe' }] }),
  person({ id: 'pat-000116', fullName: 'Karim Sabry', phone: '+201144556677', gender: 'Male', dateOfBirth: '1982-09-14' }),
  person({ id: 'pat-000117', fullName: 'Rana Fathy', phone: '+201566778899', gender: 'Female', dateOfBirth: '2001-12-12' }),
  person({ id: 'pat-000118', fullName: 'Layla Hany', phone: '+201277665544', gender: 'Female', dateOfBirth: '2023-01-20' }),
  person({ id: 'pat-000119', fullName: 'Adam Sherif', phone: '+201033445566', gender: 'Male', dateOfBirth: '2022-07-07' }),
];

const CAIRO = 'Africa/Cairo';
const pad = (n: number) => String(n).padStart(2, '0');
const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const serviceNameAr = (serviceId: string) => servicesSeed.find((s) => s.id === serviceId)?.nameAr ?? serviceId;

interface DeskDoctor {
  id: string;
  name: string;
  specialtyId: string;
  letter: string;
  roomName: string;
}

const AHMED: DeskDoctor = { id: 'doc-ahmed', name: 'Dr. Ahmed Fathy', specialtyId: SPECIALTY_IDS.cardiology, letter: 'A', roomName: 'Room 204' };
const LAILA: DeskDoctor = { id: 'doc-laila', name: 'Dr. Laila Hassan', specialtyId: SPECIALTY_IDS.pediatrics, letter: 'L', roomName: 'Room 201' };
const HALA: DeskDoctor = { id: 'doc-hala', name: 'Dr. Hala Mostafa', specialtyId: SPECIALTY_IDS.internal, letter: 'H', roomName: 'Room 203' };

/** One seeded visit today. Times are minutes relative to now; tickets are given explicitly. */
interface VisitPlan {
  id: string;
  doctor: DeskDoctor;
  patientId: string;
  serviceId: string;
  price: number;
  deposit?: number;
  /** Booked start, minutes from now; walk-ins start when they check in. */
  at: number;
  minutes: number;
  status: AppointmentRecord['status'];
  source?: AppointmentRecord['source'];
  confirmed?: boolean;
  depositPaid?: boolean;
  checkedInAgo?: number;
  ticket?: number;
  stage?: 'WaitingTriage' | 'ReadyForDoctor' | 'WithDoctor' | 'Done';
  position?: number;
  triagedAgo?: number;
  vitals?: TriageForm;
  calledAgo?: number;
  completedAgo?: number;
  complaint?: string;
  paid?: { method: DeskPaymentMethod; receiptNo: string; invoiceNo: number };
  extra?: { serviceId: string; price: number };
}

const vitals = (systolic: number, diastolic: number, pulse: number, complaint: string): TriageForm => ({
  systolic, diastolic, pulse, temperature: 36.8, spo2: 98, respiratoryRate: 16, chiefComplaint: complaint, allergiesConfirmed: true,
});

const PLANS: VisitPlan[] = [
  // Dr. Ahmed Fathy: two done (one still to pay), one in the room, two ready ahead of Mohamed (apt-today), two to come, one late
  { id: 'apt-d-a1', doctor: AHMED, patientId: 'pat-000101', serviceId: 'svc-car-c', price: 450, deposit: 100, at: -150, minutes: 30, status: 'Completed', confirmed: true, checkedInAgo: 160, ticket: 1, stage: 'Done', triagedAgo: 155, vitals: vitals(150, 95, 82, 'Chest tightness on exertion'), calledAgo: 148, completedAgo: 120, paid: { method: 'Cash', receiptNo: 'RC-10011', invoiceNo: 413 }, extra: { serviceId: 'svc-car-ecg', price: 150 } },
  { id: 'apt-d-a2', doctor: AHMED, patientId: 'pat-000109', serviceId: 'svc-car-f', price: 200, at: -105, minutes: 15, status: 'Completed', checkedInAgo: 110, ticket: 4, stage: 'Done', triagedAgo: 104, vitals: vitals(138, 88, 76, 'Follow-up, blood pressure'), calledAgo: 95, completedAgo: 80 },
  { id: 'apt-d-a3', doctor: AHMED, patientId: 'pat-000102', serviceId: 'svc-car-f', price: 200, at: -60, minutes: 15, status: 'InProgress', confirmed: true, checkedInAgo: 70, ticket: 5, stage: 'WithDoctor', triagedAgo: 62, vitals: vitals(128, 82, 70, 'Palpitations at night'), calledAgo: 12 },
  { id: 'apt-d-a4', doctor: AHMED, patientId: 'pat-000103', serviceId: 'svc-car-c', price: 450, at: -30, minutes: 30, status: 'CheckedIn', source: 'Phone', checkedInAgo: 35, ticket: 8, stage: 'ReadyForDoctor', position: 1, triagedAgo: 25, vitals: vitals(125, 80, 72, 'New patient, shortness of breath') },
  { id: 'apt-d-a5', doctor: AHMED, patientId: 'pat-000113', serviceId: 'svc-car-ecg', price: 150, at: -15, minutes: 15, status: 'CheckedIn', confirmed: true, checkedInAgo: 20, ticket: 9, stage: 'ReadyForDoctor', position: 2, triagedAgo: 14, vitals: vitals(130, 85, 78, 'ECG before a dental procedure') },
  { id: 'apt-d-a6', doctor: AHMED, patientId: 'pat-000110', serviceId: 'svc-car-f', price: 200, at: 40, minutes: 15, status: 'Confirmed', confirmed: true },
  { id: 'apt-d-a7', doctor: AHMED, patientId: 'pat-000112', serviceId: 'svc-car-c', price: 450, deposit: 100, depositPaid: true, at: 70, minutes: 30, status: 'Confirmed' },
  { id: 'apt-d-a8', doctor: AHMED, patientId: 'pat-000116', serviceId: 'svc-car-f', price: 200, at: -25, minutes: 15, status: 'Confirmed', source: 'Phone' },

  // Dr. Laila Hassan: one done and paid, one in the room, two waiting for triage (one a walk-in), one to come, one no-show
  { id: 'apt-d-l1', doctor: LAILA, patientId: 'pat-000114', serviceId: 'svc-ped-vac', price: 100, at: -140, minutes: 20, status: 'Completed', confirmed: true, checkedInAgo: 150, ticket: 2, stage: 'Done', triagedAgo: 146, vitals: { temperature: 36.6, pulse: 96, weightKg: 22, heightCm: 118, allergiesConfirmed: true, chiefComplaint: 'Routine vaccination' }, calledAgo: 138, completedAgo: 125, paid: { method: 'Card', receiptNo: 'RC-10012', invoiceNo: 414 } },
  { id: 'apt-d-l2', doctor: LAILA, patientId: 'pat-000104', serviceId: 'svc-ped-vac', price: 100, at: -45, minutes: 20, status: 'InProgress', confirmed: true, checkedInAgo: 50, ticket: 6, stage: 'WithDoctor', triagedAgo: 44, vitals: { temperature: 36.9, pulse: 104, weightKg: 18, heightCm: 108, allergiesConfirmed: true, chiefComplaint: 'MMR booster' }, calledAgo: 8 },
  { id: 'apt-d-l3', doctor: LAILA, patientId: 'pat-000105', serviceId: 'svc-ped-c', price: 350, deposit: 100, at: -20, minutes: 20, status: 'CheckedIn', confirmed: true, checkedInAgo: 12, ticket: 13, stage: 'WaitingTriage', position: 1, complaint: 'Growth check and mild fever' },
  { id: 'apt-d-l4', doctor: LAILA, patientId: 'pat-000106', serviceId: 'svc-ped-c', price: 350, at: -5, minutes: 20, status: 'CheckedIn', source: 'WalkIn', checkedInAgo: 5, ticket: 16, stage: 'WaitingTriage', position: 3, complaint: 'Fever since yesterday' },
  { id: 'apt-d-l5', doctor: LAILA, patientId: 'pat-000118', serviceId: 'svc-ped-f', price: 175, at: 20, minutes: 20, status: 'Confirmed', confirmed: true },
  { id: 'apt-d-l6', doctor: LAILA, patientId: 'pat-000119', serviceId: 'svc-ped-f', price: 175, at: -80, minutes: 20, status: 'NoShow' },

  // Dr. Hala Mostafa: one done still to pay, one ready, one walk-in waiting for triage, two to come, one cancelled
  { id: 'apt-d-h1', doctor: HALA, patientId: 'pat-000107', serviceId: 'svc-int-f', price: 175, at: -120, minutes: 30, status: 'Completed', confirmed: true, checkedInAgo: 125, ticket: 3, stage: 'Done', triagedAgo: 118, vitals: vitals(132, 84, 80, 'Diabetes follow-up'), calledAgo: 110, completedAgo: 90 },
  { id: 'apt-d-h2', doctor: HALA, patientId: 'pat-000108', serviceId: 'svc-int-c', price: 500, deposit: 100, at: -40, minutes: 30, status: 'CheckedIn', source: 'Phone', checkedInAgo: 45, ticket: 7, stage: 'ReadyForDoctor', position: 1, triagedAgo: 30, vitals: vitals(118, 76, 88, 'Fatigue for two weeks') },
  { id: 'apt-d-h3', doctor: HALA, patientId: 'pat-000111', serviceId: 'svc-int-c', price: 500, deposit: 100, at: -7, minutes: 30, status: 'CheckedIn', source: 'WalkIn', checkedInAgo: 7, ticket: 15, stage: 'WaitingTriage', position: 2, complaint: 'Abdominal pain' },
  { id: 'apt-d-h4', doctor: HALA, patientId: 'pat-000115', serviceId: 'svc-int-f', price: 175, at: 30, minutes: 30, status: 'Confirmed', confirmed: true },
  { id: 'apt-d-h5', doctor: HALA, patientId: 'pat-000117', serviceId: 'svc-int-c', price: 500, deposit: 100, at: 60, minutes: 30, status: 'Confirmed' },
  { id: 'apt-d-h6', doctor: HALA, patientId: 'pat-000398', serviceId: 'svc-int-f', price: 175, at: -45, minutes: 30, status: 'Cancelled' },
];

/** Mona Samir (receptionist at Nasr City) opened Desk 1 this morning. */
export const SEEDED_SESSION_ID = 'cs-nc-mona';

/**
 * A working day at the Nasr City front desk, around `now`: today's visits for three doctors, the
 * payments already taken and the receptionist's open cash session. Visits that would fall outside
 * today (the demo opened very early or late) are left out.
 */
export function frontDeskSeed(now: Date) {
  const today = todayIn(CAIRO, now);
  const [h, m] = wallClockIn(CAIRO, now).split(':').map(Number);
  const nowMinutes = h * 60 + m;
  const roundedNow = nowMinutes - (nowMinutes % 5);
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  const year = today.slice(0, 4);

  const appointments: AppointmentRecord[] = [];
  const invoices: InvoiceRecord[] = [];
  const payments: PaymentRecord[] = [];

  for (const [index, plan] of PLANS.entries()) {
    const start = roundedNow + plan.at;
    if (start < 0 || start + plan.minutes > 24 * 60 - 1) continue;
    const startTime = toTime(start);
    const startsAt = wallClockToUtc(today, startTime, CAIRO);
    const record: AppointmentRecord = {
      id: plan.id,
      patientId: plan.patientId,
      reference: `CF-${year.slice(2)}-${String(8500 + index).padStart(5, '0')}`,
      status: plan.status,
      source: plan.source ?? 'Online',
      doctorId: plan.doctor.id,
      doctorName: plan.doctor.name,
      specialtyId: plan.doctor.specialtyId,
      branchId: NC,
      serviceId: plan.serviceId,
      date: today,
      startTime,
      endTime: toTime(start + plan.minutes),
      startsAtUtc: startsAt.toISOString(),
      price: plan.price,
      depositAmount: plan.deposit,
      depositPaid: !!plan.depositPaid,
      bookedAt: ago(60 * 24 * 3 + index * 37),
      changeableUntil: new Date(startsAt.getTime() - CHANGE_WINDOW_HOURS * 3_600_000).toISOString(),
      attendanceConfirmed: !!plan.confirmed,
      hasReview: false,
      complaint: plan.complaint,
    };
    if (plan.source === 'WalkIn') {
      record.slotId = `walk-in|${plan.id}`;
      record.bookedAt = ago(plan.checkedInAgo ?? 0);
    }
    if (plan.status === 'Cancelled') Object.assign(record, { cancelledAt: ago(240), cancelledBy: 'Patient', cancellationReason: 'ScheduleConflict' });
    if (plan.status === 'NoShow') record.noShowAt = ago(55);
    if (plan.checkedInAgo !== undefined && plan.stage) {
      record.checkedInAt = ago(plan.checkedInAgo);
      record.queue = {
        ticketNo: `${plan.doctor.letter}-${pad(plan.ticket ?? 0)}`,
        stage: plan.stage,
        position: plan.position ?? 0,
        estimatedWaitMinutes: plan.position ? (plan.position - 1) * 7 + 5 : 0,
        roomName: plan.stage === 'WithDoctor' || plan.stage === 'Done' ? plan.doctor.roomName : undefined,
        checkedInAt: record.checkedInAt,
        triagedAt: plan.triagedAgo !== undefined ? ago(plan.triagedAgo) : undefined,
        updatedAt: now.toISOString(),
      };
    }
    if (plan.vitals && plan.triagedAgo !== undefined) record.triage = { form: plan.vitals, recordedBy: 'u-sara', recordedAt: ago(plan.triagedAgo) };
    if (plan.calledAgo !== undefined) record.calledAt = ago(plan.calledAgo);
    if (plan.completedAgo !== undefined) record.completedAt = ago(plan.completedAgo);
    if (plan.extra) record.extraLines = [{ id: `line-${plan.id}`, serviceId: plan.extra.serviceId, quantity: 1, unitPrice: plan.extra.price }];

    if (plan.paid) {
      const total = plan.price + (plan.extra?.price ?? 0);
      const deposit = plan.depositPaid && plan.deposit ? plan.deposit : 0;
      const amount = total - deposit;
      const paidAt = ago((plan.completedAgo ?? 0) - 3);
      const invoiceId = `inv-nc-${plan.paid.invoiceNo}`;
      invoices.push({
        id: invoiceId,
        number: `NC-${year}-${String(plan.paid.invoiceNo).padStart(6, '0')}`,
        patientId: plan.patientId,
        appointmentId: plan.id,
        branchId: NC,
        doctorName: plan.doctor.name,
        issuedAt: paidAt,
        status: 'Paid',
        // Desk patients without an account read Arabic (the default language)
        lines: [
          { description: serviceNameAr(plan.serviceId), amount: plan.price },
          ...(plan.extra ? [{ description: serviceNameAr(plan.extra.serviceId), amount: plan.extra.price }] : []),
        ],
        total,
        deductions: deposit ? [{ kind: 'Deposit', amount: deposit }] : [],
        payments: [{ method: plan.paid.method, amount, paidAt }],
        balanceDue: 0,
      });
      payments.push({
        id: `pay-${plan.id}`,
        receiptNo: plan.paid.receiptNo,
        kind: 'Payment',
        branchId: NC,
        patientId: plan.patientId,
        appointmentId: plan.id,
        invoiceId,
        serviceId: plan.serviceId,
        method: plan.paid.method,
        amount,
        cashSessionId: SEEDED_SESSION_ID,
        receivedBy: 'u-mona',
        receivedAt: paidAt,
      });
    }
    appointments.push(record);
  }

  // A cash refund for a visit cancelled in the clinic yesterday, paid out from this drawer
  payments.push({
    id: 'pay-refund-1', receiptNo: 'RF-0120', kind: 'Refund', branchId: NC, patientId: 'pat-000398',
    method: 'Cash', amount: -150, cashSessionId: SEEDED_SESSION_ID, receivedBy: 'u-mona', receivedAt: ago(Math.min(90, nowMinutes)),
  });

  const openedAt = ago(Math.min(180, nowMinutes));
  const cashSessions: CashSessionRecord[] = [
    { id: SEEDED_SESSION_ID, branchId: NC, drawerId: 'drw-nc-1', openedBy: 'u-mona', openedAt, openingFloat: 500, status: 'Open' },
  ];

  return { appointments, invoices, payments, cashSessions };
}
