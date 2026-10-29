import type { DayHours, Holiday } from '@/features/org/model/branch-admin';
import { DEFAULT_SETTINGS, type OrganizationProfile, type OrganizationSettings } from '@/features/org/model/organization';
import { todayIn } from '@/shared/lib/branch-time';
import { BRANCH_IDS, branchesSeed } from './branches';

/** Opening hours per branch. Saturday to Thursday in two shifts; Friday afternoon only. */
export interface BranchHoursRecord {
  branchId: string;
  days: DayHours[];
}

const WEEK: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  ranges:
    weekday === 5
      ? [{ from: '13:00', to: '21:00' }]
      : [
          { from: '09:00', to: '15:00' },
          { from: '15:00', to: '22:00' },
        ],
}));

export const branchHoursSeed: BranchHoursRecord[] = branchesSeed.map((b) => ({ branchId: b.id, days: structuredClone(WEEK) }));

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** National holidays every year, and a maintenance day at Nasr City ten days from now. */
export function holidaysSeed(now: Date): Holiday[] {
  const today = todayIn('Africa/Cairo', now);
  const year = today.slice(0, 4);
  return [
    { id: 'hol-jan25', branchId: null, nameEn: 'Revolution Day', nameAr: 'عيد الثورة', from: `${year}-01-25`, to: `${year}-01-25`, recursYearly: true },
    { id: 'hol-oct6', branchId: null, nameEn: 'Armed Forces Day', nameAr: 'عيد القوات المسلحة', from: `${year}-10-06`, to: `${year}-10-06`, recursYearly: true },
    {
      id: 'hol-nc-maintenance',
      branchId: BRANCH_IDS.nasrCity,
      nameEn: 'Maintenance closure',
      nameAr: 'إغلاق للصيانة',
      from: addDays(today, 10),
      to: addDays(today, 10),
      recursYearly: false,
    },
  ];
}

export const organizationSeed: OrganizationProfile = {
  legalName: 'ClinicFlow Medical Centers (sample)',
  brandNameEn: 'ClinicFlow',
  brandNameAr: 'كلينك فلو',
  taxNumber: '000-000-000',
  commercialRegistration: 'CR-000000',
  phone: '+20224018890',
  email: 'info@clinicflow.eg',
};

export const settingsSeed: OrganizationSettings = { ...DEFAULT_SETTINGS };
