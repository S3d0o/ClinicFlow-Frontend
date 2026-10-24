import { describe, expect, it } from 'vitest';
import { at, makeUser, org } from '@/test/fixtures';
import { screenRoutes } from './index';
import { decideAccess } from './access';

describe('decideAccess', () => {
  const nurse = makeUser([at('Nurse', 'br-nc')]);
  const patient = makeUser([org('Patient')]);
  const applicant = makeUser([], { hasDoctorApplication: true });

  it('lets anyone open public screens', () => {
    expect(decideAccess(null, { kind: 'public' })).toBe('allow');
    expect(decideAccess(nurse, { kind: 'public' })).toBe('allow');
  });

  it('sends signed-in users away from guest screens', () => {
    expect(decideAccess(null, { kind: 'guest' })).toBe('allow');
    expect(decideAccess(nurse, { kind: 'guest' })).toBe('go-home');
  });

  it('asks signed-out users to sign in for protected screens', () => {
    expect(decideAccess(null, { kind: 'signed-in' })).toBe('sign-in');
    expect(decideAccess(null, { kind: 'permission', anyOf: ['queue.view'] })).toBe('sign-in');
  });

  it('checks permissions for staff screens', () => {
    expect(decideAccess(nurse, { kind: 'permission', anyOf: ['vitals.write'] })).toBe('allow');
    expect(decideAccess(nurse, { kind: 'permission', anyOf: ['roles.manage'] })).toBe('forbidden');
  });

  it('keeps the patient portal for the patient capacity', () => {
    expect(decideAccess(patient, { kind: 'patient' })).toBe('allow');
    expect(decideAccess(nurse, { kind: 'patient' })).toBe('forbidden');
  });

  it('opens "My application" to applicants only', () => {
    expect(decideAccess(applicant, { kind: 'applicant' })).toBe('allow');
    expect(decideAccess(patient, { kind: 'applicant' })).toBe('forbidden');
  });
});

describe('screen catalog', () => {
  it('registers every path once', () => {
    const paths = screenRoutes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('gives every screen of phase 1 or later a design reference', () => {
    expect(screenRoutes.filter((r) => !r.design).map((r) => r.path)).toEqual([]);
  });
});
