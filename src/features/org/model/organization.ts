import { z } from 'zod';

// The organization profile and its settings (FR-ORG-01, FR-ORG-05; design admin/06).

/** Shown on invoices, receipts and prescriptions (FR-ORG-01). */
export interface OrganizationProfile {
  legalName: string;
  brandNameEn: string;
  brandNameAr: string;
  taxNumber: string;
  commercialRegistration: string;
  phone: string;
  email: string;
}

/**
 * The clinic's rules, each with a default (FR-ORG-05). Money is EGP. A section of the settings
 * screen saves its own keys.
 */
export interface OrganizationSettings {
  /** Patients can cancel or reschedule until this many hours before the visit. */
  cancellationWindowHours: number;
  rescheduleWindowHours: number;
  /** Minutes after the start before the desk can mark a no-show. */
  noShowGraceMinutes: number;
  /** Unslotted walk-ins per doctor per day. */
  walkInCap: number;
  noShowFee: number;
  depositEnabled: boolean;
  depositAmount: number;
  /** Discounts above these percentages need a manager's approval. */
  receptionistDiscountCapPercent: number;
  accountantDiscountCapPercent: number;
  /** Refunds above this amount need a manager's approval. */
  refundApprovalThreshold: number;
  /** A cash drawer counted this far from expected is flagged. */
  cashVarianceThreshold: number;
  /** Doctors see the notes of other doctors' visits at their branch (`clinical.shareWithinBranch`). */
  shareRecordsWithinBranch: boolean;
  /** Months a rejected or withdrawn applicant's files are kept. */
  applicationFileRetentionMonths: number;
  /** Days before a rejected applicant can apply again. */
  reapplyCooldownDays: number;
}

export const DEFAULT_SETTINGS: OrganizationSettings = {
  cancellationWindowHours: 2,
  rescheduleWindowHours: 2,
  noShowGraceMinutes: 15,
  walkInCap: 5,
  noShowFee: 0,
  depositEnabled: false,
  depositAmount: 100,
  receptionistDiscountCapPercent: 10,
  accountantDiscountCapPercent: 20,
  refundApprovalThreshold: 1000,
  cashVarianceThreshold: 50,
  shareRecordsWithinBranch: true,
  applicationFileRetentionMonths: 6,
  reapplyCooldownDays: 90,
};

/** The settings screen's sections and the keys each one saves. */
export const SETTINGS_SECTIONS = {
  appointments: ['cancellationWindowHours', 'rescheduleWindowHours', 'noShowGraceMinutes', 'walkInCap'],
  payments: ['noShowFee', 'depositEnabled', 'depositAmount'],
  approvals: ['receptionistDiscountCapPercent', 'accountantDiscountCapPercent', 'refundApprovalThreshold', 'cashVarianceThreshold'],
  records: ['shareRecordsWithinBranch'],
  recruitment: ['applicationFileRetentionMonths', 'reapplyCooldownDays'],
} as const satisfies Record<string, readonly (keyof OrganizationSettings)[]>;

export type SettingsSection = keyof typeof SETTINGS_SECTIONS;

/** The bounds a number setting may take (the backend validates the same). */
export const SETTING_BOUNDS: Partial<Record<keyof OrganizationSettings, { min: number; max: number }>> = {
  cancellationWindowHours: { min: 0, max: 72 },
  rescheduleWindowHours: { min: 0, max: 72 },
  noShowGraceMinutes: { min: 5, max: 120 },
  walkInCap: { min: 0, max: 50 },
  noShowFee: { min: 0, max: 10000 },
  depositAmount: { min: 0, max: 10000 },
  receptionistDiscountCapPercent: { min: 0, max: 100 },
  accountantDiscountCapPercent: { min: 0, max: 100 },
  refundApprovalThreshold: { min: 0, max: 1000000 },
  cashVarianceThreshold: { min: 0, max: 100000 },
  applicationFileRetentionMonths: { min: 1, max: 60 },
  reapplyCooldownDays: { min: 0, max: 365 },
};

const required = z.string().trim().min(1, 'validation.required');

export const profileSchema = z.object({
  legalName: required.max(150, 'validation.maxLength'),
  brandNameEn: required.max(80, 'validation.maxLength'),
  brandNameAr: required.max(80, 'validation.maxLength'),
  taxNumber: required.max(30, 'validation.maxLength'),
  commercialRegistration: required.max(30, 'validation.maxLength'),
  phone: required.max(20, 'validation.maxLength'),
  email: required.email('validation.email'),
});

/** The settings that are numbers (they have a unit and bounds). */
export type NumberSettingKey = {
  [K in keyof OrganizationSettings]: OrganizationSettings[K] extends number ? K : never;
}[keyof OrganizationSettings];
