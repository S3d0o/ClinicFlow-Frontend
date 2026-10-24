import type { PatientInvoice } from '../model/invoice';

/** The patient's invoices and receipts (FR-PAT-03/04). Errors: `Invoice.NotFound`, `Payment.GatewayUnavailable`. */
export interface PatientBillingService {
  listMine(): Promise<PatientInvoice[]>;
  /** Paymob hosted checkout for an open invoice's balance (FR-BIL-06). */
  startCheckout(invoiceId: string): Promise<{ checkoutUrl: string }>;
  /** The invoice, or the receipt once paid, as a PDF (FR-BIL-07). */
  downloadPdf(invoiceId: string): Promise<Blob>;
}
