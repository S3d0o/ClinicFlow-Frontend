import type { Bilingual } from '@/shared/i18n/bilingual';
import type { DeskPaymentMethod } from './checkout';

/** A cash drawer at a branch (05 §3.5). */
export interface CashDrawer extends Bilingual {
  id: string;
  branchId: string;
  /** Who has a session open on it, if anyone. */
  inUseBy?: string;
}

export type CashSessionStatus = 'Open' | 'Closed' | 'Approved';

/** A payment or refund taken while the session was open. Refunds have a negative amount. */
export interface CashTransaction {
  id: string;
  receiptNo: string;
  at: string;
  kind: 'Payment' | 'Refund';
  patientName: string;
  /** The visit's service, when the payment was for a visit. */
  serviceId?: string;
  method: DeskPaymentMethod;
  amount: number;
}

/** A receptionist's shift on a drawer (FR-BIL-09): open with a float, close with a count. */
export interface CashSession {
  id: string;
  branchId: string;
  drawer: CashDrawer;
  openedAt: string;
  openedByName: string;
  openingFloat: number;
  status: CashSessionStatus;
  /** Cash taken in and paid out. */
  cashIn: number;
  cashOut: number;
  /** Float + cash in − cash out: what the drawer should hold. */
  expectedCash: number;
  /** Takings by method, cash included. */
  byMethod: { method: DeskPaymentMethod; amount: number; count: number }[];
  transactions: CashTransaction[];
  closedAt?: string;
  countedAmount?: number;
  variance?: number;
  /** The variance is above the threshold, so a manager approves the close (phase 5 approvals). */
  needsApproval?: boolean;
  note?: string;
}

/** A variance above this needs a manager's approval (FR-BIL-09; an organization setting later). */
export const VARIANCE_APPROVAL_THRESHOLD = 50;

/** Egyptian banknotes, for counting the drawer. */
export const DENOMINATIONS = [200, 100, 50, 20, 10, 5, 1] as const;

export type DenominationCounts = Partial<Record<(typeof DENOMINATIONS)[number], number>>;

/** The total of a banknote count. */
export const countTotal = (counts: DenominationCounts) =>
  DENOMINATIONS.reduce((sum, note) => sum + note * (counts[note] ?? 0), 0);

/** Counted minus expected, in piasters to stay exact (R8). Negative is a shortage. */
export const varianceOf = (counted: number, expected: number) => (Math.round(counted * 100) - Math.round(expected * 100)) / 100;

export const needsVarianceApproval = (variance: number) => Math.abs(variance) > VARIANCE_APPROVAL_THRESHOLD;
