import { describe, expect, it } from 'vitest';
import { at, makeUser, org } from '@/test/fixtures';
import { patientNav, staffNav, visibleStaffNav } from './navigation';
import { routeAt } from './routes';

const groupLabels = (roles: Parameters<typeof makeUser>[0]) => visibleStaffNav(makeUser(roles)).map((g) => g.label);

describe('navigation', () => {
  it('links only to registered screens', () => {
    for (const item of [...staffNav.flatMap((g) => g.items), ...patientNav]) {
      expect(() => routeAt(item.to)).not.toThrow();
    }
  });

  it('shows each role the workspaces its permissions open', () => {
    expect(groupLabels([at('Receptionist', 'br-nc')])).toEqual(['frontDesk', 'account']);
    // Nurses read patient history (encounters.view, 02 §6), so they get Clinical → Patients
    expect(groupLabels([at('Nurse', 'br-nc')])).toEqual(['frontDesk', 'nurse', 'clinical', 'account']);
    expect(groupLabels([at('Doctor', 'br-nc')])).toEqual(['frontDesk', 'nurse', 'clinical', 'account']);
    expect(groupLabels([org('Admin')])).toEqual(['administration', 'account']);
  });

  it('shows a nurse the queue board but not booking or payments', () => {
    const items = visibleStaffNav(makeUser([at('Nurse', 'br-nc')])).flatMap((g) => g.items.map((i) => i.to));
    expect(items).toContain('/desk/queue');
    expect(items).not.toContain('/desk/book');
    expect(items).not.toContain('/desk/payments');
  });

  it('lets an organization manager run finance without an accountant (02 §1)', () => {
    expect(groupLabels([org('Manager')])).toContain('finance');
  });

  it('gives a branch manager staff and branch pages but not system administration', () => {
    const items = visibleStaffNav(makeUser([at('Manager', 'br-ma')])).flatMap((g) => g.items.map((i) => i.to));
    expect(items).toEqual(expect.arrayContaining(['/admin/staff', '/admin/branches']));
    expect(items).not.toEqual(expect.arrayContaining(['/admin/roles']));
    expect(items.filter((to) => ['/admin', '/admin/audit', '/admin/integrations'].includes(to))).toEqual([]);
  });
});
