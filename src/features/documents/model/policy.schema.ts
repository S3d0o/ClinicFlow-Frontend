import { z } from 'zod';
import { CARD_ACCEPT, checkDocument } from './documents';

const cardExtensions = CARD_ACCEPT.split(',');
const required = z.string().trim().min(1, 'validation.required');

/** Adding an insurance card (FR-INS-03). File problems use the API's own messages (`errors.File.*`). */
export const policySchema = z
  .object({
    payerId: z.string().min(1, 'validation.required'),
    memberNo: required.max(40, 'validation.maxLength'),
    holderName: required.max(100, 'validation.maxLength'),
    validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.required'),
    cardFront: z.instanceof(File).nullable(),
    cardBack: z.instanceof(File).nullable(),
  })
  .superRefine((values, ctx) => {
    if (!values.cardFront) ctx.addIssue({ code: 'custom', path: ['cardFront'], message: 'validation.required' });
    for (const field of ['cardFront', 'cardBack'] as const) {
      const file = values[field];
      const problem = file && checkDocument(file, cardExtensions);
      if (problem) ctx.addIssue({ code: 'custom', path: [field], message: `errors.${problem}` });
    }
  });

export type PolicyValues = z.infer<typeof policySchema>;
