import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render-app';

describe('organization administration', () => {
  it("shows a branch's hours and closes it on Fridays", async () => {
    const { services } = renderApp({ path: '/admin/branches', signedInAs: 'u-karim' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Branches' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Nasr City' })).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('switch', { name: 'Open on Friday' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save opening hours' }));
    expect(await screen.findByText(/Opening hours saved/)).toBeInTheDocument();
    expect((await services.branchAdmin.getHours('br-nc')).find((d) => d.weekday === 5)?.ranges).toEqual([]);
  });

  it('adds a branch', async () => {
    renderApp({ path: '/admin/branches', signedInAs: 'u-karim' });
    await userEvent.click(await screen.findByRole('button', { name: 'Add branch' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^Code/), 'HL');
    await userEvent.type(within(dialog).getByLabelText(/Name in English/), 'Heliopolis');
    await userEvent.type(within(dialog).getByLabelText(/Name in Arabic/), 'مصر الجديدة');
    await userEvent.type(within(dialog).getByLabelText(/Address in English/), '5 Baghdad St.');
    await userEvent.type(within(dialog).getByLabelText(/Address in Arabic/), '5 شارع بغداد');
    await userEvent.type(within(dialog).getByLabelText(/Phone/), '+20224150000');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Heliopolis' })).toBeInTheDocument();
  });

  it('changes the cancellation window within its bounds', async () => {
    const { services } = renderApp({ path: '/admin/settings', signedInAs: 'u-karim' });
    const field = await screen.findByLabelText('Cancellation window');
    const section = screen.getByRole('region', { name: 'Appointments and queue' });

    await userEvent.clear(field);
    await userEvent.type(field, '100');
    expect(within(section).getByText('Enter a whole number between 0 and 72.')).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: 'Save' })).toBeDisabled();

    await userEvent.clear(field);
    await userEvent.type(field, '4');
    await userEvent.click(within(section).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument();
    expect((await services.organization.getSettings()).cancellationWindowHours).toBe(4);
  });

  it('adds a specialty', async () => {
    renderApp({ path: '/admin/specialties', signedInAs: 'u-karim' });
    await userEvent.click(await screen.findByRole('button', { name: 'Add specialty' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/Name in English/), 'Psychiatry');
    await userEvent.type(within(dialog).getByLabelText(/Name in Arabic/), 'الطب النفسي');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Psychiatry')).toBeInTheDocument();
  });
});
