import type { PriceListItem, Service, Specialty } from '@/features/catalog/model/catalog';
import { BRANCH_IDS } from './branches';

export const SPECIALTY_IDS = {
  cardiology: 'sp-cardio',
  internal: 'sp-internal',
  pediatrics: 'sp-peds',
  dermatology: 'sp-derm',
  orthopedics: 'sp-ortho',
  dentistry: 'sp-dental',
  ent: 'sp-ent',
  gynecology: 'sp-obgyn',
  ophthalmology: 'sp-ophth',
} as const;

const S = SPECIALTY_IDS;

export const specialtiesSeed: Specialty[] = [
  { id: S.cardiology, nameEn: 'Cardiology', nameAr: 'أمراض القلب' },
  { id: S.internal, nameEn: 'Internal Medicine', nameAr: 'الباطنة' },
  { id: S.pediatrics, nameEn: 'Pediatrics', nameAr: 'طب الأطفال' },
  { id: S.dermatology, nameEn: 'Dermatology', nameAr: 'الأمراض الجلدية' },
  { id: S.orthopedics, nameEn: 'Orthopedics', nameAr: 'العظام' },
  { id: S.dentistry, nameEn: 'Dentistry', nameAr: 'طب الأسنان' },
  { id: S.ent, nameEn: 'ENT', nameAr: 'الأنف والأذن والحنجرة' },
  { id: S.gynecology, nameEn: 'Obstetrics & Gynecology', nameAr: 'النساء والتوليد' },
  { id: S.ophthalmology, nameEn: 'Ophthalmology', nameAr: 'طب العيون' },
];

const consult = (code: string, specialtyId: string, nameEn: string, nameAr: string, deposit = 100): Service => ({
  id: `svc-${code.toLowerCase()}`, code, category: 'Consultation', specialtyId, nameEn, nameAr,
  defaultDurationMinutes: 30, optionalDepositAmount: deposit,
});
const followUp = (code: string, specialtyId: string, nameEn: string, nameAr: string): Service => ({
  id: `svc-${code.toLowerCase()}`, code, category: 'FollowUp', specialtyId, nameEn, nameAr, defaultDurationMinutes: 15,
});
const procedure = (code: string, specialtyId: string, nameEn: string, nameAr: string, minutes: number): Service => ({
  id: `svc-${code.toLowerCase()}`, code, category: 'Procedure', specialtyId, nameEn, nameAr, defaultDurationMinutes: minutes,
});

export const servicesSeed: Service[] = [
  consult('CAR-C', S.cardiology, 'Cardiology consultation', 'كشف قلب'),
  followUp('CAR-F', S.cardiology, 'Cardiology follow-up', 'متابعة قلب'),
  procedure('CAR-ECG', S.cardiology, '12-lead ECG', 'رسم قلب', 15),
  procedure('CAR-ECHO', S.cardiology, 'Echocardiogram', 'إيكو على القلب', 45),
  consult('INT-C', S.internal, 'Internal medicine consultation', 'كشف باطنة'),
  followUp('INT-F', S.internal, 'Internal medicine follow-up', 'متابعة باطنة'),
  consult('PED-C', S.pediatrics, 'Pediatric consultation', 'كشف أطفال'),
  followUp('PED-F', S.pediatrics, 'Pediatric follow-up', 'متابعة أطفال'),
  procedure('PED-VAC', S.pediatrics, 'Vaccination visit', 'زيارة تطعيم', 15),
  consult('DER-C', S.dermatology, 'Dermatology consultation', 'كشف جلدية'),
  followUp('DER-F', S.dermatology, 'Dermatology follow-up', 'متابعة جلدية'),
  consult('ORT-C', S.orthopedics, 'Orthopedic consultation', 'كشف عظام'),
  followUp('ORT-F', S.orthopedics, 'Orthopedic follow-up', 'متابعة عظام'),
  consult('DEN-C', S.dentistry, 'Dental check-up', 'كشف أسنان', 0),
  procedure('DEN-CLN', S.dentistry, 'Scaling and polishing', 'تنظيف وتلميع الأسنان', 45),
  consult('ENT-C', S.ent, 'ENT consultation', 'كشف أنف وأذن وحنجرة'),
  followUp('ENT-F', S.ent, 'ENT follow-up', 'متابعة أنف وأذن وحنجرة'),
  consult('OBG-C', S.gynecology, 'Gynecology consultation', 'كشف نساء'),
  procedure('OBG-US', S.gynecology, 'Pregnancy ultrasound', 'سونار حمل', 30),
  consult('OPH-C', S.ophthalmology, 'Eye examination', 'كشف عيون'),
  followUp('OPH-F', S.ophthalmology, 'Ophthalmology follow-up', 'متابعة عيون'),
];

const FROM = '2026-01-01';
let nextId = 1;
const price = (serviceCode: string, amount: number, scope: { branchId?: string; doctorId?: string } = {}): PriceListItem => ({
  id: `pl-${nextId++}`,
  serviceId: `svc-${serviceCode.toLowerCase()}`,
  price: amount,
  validFrom: FROM,
  ...scope,
});

// Organization prices, a branch surcharge at Sheikh Zayed, and senior consultants' own prices
export const priceListSeed: PriceListItem[] = [
  price('CAR-C', 400), price('CAR-F', 200), price('CAR-ECG', 150), price('CAR-ECHO', 600),
  price('INT-C', 350), price('INT-F', 175),
  price('PED-C', 350), price('PED-F', 175), price('PED-VAC', 100),
  price('DER-C', 350), price('DER-F', 175),
  price('ORT-C', 400), price('ORT-F', 200),
  price('DEN-C', 250), price('DEN-CLN', 500),
  price('ENT-C', 350), price('ENT-F', 175),
  price('OBG-C', 400), price('OBG-US', 450),
  price('OPH-C', 350), price('OPH-F', 175),
  price('CAR-C', 450, { branchId: BRANCH_IDS.sheikhZayed }),
  price('DER-C', 400, { branchId: BRANCH_IDS.sheikhZayed }),
  price('ORT-C', 450, { branchId: BRANCH_IDS.sheikhZayed }),
  price('OBG-C', 450, { branchId: BRANCH_IDS.sheikhZayed }),
  price('CAR-C', 450, { doctorId: 'doc-ahmed' }),
  price('INT-C', 500, { doctorId: 'doc-hala' }),
  // An older price, kept as history (FR-SVC-02)
  { id: 'pl-old-1', serviceId: 'svc-car-c', price: 350, validFrom: '2025-01-01', validTo: '2025-12-31' },
];
