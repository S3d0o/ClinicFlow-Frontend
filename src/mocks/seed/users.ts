import type { Role, RoleAssignment } from '@/features/auth/model/user';
import type { Language } from '@/shared/i18n/languages';
import { BRANCH_IDS } from './branches';

/** The password of every demo account, and the code every demo SMS or authenticator "sends". */
export const DEMO_PASSWORD = 'Demo@1234';
export const DEMO_CODE = '123456';

export interface UserSeed {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredLanguage: Language;
  roles: RoleAssignment[];
  hasDoctorApplication: boolean;
  /** Label key under `common:roles` shown on the demo sign-in screen. */
  demoLabel: Role | 'Applicant';
}

const org = (role: RoleAssignment['role']): RoleAssignment => ({ role, scope: 'Organization' });
const at = (role: RoleAssignment['role'], ...branchIds: string[]): RoleAssignment => ({
  role,
  scope: 'Branch',
  branchIds,
});

// One account per role, plus a branch manager, a doctor applicant and a patient (the personas in
// backend docs/v2/02_ROLES_AND_PERMISSIONS.md §2.1).
export const usersSeed: UserSeed[] = [
  {
    id: 'u-hala', fullName: 'Dr. Hala Mostafa', phone: '+201000000002', email: 'hala.mostafa@clinicflow.eg',
    preferredLanguage: 'ar', roles: [org('Manager'), at('Doctor', BRANCH_IDS.nasrCity)],
    hasDoctorApplication: false, demoLabel: 'Manager',
  },
  {
    id: 'u-omar', fullName: 'Omar Saeed', phone: '+201000000003', email: 'omar.saeed@clinicflow.eg',
    preferredLanguage: 'ar', roles: [at('Manager', BRANCH_IDS.maadi)], hasDoctorApplication: false,
    demoLabel: 'Manager',
  },
  {
    id: 'u-mona', fullName: 'Mona Samir', phone: '+201000000004', email: 'mona.samir@clinicflow.eg',
    preferredLanguage: 'ar', roles: [at('Receptionist', BRANCH_IDS.nasrCity)], hasDoctorApplication: false,
    demoLabel: 'Receptionist',
  },
  {
    id: 'u-sara', fullName: 'Sara Ibrahim', phone: '+201000000005', email: 'sara.ibrahim@clinicflow.eg',
    preferredLanguage: 'ar', roles: [at('Nurse', BRANCH_IDS.nasrCity)], hasDoctorApplication: false,
    demoLabel: 'Nurse',
  },
  {
    id: 'u-ahmed', fullName: 'Dr. Ahmed Fathy', phone: '+201000000006', email: 'ahmed.fathy@clinicflow.eg',
    preferredLanguage: 'en', roles: [at('Doctor', BRANCH_IDS.nasrCity, BRANCH_IDS.maadi)],
    hasDoctorApplication: false, demoLabel: 'Doctor',
  },
  {
    id: 'u-youssef', fullName: 'Youssef Kamal', phone: '+201000000007', email: 'youssef.kamal@clinicflow.eg',
    preferredLanguage: 'ar', roles: [org('Accountant')], hasDoctorApplication: false, demoLabel: 'Accountant',
  },
  {
    id: 'u-karim', fullName: 'Karim Adel', phone: '+201000000001', email: 'karim.adel@clinicflow.eg',
    preferredLanguage: 'en', roles: [org('Admin')], hasDoctorApplication: false, demoLabel: 'Admin',
  },
  {
    id: 'u-mohamed', fullName: 'Mohamed Adel', phone: '+201012345678', preferredLanguage: 'ar',
    roles: [org('Patient')], hasDoctorApplication: false, demoLabel: 'Patient',
  },
  {
    id: 'u-nour', fullName: 'Dr. Nour El-Din Samy', phone: '+201100000009', email: 'nour.samy@gmail.com',
    preferredLanguage: 'ar', roles: [], hasDoctorApplication: true, demoLabel: 'Applicant',
  },
];
