// Patient search rules (FR-FD-01): name, phone, MRN, national ID or date of birth; partial phone
// match; Arabic names match whatever alef, ya or ta marbuta the receptionist types.

/** Folds Arabic letter variants and case, and drops diacritics and tatweel, so spellings compare equal. */
export function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '') // harakat and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The digits of a phone number, as a local Egyptian number: "+20 10 1234 5678" → "01012345678". */
export function localDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('20') && digits.length === 12 ? `0${digits.slice(2)}` : digits;
}

export interface Searchable {
  fullName: string;
  phone: string;
  mrn: string;
  nationalId?: string;
  dateOfBirth?: string;
}

/** Whether a patient matches the search text. Every word of a name query must appear in the name. */
export function matchesQuery(patient: Searchable, query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(q)) return patient.dateOfBirth === q;

  const digits = q.replace(/[\s()+-]/g, '');
  if (/^\d+$/.test(digits)) {
    if (digits.length >= 4 && localDigits(patient.phone).includes(localDigits(digits))) return true;
    if (patient.nationalId && digits.length >= 6 && patient.nationalId.includes(digits)) return true;
    return patient.mrn.replace(/\D/g, '').endsWith(digits.replace(/^0+/, '')) && digits.length >= 3;
  }
  if (/^mrn-?\d+$/i.test(q)) return patient.mrn.toLowerCase() === q.toLowerCase().replace(/^mrn-?/, 'mrn-');

  const name = normalizeName(patient.fullName);
  return normalizeName(q).split(' ').every((word) => name.includes(word));
}

/** Same person by FR-FD-02: the same phone, or the same name and date of birth. */
export function isLikelyDuplicate(patient: Searchable, candidate: { fullName?: string; phone?: string; dateOfBirth?: string }): boolean {
  const phone = candidate.phone ? localDigits(candidate.phone) : '';
  if (phone.length >= 11 && localDigits(patient.phone) === phone) return true;
  return (
    !!candidate.fullName?.trim() &&
    !!candidate.dateOfBirth &&
    patient.dateOfBirth === candidate.dateOfBirth &&
    normalizeName(patient.fullName) === normalizeName(candidate.fullName)
  );
}
