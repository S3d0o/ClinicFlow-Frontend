import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render-app';

describe('staff administration', () => {
  it('lists the staff and invites a new receptionist', async () => {
    renderApp({ path: '/admin/staff', signedInAs: 'u-karim' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Staff' })).toBeInTheDocument();
    expect(await screen.findByText('Mona Samir')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Invite staff member' }));
    const sheet = await screen.findByRole('dialog');
    await userEvent.type(within(sheet).getByLabelText(/Full name/), 'Nada Ali');
    await userEvent.type(within(sheet).getByLabelText(/Work email/), 'nada.ali@clinicflow.eg');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Send invitation' }));
    expect(await within(sheet).findByText('Choose at least one role.')).toBeInTheDocument();

    await userEvent.click(within(sheet).getByLabelText('Receptionist'));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Send invitation' }));
    expect(await screen.findByText('Nada Ali')).toBeInTheDocument();
  });

  it("deactivates a staff member from their page", async () => {
    renderApp({ path: '/admin/staff/u-sara', signedInAs: 'u-karim' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Sara Ibrahim' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    const panel = screen.getByRole('region', { name: 'Deactivate Sara Ibrahim' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText('Deactivated')).toBeInTheDocument();
  });

  it('shows the permissions of every role, read-only', async () => {
    renderApp({ path: '/admin/roles', signedInAs: 'u-karim' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Roles & permissions' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Nurse' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'vitals.write' })).toBeInTheDocument();
  });
});
