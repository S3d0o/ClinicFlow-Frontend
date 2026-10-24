import type { DoctorApplication } from '@/features/recruitment/model/application';
import { addDays, todayIn, wallClockToUtc } from '@/shared/lib/branch-time';
import { BRANCH_IDS } from './branches';
import { SPECIALTY_IDS } from './catalog';

export interface ApplicationRecord extends DoctorApplication {
  userId: string;
}

const CAIRO = 'Africa/Cairo';

/** Dr. Nour's application, invited to an interview ten days from now. */
export function applicationsSeed(now: Date): ApplicationRecord[] {
  const today = todayIn(CAIRO, now);
  const daysAgo = (days: number, time: string) => wallClockToUtc(addDays(today, -days), time, CAIRO).toISOString();
  const interview = {
    at: wallClockToUtc(addDays(today, 10), '11:00', CAIRO).toISOString(),
    branchId: BRANCH_IDS.nasrCity,
    interviewerName: 'Dr. Hala Mostafa',
    notes: 'Please bring your original Medical Syndicate card and national ID.',
  };

  return [
    {
      id: 'app-nour',
      userId: 'u-nour',
      reference: 'APP-2026-0842',
      status: 'Interview',
      applicantName: 'Dr. Nour El-Din Samy',
      phone: '+201100000009',
      email: 'nour.samy@gmail.com',
      specialtyId: SPECIALTY_IDS.internal,
      licenseNo: 'MOH-71554',
      yearsOfExperience: 12,
      preferredBranchId: BRANCH_IDS.nasrCity,
      submittedAt: daysAgo(9, '16:45'),
      cv: { id: 'file-nour-cv', fileName: 'Nour_Samy_CV.pdf', sizeBytes: 2_400_000, contentType: 'application/pdf' },
      coverLetterText: 'Twelve years in internal medicine and endocrinology at university hospitals. I would like to run outpatient diabetes clinics in Cairo East.',
      interview,
      history: [
        { id: 'sc-2', fromStatus: 'Applied', toStatus: 'Interview', changedAt: daysAgo(7, '14:15'), interview, emailSent: true },
        { id: 'sc-1', fromStatus: null, toStatus: 'Applied', changedAt: daysAgo(9, '16:45'), emailSent: true },
      ],
    },
  ];
}
