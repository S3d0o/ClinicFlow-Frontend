import type { WeeklyShift } from '@/features/doctors/model/doctor';
import { BRANCH_IDS } from './branches';
import { SPECIALTY_IDS } from './catalog';

/** A doctor profile (FR-STF-05) with the services offered and the weekly schedule. */
export interface DoctorSeed {
  id: string;
  userId: string;
  specialtyId: string;
  licenseNo: string;
  bioEn?: string;
  bioAr?: string;
  yearsOfExperience: number;
  languages: string[];
  /** Only public profiles appear in search (FR-STF-05). */
  isPublic: boolean;
  services: { serviceId: string; durationMinutes?: number }[];
  /** Slots are this many minutes long. */
  slotMinutes: number;
  schedule: WeeklyShift[];
}

const { nasrCity: NC, maadi: MA, sheikhZayed: SZ } = BRANCH_IDS;
const SAT = 6, SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4;

const shifts = (branchId: string, weekdays: number[], startTime: string, endTime: string): WeeklyShift[] =>
  weekdays.map((weekday) => ({ branchId, weekday, startTime, endTime }));

const offers = (...codes: string[]) => codes.map((code) => ({ serviceId: `svc-${code.toLowerCase()}` }));

export const doctorsSeed: DoctorSeed[] = [
  {
    id: 'doc-ahmed', userId: 'u-ahmed', specialtyId: SPECIALTY_IDS.cardiology, licenseNo: 'MOH-48192',
    yearsOfExperience: 18, languages: ['ar', 'en'], isPublic: true, slotMinutes: 30,
    bioEn: 'Consultant cardiologist focused on coronary artery disease, hypertension and preventive cardiology. He performs and reads echocardiograms in clinic and follows patients after cardiac procedures.',
    bioAr: 'استشاري أمراض القلب، يهتم بأمراض الشرايين التاجية وارتفاع ضغط الدم والوقاية من أمراض القلب. يُجري الإيكو ويقرؤه في العيادة ويتابع المرضى بعد إجراءات القلب.',
    services: offers('CAR-C', 'CAR-F', 'CAR-ECG', 'CAR-ECHO'),
    schedule: [...shifts(NC, [SUN, TUE, THU], '09:30', '14:00'), ...shifts(MA, [MON, WED], '16:00', '20:30')],
  },
  {
    id: 'doc-hala', userId: 'u-hala', specialtyId: SPECIALTY_IDS.internal, licenseNo: 'MOH-21034',
    yearsOfExperience: 22, languages: ['ar', 'en', 'fr'], isPublic: true, slotMinutes: 30,
    bioEn: 'Internal medicine consultant with a special interest in diabetes and thyroid disease. Medical director of the Nasr City branch.',
    bioAr: 'استشارية الباطنة، تهتم بشكل خاص بالسكري وأمراض الغدة الدرقية. المديرة الطبية لفرع مدينة نصر.',
    services: offers('INT-C', 'INT-F'),
    schedule: shifts(NC, [SAT, MON], '10:00', '13:00'),
  },
  {
    id: 'doc-tamer', userId: 'u-tamer', specialtyId: SPECIALTY_IDS.cardiology, licenseNo: 'MOH-55710',
    yearsOfExperience: 12, languages: ['ar', 'en'], isPublic: true, slotMinutes: 30,
    bioEn: 'Cardiologist treating heart rhythm problems, heart failure and high blood pressure.',
    services: offers('CAR-C', 'CAR-F', 'CAR-ECG'),
    schedule: [...shifts(MA, [SAT, TUE], '10:00', '15:00'), ...shifts(SZ, [SUN, WED], '17:00', '21:00')],
  },
  {
    id: 'doc-mona-k', userId: 'u-mona-k', specialtyId: SPECIALTY_IDS.dentistry, licenseNo: 'MOH-60233',
    yearsOfExperience: 10, languages: ['ar', 'en'], isPublic: true, slotMinutes: 45,
    bioAr: 'طبيبة أسنان عامة، تهتم بطب الأسنان الوقائي وعلاج اللثة وتنظيف الأسنان.',
    services: offers('DEN-C', 'DEN-CLN'),
    schedule: shifts(MA, [SAT, SUN, MON, WED], '12:00', '19:30'),
  },
  {
    id: 'doc-sherif', userId: 'u-sherif', specialtyId: SPECIALTY_IDS.orthopedics, licenseNo: 'MOH-39981',
    yearsOfExperience: 15, languages: ['ar', 'en'], isPublic: true, slotMinutes: 30,
    bioEn: 'Orthopedic surgeon for sports injuries, knee and shoulder problems, and back pain.',
    bioAr: 'جرّاح عظام متخصص في إصابات الملاعب ومشكلات الركبة والكتف وآلام الظهر.',
    services: offers('ORT-C', 'ORT-F'),
    schedule: [...shifts(SZ, [SAT, MON, WED], '13:00', '18:00'), ...shifts(NC, [THU], '10:00', '14:00')],
  },
  {
    id: 'doc-laila', userId: 'u-laila', specialtyId: SPECIALTY_IDS.pediatrics, licenseNo: 'MOH-47120',
    yearsOfExperience: 14, languages: ['ar', 'en'], isPublic: true, slotMinutes: 20,
    bioEn: 'Pediatrician caring for newborns to teenagers: growth checks, vaccinations and common childhood illnesses.',
    bioAr: 'طبيبة أطفال ترعى الأطفال من حديثي الولادة حتى سن المراهقة: متابعة النمو والتطعيمات وأمراض الطفولة الشائعة.',
    services: offers('PED-C', 'PED-F', 'PED-VAC'),
    schedule: shifts(NC, [SAT, SUN, TUE, THU], '09:00', '15:00'),
  },
  {
    id: 'doc-yasmine', userId: 'u-yasmine', specialtyId: SPECIALTY_IDS.dermatology, licenseNo: 'MOH-58834',
    yearsOfExperience: 9, languages: ['ar', 'en'], isPublic: true, slotMinutes: 20,
    bioEn: 'Dermatologist treating acne, eczema, psoriasis and hair loss.',
    services: offers('DER-C', 'DER-F'),
    schedule: [...shifts(NC, [MON, WED], '15:00', '20:00'), ...shifts(SZ, [SAT, TUE], '11:00', '16:00')],
  },
  {
    id: 'doc-khaled', userId: 'u-khaled', specialtyId: SPECIALTY_IDS.ent, licenseNo: 'MOH-33407',
    yearsOfExperience: 20, languages: ['ar'], isPublic: true, slotMinutes: 20,
    bioAr: 'استشاري الأنف والأذن والحنجرة، يعالج التهاب الجيوب الأنفية وضعف السمع واضطرابات الصوت.',
    services: offers('ENT-C', 'ENT-F'),
    schedule: shifts(MA, [SUN, TUE, THU], '17:00', '21:30'),
  },
  {
    id: 'doc-rania', userId: 'u-rania', specialtyId: SPECIALTY_IDS.gynecology, licenseNo: 'MOH-50196',
    yearsOfExperience: 16, languages: ['ar', 'en'], isPublic: true, slotMinutes: 30,
    bioEn: 'Obstetrician and gynecologist following pregnancies and treating common gynecological conditions.',
    bioAr: 'استشارية النساء والتوليد، تتابع الحمل وتعالج المشكلات النسائية الشائعة.',
    services: offers('OBG-C', 'OBG-US'),
    schedule: shifts(SZ, [SAT, MON, WED, THU], '10:00', '16:00'),
  },
  {
    id: 'doc-omar-h', userId: 'u-omar-h', specialtyId: SPECIALTY_IDS.ophthalmology, licenseNo: 'MOH-62058',
    yearsOfExperience: 7, languages: ['ar', 'en'], isPublic: true, slotMinutes: 20,
    bioEn: 'Ophthalmologist for eye examinations, glasses prescriptions, dry eye and glaucoma follow-up.',
    services: offers('OPH-C', 'OPH-F'),
    schedule: shifts(NC, [SUN, MON, TUE, WED], '16:00', '21:00'),
  },
];
