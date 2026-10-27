import { CHANGE_WINDOW_HOURS } from '@/features/appointments/model/policy';
import type { LeaveRequest } from '@/features/doctor/model/doctor-day';
import type { Addendum, Drug, EncounterDraft, EncounterStatus, EncounterTemplate, Icd10Code } from '@/features/encounters/model/encounter';
import { emptyDraft } from '@/features/encounters/model/encounter';
import { addDays, todayIn, wallClockToUtc } from '@/shared/lib/branch-time';
import { BRANCH_IDS } from './branches';
import { SPECIALTY_IDS } from './catalog';
import type { AppointmentRecord } from './patient-portal';

/** An encounter as the backend keeps it; the patient and visit parts are read from the appointment. */
export interface EncounterRecord extends EncounterDraft {
  id: string;
  appointmentId: string;
  status: EncounterStatus;
  rowVersion: number;
  savedAt?: string;
  signedAt?: string;
  signedBy?: string;
  addenda: Addendum[];
}

export type LeaveRecord = LeaveRequest & { doctorId: string; decidedBy?: string };

/** A subset of ICD-10-CM: the codes the seeded specialties use most (FR-EMR-04). */
export const icd10Seed: Icd10Code[] = [
  ['I10', 'Essential (primary) hypertension'], ['I20.9', 'Angina pectoris, unspecified'],
  ['I25.10', 'Atherosclerotic heart disease of native coronary artery without angina pectoris'],
  ['I48.91', 'Unspecified atrial fibrillation'], ['I50.9', 'Heart failure, unspecified'], ['R07.4', 'Chest pain, unspecified'],
  ['R07.89', 'Other chest pain'], ['R00.2', 'Palpitations'], ['R03.0', 'Elevated blood-pressure reading, without diagnosis of hypertension'],
  ['E11.9', 'Type 2 diabetes mellitus without complications'], ['E78.5', 'Hyperlipidemia, unspecified'], ['E03.9', 'Hypothyroidism, unspecified'],
  ['E66.9', 'Obesity, unspecified'], ['D64.9', 'Anemia, unspecified'], ['R53.83', 'Other fatigue'],
  ['J06.9', 'Acute upper respiratory infection, unspecified'], ['J02.9', 'Acute pharyngitis, unspecified'], ['J20.9', 'Acute bronchitis, unspecified'],
  ['J45.909', 'Unspecified asthma, uncomplicated'], ['R50.9', 'Fever, unspecified'], ['B34.9', 'Viral infection, unspecified'],
  ['A09', 'Infectious gastroenteritis and colitis, unspecified'], ['K21.9', 'Gastro-esophageal reflux disease without esophagitis'],
  ['K29.70', 'Gastritis, unspecified, without bleeding'], ['R10.9', 'Unspecified abdominal pain'], ['R10.13', 'Epigastric pain'],
  ['N39.0', 'Urinary tract infection, site not specified'], ['M54.50', 'Low back pain, unspecified'], ['M25.561', 'Pain in right knee'],
  ['L20.9', 'Atopic dermatitis, unspecified'], ['L70.0', 'Acne vulgaris'], ['H10.9', 'Unspecified conjunctivitis'], ['H52.4', 'Presbyopia'],
  ['K02.9', 'Dental caries, unspecified'], ['K05.10', 'Chronic gingivitis, plaque induced'], ['G43.909', 'Migraine, unspecified, not intractable'],
  ['F41.9', 'Anxiety disorder, unspecified'], ['Z00.129', 'Encounter for routine child health examination without abnormal findings'],
  ['Z23', 'Encounter for immunization'], ['Z09', 'Encounter for follow-up examination after completed treatment'],
  ['Z34.90', 'Encounter for supervision of normal pregnancy, unspecified trimester'], ['R62.51', 'Failure to thrive (child)'],
].map(([code, titleEn]) => ({ code, titleEn }));

