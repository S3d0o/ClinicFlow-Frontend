import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEMO_CODE } from '@/mocks/seed/users';
import { renderApp } from '@/test/render-app';

const PATIENT = 'u-mohamed';

describe('records', () => {
  it('lists visits and opens a summary with medicines, tests and the follow-up', async () => {
    renderApp({ path: '/patient/visits', signedInAs: PATIENT });
    expect(await screen.findByText('2 medicines prescribed')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Records' }).some((link) => link.getAttribute('aria-current') === 'page')).toBe(true);

    await userEvent.click(screen.getAllByRole('link', { name: 'View visit summary' })[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Visit summary' })).toBeInTheDocument();
    expect(screen.getByText(/Concor/)).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book the follow-up' })).toHaveAttribute('href', expect.stringContaining('/patient/book/doc-ahmed'));
  });

  it('pays an open invoice online', async () => {
    renderApp({ path: '/patient/invoices', signedInAs: PATIENT });
    expect(await screen.findByRole('tab', { name: 'Open (1)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Pay EGP\s?350 online/ }));
    expect(await screen.findByText('Payment received. Thank you.')).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: 'Open (0)' })).toBeInTheDocument();
  });

  it('says a new upload is still being checked when it’s downloaded before its virus scan passes', async () => {
    renderApp({ path: '/patient/documents', signedInAs: PATIENT, scanDelayMs: 60_000 });
    await userEvent.upload(await screen.findByLabelText('Upload a document'), new File(['%PDF'], 'lab-results.pdf', { type: 'application/pdf' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Download lab-results.pdf' }));
    expect(await screen.findByText('This file is still being checked for viruses. Try again in a moment.')).toBeInTheDocument();
  });

  it('uploads a document and adds an insurance card for the desk to verify', async () => {
    renderApp({ path: '/patient/documents', signedInAs: PATIENT });
    await userEvent.upload(await screen.findByLabelText('Upload a document'), new File(['%PDF'], 'lab-results.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText('lab-results.pdf')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Add an insurance card/ }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Insurance company/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Delta Care (TPA)' }));
    await userEvent.type(within(dialog).getByLabelText(/Member number/), 'DC-778');
    await userEvent.type(within(dialog).getByLabelText(/Valid until/), '2027-12-31');
    await userEvent.upload(within(dialog).getByLabelText(/Front of the card/), new File(['img'], 'front.jpg', { type: 'image/jpeg' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add card' }));
    expect(await screen.findByText('Waiting for the desk to check it')).toBeInTheDocument();
  });
});

describe('profile and settings', () => {
  it('keeps email reminders off until an email is confirmed', async () => {
    renderApp({ path: '/patient/profile', signedInAs: PATIENT });
    expect(await screen.findByRole('radio', { name: 'Email' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Phone' })).toBeChecked();
  });

  it('changes the mobile number with a code sent to the new one', async () => {
    renderApp({ path: '/patient/profile', signedInAs: PATIENT });
    await userEvent.click(await screen.findByRole('button', { name: 'Change number' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/New mobile number/), '0155 666 7777');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send code' }));
    await userEvent.click(await within(dialog).findByRole('textbox', { name: 'Digit 1 of 6' }));
    await userEvent.keyboard(DEMO_CODE);
    expect(await screen.findByText('Your mobile number was changed.')).toBeInTheDocument();
    expect(await screen.findByText('015 5666 7777')).toBeInTheDocument();
  });
});

describe('notifications', () => {
  it('shows the inbox in the patient’s language and marks everything read', async () => {
    renderApp({ path: '/patient/notifications', signedInAs: PATIENT });
    expect(await screen.findByText('فاتورة جديدة')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(await screen.findByRole('link', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('filters by category', async () => {
    renderApp({ path: '/patient/notifications', signedInAs: PATIENT });
    await userEvent.click(await screen.findByRole('button', { name: 'Prescriptions' }));
    expect(await screen.findByText('ملخص الزيارة جاهز')).toBeInTheDocument();
    expect(screen.queryByText('فاتورة جديدة')).not.toBeInTheDocument();
  });
});
