// A patient's own invoices and receipts (FR-PAT-04, FR-BIL-05/07/12/14).

export type InvoiceStatus = 'Issued' | 'PartiallyPaid' | 'Paid' | 'Void';

export type PaymentMethod = 'Cash' | 'Card' | 'Online' | 'Wallet' | 'BankTransfer';

export interface InvoiceLine {
  description: string;
  amount: number;
}

/** Amounts taken off what the patient owes: a paid deposit, the insurer's share, a discount. */
export interface InvoiceDeduction {
  kind: 'Deposit' | 'Insurance' | 'Discount';
  /** e.g. the payer's name for an insurance share. */
  label?: string;
  amount: number;
}

export interface InvoicePayment {
  method: PaymentMethod;
  amount: number;
  paidAt: string;
}

export interface PatientInvoice {
  id: string;
  /** `<BRANCH>-<YYYY>-<000001>` (FR-BIL-10) */
  number: string;
  branchId: string;
  doctorName?: string;
  issuedAt: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  total: number;
  deductions: InvoiceDeduction[];
  payments: InvoicePayment[];
  /** What the patient still owes. */
  balanceDue: number;
}

/** Open: something still to pay. */
export const isOpen = (invoice: Pick<PatientInvoice, 'status'>) => invoice.status === 'Issued' || invoice.status === 'PartiallyPaid';