const drug = (id: string, name: string, genericName: string, strength: string, form: string, classes: string[] = []): Drug => ({ id, name, genericName, strength, form, classes });

/** A small drug catalog. `classes` drive the allergy warning (FR-EMR-05). */
export const drugsSeed: Drug[] = [
  drug('drg-concor', 'Concor', 'Bisoprolol', '5 mg', 'Tablet', ['Beta blocker']),
  drug('drg-aspirin', 'Aspirin', 'Acetylsalicylic acid', '81 mg', 'Tablet', ['Aspirin', 'NSAID', 'Salicylate']),
  drug('drg-amlodipine', 'Norvasc', 'Amlodipine', '5 mg', 'Tablet', ['Calcium channel blocker']),
  drug('drg-diltiazem', 'Cardizem', 'Diltiazem', '60 mg', 'Tablet', ['Calcium channel blocker']),
  drug('drg-lisinopril', 'Zestril', 'Lisinopril', '10 mg', 'Tablet', ['ACE inhibitor']),
  drug('drg-losartan', 'Cozaar', 'Losartan', '50 mg', 'Tablet', ['ARB']),
  drug('drg-atorva', 'Lipitor', 'Atorvastatin', '20 mg', 'Tablet', ['Statin']),
  drug('drg-furosemide', 'Lasix', 'Furosemide', '40 mg', 'Tablet', ['Sulfonamide', 'Sulfa drugs']),
  drug('drg-metformin', 'Glucophage', 'Metformin', '500 mg', 'Tablet', ['Biguanide']),
  drug('drg-levo', 'Eltroxin', 'Levothyroxine', '50 mcg', 'Tablet'),
  drug('drg-amox', 'Amoxil', 'Amoxicillin', '500 mg', 'Capsule', ['Penicillin']),
  drug('drg-amox-syr', 'Amoxil syrup', 'Amoxicillin', '250 mg/5 ml', 'Syrup', ['Penicillin']),
  drug('drg-augmentin', 'Augmentin', 'Amoxicillin and clavulanic acid', '1 g', 'Tablet', ['Penicillin']),
  drug('drg-azithro', 'Zithromax', 'Azithromycin', '500 mg', 'Tablet', ['Macrolide']),
  drug('drg-cipro', 'Ciprobay', 'Ciprofloxacin', '500 mg', 'Tablet', ['Fluoroquinolone']),
  drug('drg-septrin', 'Septrin', 'Sulfamethoxazole and trimethoprim', '960 mg', 'Tablet', ['Sulfonamide', 'Sulfa drugs']),
  drug('drg-panadol', 'Panadol', 'Paracetamol', '500 mg', 'Tablet'),
  drug('drg-paracetamol-syr', 'Cetal syrup', 'Paracetamol', '120 mg/5 ml', 'Syrup'),
  drug('drg-brufen', 'Brufen', 'Ibuprofen', '400 mg', 'Tablet', ['NSAID']),
  drug('drg-cataflam', 'Cataflam', 'Diclofenac potassium', '50 mg', 'Tablet', ['NSAID']),
  drug('drg-omeprazole', 'Gastrazole', 'Omeprazole', '20 mg', 'Capsule', ['Proton pump inhibitor']),
  drug('drg-pantoprazole', 'Controloc', 'Pantoprazole', '40 mg', 'Tablet', ['Proton pump inhibitor']),
  drug('drg-cetirizine', 'Zyrtec', 'Cetirizine', '10 mg', 'Tablet', ['Antihistamine']),
  drug('drg-ventolin', 'Ventolin', 'Salbutamol', '100 mcg/dose', 'Inhaler', ['Beta agonist']),
];

const template = (id: string, specialtyId: string, nameEn: string, nameAr: string, notes: EncounterTemplate['notes']): EncounterTemplate => ({ id, specialtyId, nameEn, nameAr, notes });

