import { z } from 'zod';

// The small forms of the encounter workspace (FR-EMR-05, FR-EMR-07, FR-EMR-10). Messages are `common:validation.*` keys.

const required = z.string().trim().min(1, 'validation.required');
const optional = z.string().trim();

/** A medicine to add: from the catalog (`drugId`) or typed freely. */
export const prescriptionItemSchema = z.object({
  drugName: required.max(100, 'validation.maxLength'),
  drugId: optional,
  strength: optional.max(40, 'validation.maxLength'),
  form: optional.max(40, 'validation.maxLength'),
  dose: required.max(60, 'validation.maxLength'),
  frequency: required.max(60, 'validation.maxLength'),
  durationDays: z.union([z.literal(''), optional.regex(/^\d{1,3}$/, 'validation.wholeNumber').refine((d) => Number(d) >= 1 && Number(d) <= 365, 'validation.wholeNumber')]),
  instructions: optional.max(200, 'validation.maxLength'),
});

export type PrescriptionItemValues = z.infer<typeof prescriptionItemSchema>;

export const orderSchema = z.object({
  type: z.enum(['Lab', 'Radiology', 'Referral']),
  description: required.max(200, 'validation.maxLength'),
});

export type OrderValues = z.infer<typeof orderSchema>;

export const addendumSchema = z.object({
  text: required.max(2000, 'validation.maxLength'),
});

export type AddendumValues = z.infer<typeof addendumSchema>;
