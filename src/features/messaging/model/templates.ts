import type { ModuleCode } from '@/features/entitlements/model/modules';
import type { Language } from '@/shared/i18n/languages';

// Message templates and channels (FR-NTF-01, FR-NTF-02, R10; backend P1 PR 5, 06 §9.2). The backend
// renders every message in the recipient's language from these templates; admins edit the text.

/** Where a message goes. WhatsApp and SMS are the phone channels; WhatsApp is tried first. */
export const MESSAGE_CHANNELS = ['InApp', 'Email', 'WhatsApp', 'Sms'] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

/** The events that send a message (FR-NTF-03). New keys are additive: show an unknown one by its key. */
export const TEMPLATE_KEYS = [
  'AppointmentConfirmed',
  'AppointmentReminder',
  'AppointmentRescheduled',
  'AppointmentCancelled',
  'InvoiceIssued',
  'PaymentReceived',
  'PrescriptionReady',
  'StaffInvitation',
  'ApplicationStageChanged',
  'VerificationCode',
  'PasswordReset',
  'EmailConfirmation',
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

/** One template: an event's text for one channel in one language. */
export interface MessageTemplate {
  id: string;
  key: TemplateKey;
  channel: MessageChannel;
  language: Language;
  /** Email subject, or the in-app title. Absent for WhatsApp and SMS. */
  subject?: string;
  body: string;
  /** The placeholders this event can fill, written `{{name}}` in the text. */
  placeholders: string[];
  /** The ones the text must keep (a link, a code). */
  requiredPlaceholders: string[];
  /** WhatsApp only: the template Meta approved. Its text changes through Meta's approval, not here. */
  providerTemplateName?: string;
  /** The module whose events use it; the plan hides templates of modules that are off (ADR 0008). */
  module: ModuleCode;
  /** UTC; absent while the seeded default is unchanged. */
  updatedAt?: string;
  updatedByName?: string;
  /** Opaque concurrency token; a save with an older one is refused (`Concurrency.Conflict`). */
  rowVersion: string;
}

/** What an admin edits. `subject` only where the channel has one. */
export interface TemplateDraft {
  subject?: string;
  body: string;
}

export type SmsEncoding = 'Gsm7' | 'Ucs2';

/** How a text goes out by SMS: Arabic needs UCS-2, so a segment holds 70 characters (67 when split). */
export interface SmsLength {
  encoding: SmsEncoding;
  characters: number;
  segments: number;
  /** Characters per segment at this length: 160/153 for GSM-7, 70/67 for UCS-2. */
  perSegment: number;
}

/** A draft rendered with sample values, and what is wrong with it. */
export interface TemplatePreview {
  subject?: string;
  body: string;
  /** For SMS templates: the length of the rendered sample. */
  sms?: SmsLength;
  /** Placeholders the event can't fill. */
  unknownPlaceholders: string[];
  /** Required placeholders the draft dropped. */
  missingPlaceholders: string[];
}

/** An SMS template may render to at most this many segments. */
export const MAX_SMS_SEGMENTS = 3;

export const hasSubject = (channel: MessageChannel) => channel === 'Email' || channel === 'InApp';

const PLACEHOLDER = /\{\{\s*([A-Za-z][A-Za-z0-9]*)\s*\}\}/g;

/** The placeholder names a text uses, each once, in order. */
export function placeholdersIn(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

/** Fills `{{name}}` from `values`; a placeholder with no value stays as written. */
export function renderTemplate(text: string, values: Record<string, string>): string {
  return text.replace(PLACEHOLDER, (whole, name: string) => values[name] ?? whole);
}

// GSM 03.38: the basic set, and the extension characters that take two places
const GSM_BASIC = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
);
const GSM_EXTENDED = new Set('^{}\\[~]|€');

/** The SMS encoding, length and segment count of a text (06 §9.2: Arabic SMS are UCS-2, 70 characters a segment). */
export function smsLength(text: string): SmsLength {
  const chars = [...text];
  const gsm = chars.every((c) => GSM_BASIC.has(c) || GSM_EXTENDED.has(c));
  if (gsm) {
    const characters = chars.reduce((n, c) => n + (GSM_EXTENDED.has(c) ? 2 : 1), 0);
    const perSegment = characters <= 160 ? 160 : 153;
    return { encoding: 'Gsm7', characters, segments: Math.ceil(characters / perSegment), perSegment };
  }
  // UCS-2 counts UTF-16 code units, so a character outside the basic plane takes two
  const characters = text.length;
  const perSegment = characters <= 70 ? 70 : 67;
  return { encoding: 'Ucs2', characters, segments: Math.ceil(characters / perSegment), perSegment };
}

/** Sample values the preview fills in, per language. */
export const SAMPLE_VALUES: Record<Language, Record<string, string>> = {
  en: {
    patientName: 'Mohamed Adel',
    fullName: 'Nada Ali',
    doctorName: 'Dr. Ahmed Fathy',
    specialty: 'Cardiology',
    branch: 'Nasr City',
    branchAddress: '12 Makram Ebeid St., Nasr City',
    date: 'Sat, Oct 31',
    time: '10:30 AM',
    reference: 'CF-26-08731',
    invoiceNumber: 'NC-2026-000412',
    amount: 'EGP 450',
    code: '483920',
    minutes: '5',
    link: 'https://app.clinicflow.eg/#/r/4f9c2a',
    invitedBy: 'Karim Adel',
    roles: 'Receptionist',
    expiresAt: 'Nov 2, 10:00 AM',
    stage: 'Interview',
  },
  ar: {
    patientName: 'محمد عادل',
    fullName: 'ندى علي',
    doctorName: 'د. أحمد فتحي',
    specialty: 'أمراض القلب',
    branch: 'مدينة نصر',
    branchAddress: '12 شارع مكرم عبيد، مدينة نصر',
    date: 'السبت 31 أكتوبر',
    time: '10:30 ص',
    reference: 'CF-26-08731',
    invoiceNumber: 'NC-2026-000412',
    amount: '450 ج.م.',
    code: '483920',
    minutes: '5',
    link: 'https://app.clinicflow.eg/#/r/4f9c2a',
    invitedBy: 'كريم عادل',
    roles: 'موظف استقبال',
    expiresAt: '2 نوفمبر 10:00 ص',
    stage: 'مقابلة',
  },
};

/**
 * Renders a draft with the sample values and lists its problems, as the backend's renderer does
 * (unknown or missing placeholders, the SMS length). Used by the mock's `preview` and `update`.
 */
export function previewTemplate(template: Pick<MessageTemplate, 'channel' | 'language' | 'placeholders' | 'requiredPlaceholders'>, draft: TemplateDraft): TemplatePreview {
  const values = SAMPLE_VALUES[template.language];
  const text = `${draft.subject ?? ''}\n${draft.body}`;
  const used = placeholdersIn(text);
  const body = renderTemplate(draft.body, values);
  return {
    subject: hasSubject(template.channel) ? renderTemplate(draft.subject ?? '', values) : undefined,
    body,
    sms: template.channel === 'Sms' ? smsLength(body) : undefined,
    unknownPlaceholders: used.filter((name) => !template.placeholders.includes(name)),
    missingPlaceholders: template.requiredPlaceholders.filter((name) => !used.includes(name)),
  };
}

/** The first reason a draft can't be saved, as a `MessageTemplate.*` error reason; null when it can. */
export function templateProblem(
  template: Pick<MessageTemplate, 'channel' | 'language' | 'placeholders' | 'requiredPlaceholders' | 'providerTemplateName'>,
  draft: TemplateDraft
): 'ProviderManaged' | 'SubjectRequired' | 'UnknownPlaceholder' | 'MissingPlaceholder' | 'TooLong' | 'BodyRequired' | null {
  if (template.providerTemplateName) return 'ProviderManaged';
  if (!draft.body.trim()) return 'BodyRequired';
  if (hasSubject(template.channel) && !draft.subject?.trim()) return 'SubjectRequired';
  const preview = previewTemplate(template, draft);
  if (preview.unknownPlaceholders.length > 0) return 'UnknownPlaceholder';
  if (preview.missingPlaceholders.length > 0) return 'MissingPlaceholder';
  if (preview.sms && preview.sms.segments > MAX_SMS_SEGMENTS) return 'TooLong';
  return null;
}

/** Inserts `{{name}}` into `text` at the caret (or replaces the selection); returns the text and the new caret. */
export function insertPlaceholder(text: string, name: string, start: number, end = start): { text: string; caret: number } {
  const token = `{{${name}}}`;
  return { text: text.slice(0, start) + token + text.slice(end), caret: start + token.length };
}

/** The phone and email channels the platform runs (06 §9.2). Platform settings: read-only for a clinic. */
export interface MessageChannelStatus {
  channel: Exclude<MessageChannel, 'InApp'>;
  /** Switched on in the platform's settings (`Messaging:<Channel>:Enabled`). */
  enabled: boolean;
  /** Enabled and its provider settings are valid, so messages go out. */
  live: boolean;
  /** e.g. "Meta WhatsApp Cloud API", "SMTP". Absent while none is chosen. */
  provider?: string;
  /** The number or address messages come from. */
  sender?: string;
  sentLast24h: number;
  failedLast24h: number;
  /** UTC. */
  lastSentAt?: string;
}
