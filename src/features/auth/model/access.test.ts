import { describe, expect, it } from 'vitest';
import { at, makeUser, org } from '@/test/fixtures';
import { can, canAny, homePath, isStaff, postSignInPath } from './access';

describe('can', () => {
  const receptionist = makeUser([at('Receptionist', 'br-nc')]);

  it('is false for a signed-out user', () => {
    expect(can(null, 'queue.view')).toBe(false);
  });

  it('checks the permission regardless of branch when none is given', () => {
    expect(can(receptionist, 'appointments.check_in')).toBe(true);
    expect(can(receptionist, 'roles.manage')).toBe(false);
  });

  it('limits a Branch-scope grant to the assigned branches', () => {
    expect(can(receptionist, 'appointments.check_in', 'br-nc')).toBe(true);
    expect(can(receptionist, 'appointments.check_in', 'br-ma')).toBe(false);
  });

  it('lets an Organization-scope grant cover every branch', () => {
    const manager = makeUser([org('Manager')]);
    expect(can(manager, 'appointments.check_in', 'br-ma')).toBe(true);
  });

  it('canAny is true when one permission matches', () => {
    expect(canAny(receptionist, ['roles.manage', 'queue.view'])).toBe(true);
    expect(canAny(receptionist, ['roles.manage', 'audit.view'])).toBe(false);
  });

  it('canAny can require a minimum scope, so own-records grants do not open branch-wide screens', () => {
    const doctor = makeUser([at('Doctor', 'br-nc')]); // reports.operational at Own scope
    expect(canAny(doctor, ['reports.operational'])).toBe(true);
    expect(canAny(doctor, ['reports.operational'], 'Branch')).toBe(false);
    expect(canAny(makeUser([org('Manager')]), ['reports.operational'], 'Branch')).toBe(true);
  });
});

describe('homePath', () => {
  it('sends each role to its workspace', () => {
    expect(homePath(makeUser([at('Receptionist', 'br-nc')]))).toBe('/desk');
    expect(homePath(makeUser([at('Nurse', 'br-nc')]))).toBe('/nurse');
    expect(homePath(makeUser([at('Doctor', 'br-nc')]))).toBe('/doctor');
    expect(homePath(makeUser([org('Accountant')]))).toBe('/finance');
    expect(homePath(makeUser([org('Admin')]))).toBe('/admin');
    expect(homePath(makeUser([org('Patient')]))).toBe('/patient');
  });

  it('prefers the manager dashboard for a manager who is also a doctor', () => {
    expect(homePath(makeUser([org('Manager'), at('Doctor', 'br-nc')]))).toBe('/manager');
  });

  it('sends a doctor applicant (no role) to their application', () => {
    expect(homePath(makeUser([], { hasDoctorApplication: true }))).toBe('/my-application');
  });

  it('sends a signed-out visitor to the landing page', () => {
    expect(homePath(null)).toBe('/');
  });
});

describe('isStaff', () => {
  it('counts every role except Patient', () => {
    expect(isStaff(makeUser([org('Patient')]))).toBe(false);
    expect(isStaff(makeUser([at('Nurse', 'br-nc')]))).toBe(true);
  });
});

describe('postSignInPath', () => {
  const nurse = makeUser([at('Nurse', 'br-nc')]);

  it('returns to the page the user asked for when they may open it', () => {
    expect(postSignInPath(nurse, '/nurse/triage/a1', () => true)).toBe('/nurse/triage/a1');
  });

  it('goes home when the requested page is not theirs', () => {
    expect(postSignInPath(nurse, '/admin', () => false)).toBe('/nurse');
  });

  it('goes home instead of back to an auth page', () => {
    expect(postSignInPath(nurse, '/sign-in', () => true)).toBe('/nurse');
    expect(postSignInPath(nurse, undefined, () => true)).toBe('/nurse');
  });
});
