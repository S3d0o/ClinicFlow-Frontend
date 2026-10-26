import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEMO_REMINDER_TOKEN } from '@/mocks/seed/patient-portal';
import { renderApp } from '@/test/render-app';

const PATIENT = 'u-mohamed';

/** The first free time in the slot picker. */
async function pickFirstFreeTime() {
  const times = await screen.findByRole('group', { name: 'Time' });
  const free = within(times)
    .getAllByRole('button')
    .find((button) => !button.hasAttribute('disabled'))!;
  await userEvent.click(free);
}

describe('patient home', () => {
  it("shows today's visit with the live queue and the shortcuts", async () => {
    renderApp({ path: '/patient', signedInAs: PATIENT });
    expect(await screen.findByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening), Mohamed$/ })).toBeInTheDocument();

    const today = await screen.findByRole('region', { name: "Today's appointment" });
    expect(within(today).getByText('Dr. Ahmed Fathy')).toBeInTheDocument();
    expect(within(today).getByText('A-14')).toBeInTheDocument();
    expect(within(today).getByText("You're number 3 in line")).toBeInTheDocument();
    expect(within(today).getByText('Dr. Ahmed Fathy is running about 15 minutes late.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Invoices & receipts' })).toHaveAttribute('href', '/patient/invoices');
  });

  it('shows the unread count on the bell', async () => {
    renderApp({ path: '/patient', signedInAs: PATIENT });
    expect(await screen.findByRole('link', { name: 'Notifications, 2 unread' })).toBeInTheDocument();
  });
});

describe('booking (FR-APT-02, FR-PAT-01)', () => {
  it('books through both steps and shows the confirmation', async () => {
    renderApp({ path: '/patient/book', signedInAs: PATIENT });
    await userEvent.click(await screen.findByRole('radio', { name: /Cardiology consultation/ }));
    const doctors = await screen.findByRole('region', { name: 'Available doctors' });
    const ahmed = (await within(doctors).findByRole('heading', { name: 'Dr. Ahmed Fathy' })).closest('li')!;
    await userEvent.click(within(ahmed).getByRole('link', { name: 'Choose a time' }));

    expect(await screen.findByText(/Step 2 of 2/)).toBeInTheDocument();
    await pickFirstFreeTime();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(await screen.findByText('Please accept the terms to book.')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/I agree to the clinic's attendance terms/));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(await screen.findByRole('heading', { name: "You're booked!" })).toBeInTheDocument();
    expect(screen.getByText('Confirmed by Nasr City')).toBeInTheDocument();
    expect(screen.getByText("We'll send you a reminder on WhatsApp (or by SMS) 24 hours and 2 hours before your visit.")).toBeInTheDocument();
  });
});

describe('my appointments', () => {
  it('lists upcoming and past visits', async () => {
    renderApp({ path: '/patient/appointments', signedInAs: PATIENT });
    expect(await screen.findByRole('tab', { name: 'Upcoming (3)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Past (3)' }));
    expect(await screen.findByText(/Cancelled by you/)).toBeInTheDocument();
  });

  it('cancels a visit with a reason', async () => {
    renderApp({ path: '/patient/appointments/apt-dental-checkup?action=cancel', signedInAs: PATIENT });
    await userEvent.click(await screen.findByRole('radio', { name: "I'm feeling better" }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel my visit' }));
    expect(await screen.findByText('Your visit was cancelled.')).toBeInTheDocument();
    expect(await screen.findByText('Cancelled', { selector: 'span' })).toBeInTheDocument();
  });

  it('reschedules into a new appointment', async () => {
    renderApp({ path: '/patient/appointments/apt-eyes?action=reschedule', signedInAs: PATIENT });
    await pickFirstFreeTime();
    await userEvent.click(screen.getByRole('button', { name: 'Move my visit' }));
    expect(await screen.findByText('Your visit was moved.')).toBeInTheDocument();
    // The old appointment turns Rescheduled, then the page opens the new one, which can still change
    await waitFor(() => {
      expect(screen.queryByText('This visit was moved')).not.toBeInTheDocument();
      expect(screen.getByText(/^You can move or cancel your visit until/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Move my visit' })).not.toBeInTheDocument();
  });

  it('takes the optional deposit online', async () => {
    renderApp({ path: '/patient/appointments/apt-eyes', signedInAs: PATIENT });
    await userEvent.click(await screen.findByRole('button', { name: /Pay EGP\s?100 deposit now/ }));
    expect(await screen.findByText('Payment received. Thank you.')).toBeInTheDocument();
    expect(await screen.findByText('Deposit paid online')).toBeInTheDocument();
  });

  it('collects a review after a completed visit', async () => {
    renderApp({ path: '/patient/appointments/apt-cardio-consult', signedInAs: PATIENT });
    await userEvent.click(await screen.findByRole('button', { name: 'Leave a review' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send review' }));
    expect(within(dialog).getByText('Choose a rating.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByLabelText('5 stars'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send review' }));
    expect(await screen.findByText('Thank you for your review.')).toBeInTheDocument();
  });
});

describe('reminder link (FR-APT-10)', () => {
  it('confirms attendance without signing in', async () => {
    renderApp({ path: `/r/${DEMO_REMINDER_TOKEN}` });
    expect(await screen.findByRole('heading', { level: 1, name: /^Your visit is on .+ at 6:00 PM$/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: "Yes, I'm coming" }));
    expect(await screen.findByText("Thank you. The clinic knows you're coming.")).toBeInTheDocument();
  });

  it('explains an expired link', async () => {
    renderApp({ path: '/r/unknown' });
    expect(await screen.findByText('This link has expired')).toBeInTheDocument();
  });
});
