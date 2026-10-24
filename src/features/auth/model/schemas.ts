import { z } from 'zod';
import { LANGUAGES } from '@/shared/i18n/languages';
import { meetsPasswordPolicy } from '@/shared/lib/password';
import { isEgyptianMobile } from '@/shared/lib/phone';

// Form schemas for the account screens. Messages are `common:validation.*` keys, translated by
// `useValidationMessage`; the server checks the same rules again.

const required = z.string().trim().min(1, 'validation.required');
const email = z.string().trim().email('validation.email');
const phone = required.refine(isEgyptianMobile, 'validation.phone');
const password = z.string().min(1, 'validation.required').refine(meetsPasswordPolicy, 'validation.passwordPolicy');
const name = required.max(50, 'validation.maxLength');

export const signInSchema = z.object({
  identifier: required.refine((v) => isEgyptianMobile(v) || email.safeParse(v).success, 'validation.identifier'),
  password: z.string().min(1, 'validation.required'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  firstName: name,
  lastName: name,
  phone,
  password,
  email: z.union([z.literal(''), email]),
  preferredLanguage: z.enum(LANGUAGES),
  acceptTerms: z.boolean().refine((v) => v, 'validation.terms'),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

// A new password typed twice (reset, invitation)
const passwordsMatch = (v: { password: string; confirmPassword: string }) => v.password === v.confirmPassword;
const mismatch = { message: 'validation.passwordMismatch', path: ['confirmPassword'] };

export const newPasswordSchema = z.object({ password, confirmPassword: z.string() }).refine(passwordsMatch, mismatch);
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;

export const invitationSchema = z
  .object({
    fullName: required.max(100, 'validation.maxLength'),
    phone,
    password,
    confirmPassword: z.string(),
    agree: z.boolean().refine((v) => v, 'validation.terms'),
  })
  .refine(passwordsMatch, mismatch);
export type InvitationValues = z.infer<typeof invitationSchema>;

export const forgotPasswordSchema = z.discriminatedUnion('channel', [
  z.object({ channel: z.literal('sms'), phone, email: z.string() }),
  z.object({ channel: z.literal('email'), email, phone: z.string() }),
]);
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const emailSchema = z.object({ email });
export type EmailValues = z.infer<typeof emailSchema>;