/** Specialty templates (FR-EMR-03), written by the medical director. */
export const templatesSeed: EncounterTemplate[] = [
  template('tpl-chest-pain', SPECIALTY_IDS.cardiology, 'Chest pain / palpitations', 'ألم الصدر / الخفقان', {
    subjective: 'Onset, character, radiation, duration, triggers (exertion, rest), relieving factors. Associated dyspnea, sweating, syncope. Risk factors: smoking, diabetes, family history.',
    objective: 'BP both arms. Heart sounds, murmurs. Chest auscultation. Peripheral pulses. Edema. ECG findings.',
    plan: 'ECG reviewed. Consider troponin, lipid profile, echocardiogram or stress test as indicated.',
  }),
  template('tpl-htn', SPECIALTY_IDS.cardiology, 'Hypertension follow-up', 'متابعة ضغط الدم', {
    subjective: 'Home BP readings since last visit. Adherence to medicines and salt restriction. Headache, chest pain, dyspnea. Side effects.',
    objective: 'BP seated after 5 minutes rest. Heart rate. Weight. Signs of target-organ damage.',
    plan: 'Continue or adjust treatment to target below 130/80. Lifestyle advice. Review in 4 weeks with home readings.',
  }),
  template('tpl-well-child', SPECIALTY_IDS.pediatrics, 'Well-child visit', 'زيارة متابعة الطفل', {
    subjective: 'Feeding, sleep, development milestones, vaccinations due. Parent concerns.',
    objective: 'Weight, height and head circumference on the growth chart. General examination.',
    plan: 'Vaccines given per schedule. Feeding advice. Next visit at the next milestone.',
  }),
  template('tpl-diabetes', SPECIALTY_IDS.internal, 'Diabetes follow-up', 'متابعة السكري', {
    subjective: 'Home glucose readings, hypoglycemia episodes, adherence, diet and activity.',
    objective: 'Weight, BP, foot examination. Latest HbA1c and kidney function.',
    plan: 'Adjust treatment to HbA1c target. Annual eye and foot checks. Review in 3 months.',
  }),
];

const CAIRO = 'Africa/Cairo';

type EncounterPlan = Partial<EncounterDraft> & { appointmentId: string; status: EncounterStatus; signedAgoMinutes?: number; savedAgoMinutes?: number };

const dx = (code: string, isPrimary = true) => {
  const found = icd10Seed.find((c) => c.code === code)!;
  return { id: `dx-${code}`, code, title: found.titleEn, isPrimary, status: 'Confirmed' as const };
};

/**
 * Encounters for the visits the other seeds already hold (phases 2 and 3), one unsigned visit from
 * yesterday, and Dr. Ahmed's leave. Times are relative to `now`.
 */
