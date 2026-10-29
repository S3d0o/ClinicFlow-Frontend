import { z } from 'zod';
import { isEgyptianMobile } from '@/shared/lib/phone';

// Branches, their hours, holidays and rooms (FR-ORG-02, 03, 04; design admin/05).

/** One opening period on a weekday, branch wall clock (`HH:mm`). */
export interface TimeRange {
  from: string;
  to: string;
}

/** A weekday's opening periods; none means closed. `weekday` is 0 (Sunday) … 6 (Saturday). */
export interface DayHours {
  weekday: number;
  ranges: TimeRange[];
}

export interface Holiday {
  id: string;
  /** Null when it closes every branch. */
  branchId: string | null;
  nameEn: string;
  nameAr: string;
  /** `yyyy-MM-dd`, inclusive. */
  from: string;
  to: string;
  recursYearly: boolean;
}

export type RoomKind = 'Consultation' | 'Procedure' | 'Triage';

export interface BranchRoom {
  id: string;
  branchId: string;
  nameEn: string;
  nameAr: string;
  kind: RoomKind;
  isActive: boolean;
}

/** Why a day's hours can't be saved, as a `orgAdmin:hours.errors.*` key; null when they can. */
export function hoursProblem(day: DayHours): 'order' | 'overlap' | null {
  if (day.ranges.some((r) => r.from >= r.to)) return 'order';
  const sorted = [...day.ranges].sort((a, b) => a.from.localeCompare(b.from));
  return sorted.some((r, i) => i > 0 && r.from < sorted[i - 1].to) ? 'overlap' : null;
}

/** Minutes the branch is open on a day. */
export const openMinutes = (day: DayHours) =>
  day.ranges.reduce((sum, r) => sum + toMinutes(r.to) - toMinutes(r.from), 0);

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** Whether a holiday closes `date` (`yyyy-MM-dd`); a yearly one matches the same days every year. */
export function holidayCovers(holiday: Holiday, date: string): boolean {
  if (!holiday.recursYearly) return date >= holiday.from && date <= holiday.to;
  const md = date.slice(5);
  const [from, to] = [holiday.from.slice(5), holiday.to.slice(5)];
  // A range across New Year (Dec 30 – Jan 2) wraps
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

const required = z.string().trim().min(1, 'validation.required');

/** The branch form (FR-ORG-02). Messages are `common:validation.*` keys. */
export const branchSchema = z.object({
  code: required.regex(/^[A-Z]{2,4}$/, 'validation.branchCode'),
  nameEn: required.max(80, 'validation.maxLength'),
  nameAr: required.max(80, 'validation.maxLength'),
  addressEn: required.max(200, 'validation.maxLength'),
  addressAr: required.max(200, 'validation.maxLength'),
  phone: required.refine((value) => isEgyptianMobile(value) || /^\+?20\d{8,9}$/.test(value.replace(/\s/g, '')), 'validation.phone'),
  timeZone: required,
});

export type BranchValues = z.infer<typeof branchSchema>;

export const holidaySchema = z
  .object({
    nameEn: required.max(80, 'validation.maxLength'),
    nameAr: required.max(80, 'validation.maxLength'),
    from: required,
    to: required,
    recursYearly: z.boolean(),
    allBranches: z.boolean(),
  })
  .refine((h) => h.to >= h.from, { path: ['to'], message: 'validation.dateRange' });

export type HolidayValues = z.infer<typeof holidaySchema>;

export const roomSchema = z.object({
  nameEn: required.max(60, 'validation.maxLength'),
  nameAr: required.max(60, 'validation.maxLength'),
  kind: z.enum(['Consultation', 'Procedure', 'Triage']),
});

export type RoomValues = z.infer<typeof roomSchema>;
