import type { Branch } from '../model/branch';
import type { BranchRoom, DayHours, Holiday } from '../model/branch-admin';
import type { OrganizationProfile, OrganizationSettings } from '../model/organization';

export type BranchInput = Omit<Branch, 'id' | 'isActive'>;
export type HolidayInput = Omit<Holiday, 'id'>;
export type RoomInput = Omit<BranchRoom, 'id' | 'branchId' | 'isActive'>;

/** Managing branches, their hours, holidays and rooms (port; 07 §4 `/api/v2/branches`, `branches.manage`). */
export interface BranchAdminService {
  /** Every branch, deactivated ones included. */
  list(): Promise<Branch[]>;
  /** The code is unique (`Branch.CodeTaken`) and goes into invoice numbers. */
  create(input: BranchInput): Promise<Branch>;
  update(branchId: string, input: BranchInput): Promise<Branch>;
  /** A deactivated branch takes no new bookings; its records stay readable (FR-ORG-02). */
  setActive(branchId: string, active: boolean): Promise<Branch>;
  getHours(branchId: string): Promise<DayHours[]>;
  setHours(branchId: string, hours: DayHours[]): Promise<DayHours[]>;
  /** The branch's holidays and the ones that close every branch. */
  listHolidays(branchId: string): Promise<Holiday[]>;
  /** Also returns how many booked visits fall on it and need moving (the J5 worklist). */
  addHoliday(input: HolidayInput): Promise<{ holiday: Holiday; affectedAppointments: number }>;
  removeHoliday(holidayId: string): Promise<void>;
  listRooms(branchId: string): Promise<BranchRoom[]>;
  addRoom(branchId: string, input: RoomInput): Promise<BranchRoom>;
  updateRoom(roomId: string, input: RoomInput & { isActive: boolean }): Promise<BranchRoom>;
}

/** The organization profile and settings (port; `/api/v2/organization`, `/organization/settings`). */
export interface OrganizationService {
  getProfile(): Promise<OrganizationProfile>;
  updateProfile(profile: OrganizationProfile): Promise<OrganizationProfile>;
  /** Any staff member may read them. */
  getSettings(): Promise<OrganizationSettings>;
  /** Saves the given keys only (`org.settings.manage`); every change is audited. */
  updateSettings(changes: Partial<OrganizationSettings>): Promise<OrganizationSettings>;
}