export function clinicalSeed(now: Date) {
  const today = todayIn(CAIRO, now);
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  const daysAgo = (days: number, time: string) => wallClockToUtc(addDays(today, -days), time, CAIRO).toISOString();

  // Yesterday's visit Dr. Ahmed finished but hasn't signed (FR-EMR-09)
  const yesterday = addDays(today, -1);
  const yesterdayStart = wallClockToUtc(yesterday, '11:00', CAIRO);
  const appointments: AppointmentRecord[] = [
    {
      id: 'apt-y-hassan', patientId: 'pat-000110', reference: 'CF-26-08480', status: 'Completed', source: 'Phone',
      doctorId: 'doc-ahmed', doctorName: 'Dr. Ahmed Fathy', specialtyId: SPECIALTY_IDS.cardiology, branchId: BRANCH_IDS.nasrCity,
      serviceId: 'svc-car-f', date: yesterday, startTime: '11:00', endTime: '11:15', startsAtUtc: yesterdayStart.toISOString(),
      price: 200, depositPaid: false, bookedAt: daysAgo(6, '18:00'),
      changeableUntil: new Date(yesterdayStart.getTime() - CHANGE_WINDOW_HOURS * 3_600_000).toISOString(),
      attendanceConfirmed: true, hasReview: false, checkedInAt: daysAgo(1, '10:52'), calledAt: daysAgo(1, '11:04'), completedAt: daysAgo(1, '11:21'),
      queue: { ticketNo: 'A-07', stage: 'Done', position: 0, estimatedWaitMinutes: 0, roomName: 'Room 204', checkedInAt: daysAgo(1, '10:52'), triagedAt: daysAgo(1, '10:58'), updatedAt: daysAgo(1, '11:21') },
      triage: { form: { systolic: 136, diastolic: 86, pulse: 74, weightKg: 79, heightCm: 175, chiefComplaint: 'Follow-up of blood pressure', allergiesConfirmed: true }, recordedBy: 'u-sara', recordedAt: daysAgo(1, '10:58') },
    },
  ];

  const plans: EncounterPlan[] = [
    {
      appointmentId: 'apt-cardio-consult', status: 'Signed', signedAgoMinutes: 14 * 24 * 60 - 60,
      notes: {
        subjective: 'Two weeks of occasional headache in the morning. No chest pain or dyspnea. Smoker, 10 cigarettes a day.',
        objective: 'BP 142/90 seated, HR 76 regular. Heart sounds normal, no murmurs. Chest clear. No edema.',
        assessment: 'Stage 1 hypertension, newly diagnosed.',
        plan: 'Start bisoprolol 5 mg and low-dose aspirin. Lipid profile. Resting ECG done: normal sinus rhythm. Review in 2 weeks with home readings.',
      },
      diagnoses: [dx('I10')],
      prescriptions: [
        { id: 'rx-cardio-1', drugId: 'drg-concor', drugName: 'Concor', strength: '5 mg', form: 'Tablet', dose: '1 tablet', frequency: 'every morning', durationDays: 30, instructions: 'Take with water before breakfast.' },
        { id: 'rx-cardio-2', drugId: 'drg-aspirin', drugName: 'Aspirin', strength: '81 mg', form: 'Tablet', dose: '1 tablet', frequency: 'daily after lunch', durationDays: 30, instructions: 'Take after your main meal.' },
      ],
      orders: [
        { id: 'ord-cardio-1', type: 'Lab', description: 'Fasting lipid profile', status: 'Ordered' },
        { id: 'ord-cardio-2', type: 'Lab', description: 'Resting 12-lead ECG', status: 'ResultReceived' },
      ],
      patientInstructions: 'Cut down on added salt. Measure your blood pressure three mornings a week. Walk 20 minutes, four days a week.',
      followUpInDays: 14,
    },
    {
      appointmentId: 'apt-dental-cleaning', status: 'Signed', signedAgoMinutes: 45 * 24 * 60 - 60,
      notes: { subjective: 'Routine cleaning.', objective: 'Healthy gums, no caries. Moderate calculus.', assessment: 'Calculus, chronic gingivitis.', plan: 'Scaling and polishing done.' },
      diagnoses: [dx('K05.10')],
      patientInstructions: 'Brush twice a day and floss in the evening.',
      followUpInDays: 150,
    },
    {
      appointmentId: 'apt-d-a1', status: 'Signed', signedAgoMinutes: 118,
      notes: { subjective: 'Chest tightness on exertion for a week, relieved by rest.', objective: 'BP 150/95, HR 82. ECG: no acute changes.', assessment: 'Exertional chest pain, likely stable angina.', plan: 'Stress test and lipid profile. Start aspirin and a statin.' },
      diagnoses: [dx('I20.9'), dx('I10', false)],
      prescriptions: [{ id: 'rx-a1-1', drugId: 'drg-atorva', drugName: 'Lipitor', strength: '20 mg', form: 'Tablet', dose: '1 tablet', frequency: 'at night', durationDays: 30 }],
      orders: [{ id: 'ord-a1-1', type: 'Radiology', description: 'Exercise stress test', status: 'Ordered' }],
      patientInstructions: 'Avoid heavy exertion until the stress test. Go to the emergency department if chest pain lasts more than 15 minutes.',
      followUpInDays: 7,
    },
    {
      // Finished today, not signed yet
      appointmentId: 'apt-d-a2', status: 'Draft', savedAgoMinutes: 82,
      notes: { subjective: 'Blood pressure follow-up. Home readings 130s/80s.', objective: 'BP 138/88, HR 76.', assessment: '', plan: '' },
      diagnoses: [dx('I10')],
    },
    {
      // In the room now
      appointmentId: 'apt-d-a3', status: 'Draft', savedAgoMinutes: 6,
      notes: { subjective: 'Palpitations at night for three weeks, no syncope.', objective: '', assessment: '', plan: '' },
    },
    {
      appointmentId: 'apt-d-l1', status: 'Signed', signedAgoMinutes: 123,
      notes: { subjective: 'Routine vaccination visit.', objective: 'Well child, growth on the 50th centile.', assessment: 'Routine immunization.', plan: 'Vaccine given per schedule.' },
      diagnoses: [dx('Z23')],
      patientInstructions: 'Paracetamol syrup for fever over 38 °C. Next vaccines in 6 months.',
    },
    {
      appointmentId: 'apt-d-h1', status: 'Signed', signedAgoMinutes: 88,
      notes: { subjective: 'Diabetes follow-up, home glucose 140–180.', objective: 'BP 132/84, weight stable. Feet normal.', assessment: 'Type 2 diabetes, suboptimal control.', plan: 'Increase metformin. HbA1c in 3 months.' },
      diagnoses: [dx('E11.9')],
      prescriptions: [{ id: 'rx-h1-1', drugId: 'drg-metformin', drugName: 'Glucophage', strength: '500 mg', form: 'Tablet', dose: '2 tablets', frequency: 'twice a day with meals', durationDays: 90 }],
      orders: [{ id: 'ord-h1-1', type: 'Lab', description: 'HbA1c', status: 'Ordered' }],
      followUpInDays: 90,
    },
    {
      appointmentId: 'apt-y-hassan', status: 'Draft', savedAgoMinutes: 23 * 60,
      notes: { subjective: 'Blood pressure follow-up. Feels well.', objective: 'BP 136/86, HR 74.', assessment: 'Hypertension, controlled.', plan: 'Continue treatment.' },
      diagnoses: [dx('I10')],
    },
  ];

  const encounters: EncounterRecord[] = plans.map(({ signedAgoMinutes, savedAgoMinutes, ...plan }) => ({
    ...emptyDraft(),
    ...plan,
    id: `enc-${plan.appointmentId.replace(/^apt-/, '')}`,
    rowVersion: 1,
    savedAt: ago(savedAgoMinutes ?? signedAgoMinutes ?? 0),
    signedAt: plan.status === 'Signed' ? ago(signedAgoMinutes ?? 0) : undefined,
    addenda: [],
  }));

  const leaveRequests: LeaveRecord[] = [
    {
      id: 'lv-ahmed-1', reference: 'LV-26-0061', doctorId: 'doc-ahmed', fromDate: addDays(today, -70), toDate: addDays(today, -66),
      reason: 'Annual vacation', status: 'Approved', affectedAppointments: 0, requestedAt: daysAgo(100, '09:00'),
      decidedAt: daysAgo(98, '12:30'), decidedBy: 'u-hala', decidedByName: 'Dr. Hala Mostafa',
    },
    {
      id: 'lv-ahmed-2', reference: 'LV-26-0084', doctorId: 'doc-ahmed', fromDate: addDays(today, 12), toDate: addDays(today, 14),
      reason: 'Egyptian Society of Cardiology annual meeting', status: 'Requested', affectedAppointments: 0, requestedAt: daysAgo(2, '15:10'),
    },
  ];

  return { appointments, encounters, leaveRequests };
}
