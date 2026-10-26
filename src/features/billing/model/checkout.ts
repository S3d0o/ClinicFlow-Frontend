import type { DeskAppointment } from '@/features/desk/model/desk';
import type { PaymentMethod } from './invoice';

/** The methods the desk takes (FR-BIL-05): the drawer, the POS terminal, a mobile wallet. */
export type DeskPaymentMethod = Extract<PaymentMethod, 'Cash' | 'Card' | 'Wallet'>;
export const DESK_METHODS: DeskPaymentMethod[] = ['Cash', 'Card', 'Wallet'];

/** One billed service. The booked service comes from the appointment; others are added at the desk (FR-BIL-02). */
export interface ChargeLine {
  id: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** The booked service: it can't be removed. */
  booked: boolean;
}

/** A visit at the checkout (FR-BIL-01/05/14): services, the paid deposit and what's left. */
export interface Checkout {
  appointment: DeskAppointment;
  lines: ChargeLine[];
  subtotal: number;
  /** A deposit paid online, deducted automatically (FR-BIL-14). */
  depositPaid: number;
  /** Paid at the desk already (partial payments). */
  paidSoFar: number;
  due: number;
  /** Set once the first payment issues the invoice; lines can't change after that (`Invoice.NotDraft`). */
  invoice?: { id: string; number: string; status: 'Issued' | 'PartiallyPaid' | 'Paid' };
  /** Services the desk can add: the ones the doctor offers. */
  addableServiceIds: string[];
  /** Insurance shares arrive in phase 5 (FR-BIL-04); the desk sees the card for now. */
  insurance?: { payerName: string; coveragePercent?: number };
}

export interface CollectRequest {
  method: DeskPaymentMethod;
  /** Applied to the visit; at most what's due. */
  amount: number;
  /** Cash handed over, for the change. */
  tendered?: number;
  /** POS or wallet transaction reference. */
  reference?: string;
}

export interface Receipt {
  paymentId: string;
  /** e.g. "RC-10021" */
  receiptNo: string;
  invoiceNumber: string;
  method: DeskPaymentMethod;
  amount: number;
  change: number;
  paidAt: string;
  /** Still due on the visit after this payment. */
  remaining: number;
}

/** A visit waiting to pay, for the checkout list. */
export type CheckoutSummary = DeskAppointment;

/** Change to hand back; never negative. Works in piasters so 0.1 + 0.2 doesn't show up (R8). */
export const changeDue = (tendered: number, due: number) => Math.max(0, Math.round(tendered * 100) - Math.round(due * 100)) / 100;

/** Quick-fill amounts for cash: the exact sum, then the next round banknote totals above it. */
export function quickAmounts(due: number): number[] {
  if (due <= 0) return [];
  const rounded = [50, 100, 200, 500].map((step) => Math.floor(due / step) * step + step);
  return [due, ...new Set(rounded)].slice(0, 3);
}
