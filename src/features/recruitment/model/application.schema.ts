import { z } from 'zod';
import { checkApplicationFile } from './files';

export const COVER_LETTER_MAX = 1000;

const fileProblem = (file: File | null) => (file ? checkApplicationFile(file) : null);

/**
 * The application form (FR-REC-01). Messages are `common:` keys: validation rules, or the API's own
 * error messages for file problems, so the form and the server say the same thing.
 */
export const applicationSchema = z
  .object({
    specialtyId: z.string().min(1, 'validation.required'),
    licenseNo: z.string().trim().min(1, 'validation.required').max(50, 'validation.maxLength'),
    yearsOfExperience: z
      .number({ error: 'validation.wholeNumber' })
      .int('validation.wholeNumber')
      .min(0, 'validation.wholeNumber')
      .max(60, 'validation.wholeNumber'),
    /** Empty for "no preference". */
    preferredBranchId: z.string(),
    cv: z.instanceof(File).nullable(),
    coverLetterMode: z.enum(['text', 'file']),
    coverLetterText: z.string().max(COVER_LETTER_MAX, 'validation.maxLength'),
    coverLetter: z.instanceof(File).nullable(),
  })
  .superRefine((values, ctx) => {
    if (!values.cv) ctx.addIssue({ code: 'custom', path: ['cv'], message: 'errors.DoctorApplication.CvRequired' });
    const cvProblem = fileProblem(values.cv);
    if (cvProblem) ctx.addIssue({ code: 'custom', path: ['cv'], message: `errors.${cvProblem}` });
    const letterProblem = values.coverLetterMode === 'file' ? fileProblem(values.coverLetter) : null;
    if (letterProblem) ctx.addIssue({ code: 'custom', path: ['coverLetter'], message: `errors.${letterProblem}` });
  });

export type ApplicationValues = z.infer<typeof applicationSchema>;

/** The fields each step checks before moving on. */
export const STEP_FIELDS = {
  practice: ['specialtyId', 'licenseNo', 'yearsOfExperience', 'preferredBranchId'],
  documents: ['cv', 'coverLetterText', 'coverLetter'],
} as const satisfies Record<string, readonly (keyof ApplicationValues)[]>;
