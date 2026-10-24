import { describe, expect, it } from 'vitest';
import type { Permission } from '@/features/auth/model/permissions';
import { at, org } from '@/test/fixtures';
import { grantsFor } from './role-permissions';

const grant = (permissions: ReturnType<typeof grantsFor>, permission: Permission) =>
  permissions.find((g) => g.permission === permission);

describe('grantsFor (default role matrix, 02 §6)', () => {
  it('scopes branch roles to their branches', () => {
    const grants = grantsFor([at('Receptionist', 'br-nc')]);
    expect(grant(grants, 'appointments.check_in')).toEqual({
      permission: 'appointments.check_in',
      scope: 'Branch',
      branchIds: ['br-nc'],
    });
  });

  it('gives organization-only manager permissions to organization managers alone', () => {
    expect(grant(grantsFor([org('Manager')]), 'claims.manage')?.scope).toBe('Organization');
    expect(grant(grantsFor([at('Manager', 'br-ma')]), 'claims.manage')).toBeUndefined();
  });

  it('keeps the widest scope across roles and merges branch lists', () => {
    const grants = grantsFor([at('Nurse', 'br-nc'), at('Receptionist', 'br-ma')]);
    expect(grant(grants, 'queue.view')?.branchIds?.sort()).toEqual(['br-ma', 'br-nc']);

    const widened = grantsFor([at('Doctor', 'br-nc'), org('Manager')]);
    expect(grant(widened, 'appointments.cancel')?.scope).toBe('Organization');
  });

  it('gives patients their own records only', () => {
    const grants = grantsFor([org('Patient')]);
    expect(grants.length).toBeGreaterThan(0);
    expect(grants.every((g) => g.scope === 'Own')).toBe(true);
  });

  it('never gives clinical permissions to Admin or Accountant (hard rule, 02 §6)', () => {
    const clinical: Permission[] = [
      'encounters.view', 'encounters.write', 'encounters.sign', 'encounters.addend', 'encounters.void',
      'vitals.write', 'prescriptions.write', 'records.break_glass',
    ];
    for (const role of [org('Admin'), org('Accountant')]) {
      const grants = grantsFor([role]);
      expect(clinical.filter((p) => grant(grants, p))).toEqual([]);
    }
  });
});
