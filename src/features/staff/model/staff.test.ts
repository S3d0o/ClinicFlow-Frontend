import { describe, expect, it } from 'vitest';
import { at, makeUser, org } from '@/test/fixtures';
import { STAFF_ROLES, branchCoverage, grantableRoles, rolesProblem } from './staff';

describe('grantableRoles', () => {
  it('lets an admin give every staff role', () => {
    expect(grantableRoles(makeUser([org('Admin')]))).toEqual(STAFF_ROLES);
  });

  it("keeps a manager from giving the Admin and Manager roles", () => {
    expect(grantableRoles(makeUser([at('Manager', 'br-ma')]))).toEqual(['Receptionist', 'Nurse', 'Doctor', 'Accountant']);
  });
});

describe('branchCoverage', () => {
  it('is every branch when a role covers the organization', () => {
    expect(branchCoverage([org('Manager'), at('Doctor', 'br-nc')])).toBe('all');
  });

  it('lists each branch once otherwise', () => {
    expect(branchCoverage([at('Doctor', 'br-nc', 'br-ma'), at('Nurse', 'br-nc')])).toEqual(['br-nc', 'br-ma']);
  });
});

describe('rolesProblem', () => {
  it('needs a role, and a branch for every branch-limited role', () => {
    expect(rolesProblem([])).toBe('noRole');
    expect(rolesProblem([at('Nurse')])).toBe('noBranch');
    expect(rolesProblem([at('Nurse', 'br-nc'), org('Accountant')])).toBeNull();
  });
});
