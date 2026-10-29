import { describe, expect, it } from 'vitest';
import { effectiveModules } from '@/features/entitlements/model/modules';
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

  it('sends staff without an authenticator to setup instead of their screens', () => {
    const newNurse = makeUser([at('Nurse', 'br-nc')], { mfaEnrolled: false });
    expect(decideAccess(newNurse, { kind: 'permission', anyOf: ['vitals.write'] })).toBe('setup-mfa');
    expect(decideAccess(newNurse, { kind: 'signed-in' })).toBe('allow');
  });

  describe("with the clinic's modules", () => {
    const withoutEmr = effectiveModules(['FD', 'BIL', 'PAT', 'RPT']);

    it("says a screen of a disabled add-on isn't in the plan, signed in or not", () => {
      expect(decideAccess(patient, { kind: 'patient', module: 'EMR' }, withoutEmr)).toBe('module-off');
      expect(decideAccess(null, { kind: 'public', module: 'REC' }, withoutEmr)).toBe('module-off');
      expect(decideAccess(patient, { kind: 'patient', module: 'PAT' }, withoutEmr)).toBe('allow');
    });

    it('closes a permission screen whose permissions all belong to disabled modules', () => {
      const doctor = makeUser([at('Doctor', 'br-nc')]);
      expect(decideAccess(doctor, { kind: 'permission', anyOf: ['encounters.write'] }, withoutEmr)).toBe('module-off');
      expect(decideAccess(nurse, { kind: 'permission', anyOf: ['vitals.write'] }, withoutEmr)).toBe('allow');
    });

    it('checks no module when the modules are unknown', () => {
      expect(decideAccess(patient, { kind: 'patient', module: 'EMR' })).toBe('allow');
    });
  });
});

describe('screen catalog', () => {
  it('registers every path once', () => {
    const paths = screenRoutes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('gives every screen a design reference, except the pages the designs leave out', () => {
    // The email-link page, and the plan screen (ADR 0008 came after the designs)
    expect(screenRoutes.filter((r) => !r.design).map((r) => r.path)).toEqual(['/confirm-email', '/admin/subscription']);
  });
});
