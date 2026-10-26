import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fixClock } from '@/test/clock';
import { renderApp } from '@/test/render-app';

const RECEPTIONIST = 'u-mona';

describe('checkout at the desk (FR-BIL-01/02/05/14)', () => {
  fixClock();

  it('adds a service, takes cash with change and prints the receipt', async () => {
    renderApp({ path: '/desk/payments', signedInAs: RECEPTIONIST });
    const kamal = (await screen.findByRole('heading', { name: 'Kamal Fouad' })).closest('li') as HTMLElement;
    await userEvent.click(within(kamal).getByRole('button', { name: 'Take payment' }));

    await userEvent.click(await screen.findByRole('combobox', { name: 'Service to add' }));
    await userEvent.click(await screen.findByRole('option', { name: '12-lead ECG' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByRole('button', { name: 'Remove 12-lead ECG' })).toBeInTheDocument();
    const pay = await screen.findByRole('button', { name: /Collect EGP\s350/ });

    await userEvent.click(screen.getByRole('button', { name: /EGP\s400/ }));
    expect(screen.getByText('Change to give back').nextElementSibling).toHaveTextContent(/EGP\s50/);
    await userEvent.click(pay);

    const receipt = await screen.findByRole('region', { name: 'Payment received' });
    expect(within(receipt).getByText('NC-2026-000415')).toBeInTheDocument();
    expect(within(receipt).getByText('Give back').nextElementSibling).toHaveTextContent(/EGP\s50/);
    expect(screen.queryByRole('button', { name: 'Remove 12-lead ECG' })).not.toBeInTheDocument(); // the invoice is issued

    await userEvent.click(within(receipt).getByRole('button', { name: 'Next patient' }));
    expect(await screen.findByRole('heading', { name: /Waiting to pay/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Kamal Fouad' })).not.toBeInTheDocument();
  });

  it('takes part by card and leaves the rest due', async () => {
    renderApp({ path: '/desk/payments?visit=apt-d-h1', signedInAs: RECEPTIONIST });
    await userEvent.click(await screen.findByRole('radio', { name: /Card \(POS\)/ }));
    const amount = screen.getByLabelText(/^Amount to collect/);
    await userEvent.clear(amount);
    await userEvent.type(amount, '100');
    await userEvent.click(screen.getByRole('button', { name: /Collect EGP\s100/ }));
    const receipt = await screen.findByRole('region', { name: 'Payment received' });
    expect(within(receipt).getByText('Still due').nextElementSibling).toHaveTextContent(/EGP\s75/);
    expect(within(receipt).getByRole('button', { name: /Take the remaining EGP\s75/ })).toBeInTheDocument();
  });

  it('asks a user without a drawer to open a cash session before taking cash', async () => {
    // An organization-wide manager takes payments but has no cash drawer of their own
    localStorage.setItem('clinicflow:active-branch', 'br-nc');
    renderApp({ path: '/desk/payments?visit=apt-d-h1', signedInAs: 'u-hala' });
    expect(await screen.findByText('Cash goes into your drawer, so open a cash session first.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Collect EGP\s175/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: /Card \(POS\)/ }));
    expect(screen.getByRole('button', { name: /Collect EGP\s175/ })).toBeEnabled();
  });
});

describe('the cash drawer (FR-BIL-09)', () => {
  fixClock();

  it('shows the takings, closes with a balanced count and opens a new session', async () => {
    renderApp({ path: '/desk/cash', signedInAs: RECEPTIONIST });
    expect(await screen.findByRole('heading', { name: 'Open session: Desk 1' })).toBeInTheDocument();
    const expected = screen.getByText('Expected in the drawer').closest('div')!.parentElement!;
    expect(expected).toHaveTextContent(/EGP\s950/);
    expect(screen.getByText('RF-0120')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Number of EGP 200 notes'), '4');
    await userEvent.type(screen.getByLabelText('Number of EGP 100 notes'), '1');
    await userEvent.type(screen.getByLabelText('Number of EGP 50 notes'), '1');
    expect(screen.getByText('None: the drawer balances')).toBeInTheDocument();
    // The header's "Close session" scrolls to the form; the form's own button submits
    await userEvent.click(screen.getAllByRole('button', { name: 'Close session' }).at(-1)!);
    const confirm = await screen.findByRole('alertdialog');
    await userEvent.click(within(confirm).getByRole('button', { name: 'Close session' }));

    expect(await screen.findByRole('heading', { name: 'Desk 1 is closed' })).toBeInTheDocument();
    expect(screen.getByText('The session is closed. Hand the cash over as usual.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open a new session' }));
    await userEvent.click(await screen.findByRole('radio', { name: /Desk 1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Open session' }));
    expect(await screen.findByText('No payments in this session yet.')).toBeInTheDocument();
  });
});
