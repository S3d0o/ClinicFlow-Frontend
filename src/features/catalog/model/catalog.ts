import type { Bilingual } from '@/shared/i18n/bilingual';

/** A medical specialty (V1 entity, both names per R9). */
export interface Specialty extends Bilingual {
  id: string;
}

export type ServiceCategory = 'Consultation' | 'FollowUp' | 'Procedure' | 'Package';

/** A bookable, billable service (FR-SVC-01). */
export interface Service extends Bilingual {
  id: string;
  code: string;
  category: ServiceCategory;
  specialtyId: string;
  defaultDurationMinutes: number;
  /** A deposit the patient may pay online when booking; never required (FR-APT-08). */
  optionalDepositAmount?: number;
}

/** One price: for the organization, a branch, a doctor, or a doctor at a branch (FR-SVC-02). */
export interface PriceListItem {
  id: string;
  serviceId: string;
  branchId?: string;
  doctorId?: string;
  price: number;
  /** Branch-local dates "yyyy-MM-dd"; `validTo` is inclusive and open-ended when missing. */
  validFrom: string;
  validTo?: string;
}
