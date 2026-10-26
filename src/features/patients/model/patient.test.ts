import { describe, expect, it } from 'vitest';
import { ageOn, ageParts } from './patient';
import { registerPatientSchema } from './register.schema';
import { isLikelyDuplicate, localDigits, matchesQuery, normalizeName } from './search';

const patient = { fullName: 'أحمد إبراهيم', phone: '+201122334455', mrn: 'MRN-000111', nationalId: '28710030104455', dateOfBirth: '1987-10-03' };

describe('patient search', () => {
  it('folds Arabic letter variants, diacritics and case', () => {
    expect(normalizeName('أحمَد  إبراهيم')).toBe('احمد ابراهيم');
    expect(normalizeName('فاطمة على')).toBe('فاطمه علي');
    expect(normalizeName('Mona ADEL')).toBe('mona adel');
  });

  it('matches names word by word, phones in part, MRNs, national IDs and birth dates', () => {
    expect(matchesQuery(patient, 'ابراهيم')).toBe(true);
    expect(matchesQuery(patient, 'احمد علي')).toBe(false);
    expect(matchesQuery(patient, '0112 233')).toBe(true);
    expect(matchesQuery(patient, '+20 112 233 4455')).toBe(true);
    expect(matchesQuery(patient, '111')).toBe(true);
    expect(matchesQuery(patient, 'MRN-000111')).toBe(true);
    expect(matchesQuery(patient, '28710030')).toBe(true);
    expect(matchesQuery(patient, '1987-10-03')).toBe(true);
    expect(matchesQuery(patient, '   ')).toBe(false);
    expect(localDigits('+201122334455')).toBe('01122334455');
  });

  it('flags the same phone, or the same name with the same birth date', () => {
    expect(isLikelyDuplicate(patient, { phone: '01122334455' })).toBe(true);
    expect(isLikelyDuplicate(patient, { fullName: 'احمد ابراهيم', dateOfBirth: '1987-10-03' })).toBe(true);
    expect(isLikelyDuplicate(patient, { fullName: 'احمد ابراهيم' })).toBe(false);
    expect(isLikelyDuplicate(patient, { phone: '0112233' })).toBe(false);
  });
});

describe('age', () => {
  it('counts whole years, and months for young children', () => {
    expect(ageOn('1988-05-14', '2026-10-24')).toBe(38);
    expect(ageOn('1988-10-25', '2026-10-24')).toBe(37);
    expect(ageParts('2026-02-15', '2026-10-24')).toEqual({ unit: 'months', value: 8 });
    expect(ageParts('2021-09-10', '2026-10-24')).toEqual({ unit: 'years', value: 5 });
  });
});

describe('registration form', () => {
  const schema = registerPatientSchema('2026-10-24');
  const valid = { fullName: 'Laila Samir', phone: '010 9999 8888', gender: 'Female', dateOfBirth: '1993-04-02', nationalId: '', emergencyContactName: '', emergencyContactPhone: '' };

  it('accepts a complete form and checks the national ID and dates', () => {
    expect(schema.safeParse(valid).success).toBe(true);
    const issues = (values: object) => schema.safeParse({ ...valid, ...values }).error?.issues.map((i) => i.message);
    expect(issues({ nationalId: '123' })).toEqual(['validation.nationalId']);
    expect(issues({ dateOfBirth: '2027-01-01' })).toEqual(['validation.dateOfBirth']);
    expect(issues({ emergencyContactPhone: '12345' })).toEqual(['validation.phone']);
    expect(issues({ gender: undefined })).toEqual(['validation.required']);
  });
});
