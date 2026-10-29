import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render-app';

describe('plans and modules', () => {
  it('shows the admin the plan, its usage and every module', async () => {
    renderApp({ path: '/admin/subscription', signedInAs: 'u-karim' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Plan & modules' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Full' })).toBeInTheDocument();
    expect(screen.getByText('WhatsApp messages this month')).toBeInTheDocument();
    expect(screen.getAllByText('Insurance').length).toBeGreaterThan(0);
  });

  it('switches the demo plan live, and the menus follow', async () => {
    renderApp({ path: '/admin/subscription', signedInAs: 'u-hala' });
    await screen.findByRole('heading', { level: 1, name: 'Plan & modules' });
    const sidebar = screen.getAllByRole('complementary')[0];
    expect(within(sidebar).getByRole('link', { name: 'Daily close' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Starter' })).toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: 'Daily close' })).not.toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'Plan & modules' })).toBeInTheDocument();
  });

  it("tells a doctor the clinical records aren't in the clinic's plan", async () => {
    renderApp({ path: '/doctor/encounters/apt-any', signedInAs: 'u-ahmed', plan: 'Clinic' });
    expect(await screen.findByRole('heading', { name: "Not in your clinic's plan" })).toBeInTheDocument();
  });

  it('hides online booking from patients when the plan has no patient portal', async () => {
    renderApp({ path: '/patient/book', signedInAs: 'u-mohamed', plan: 'Starter' });
    expect(await screen.findByRole('heading', { name: "Not in your clinic's plan" })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Book' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Appointments' }).length).toBeGreaterThan(0);
  });
});
