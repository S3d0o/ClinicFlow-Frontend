import { z } from 'zod';
import { isEgyptianMobile } from '@/shared/lib/phone';

// Registering a patient at the desk (FR-FD-02). Messages are `common:validation.*` keys.

const required = z.string().trim().min(1, 'validation.required');
const optional = z.string().trim();

/** The form's schema; `today` (branch date) bounds the date of birth. */
export const registerPatientSchema = (today: string) =>
  z.object({
    fullName: required.max(100, 'validation.maxLength'),
    phone: required.refine(isEgyptianMobile, 'validation.phone'),
    gender: z.enum(['Male', 'Female'], { message: 'validation.required' }),
    dateOfBirth: required
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.required')
      .refine((date) => date <= today && date >= '1900-01-01', 'validation.dateOfBirth'),
    // Egyptian national ID: 14 digits
    nationalId: z.union([z.literal(''), optional.regex(/^\d{14}$/, 'validation.nationalId')]),
    emergencyContactName: optional.max(100, 'validation.maxLength'),
    emergencyContactPhone: z.union([z.literal(''), optional.refine(isEgyptianMobile, 'validation.phone')]),
  });

export type RegisterPatientValues = z.infer<ReturnType<typeof registerPatientSchema>>;
