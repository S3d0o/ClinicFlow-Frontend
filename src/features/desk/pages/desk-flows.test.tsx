import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fixClock } from '@/test/clock';
import { renderApp } from '@/test/render-app';

const RECEPTIONIST = 'u-mona';

/** The visit card that shows `name`. */
const cardOf = async (name: string) => (await screen.findByRole('heading', { name })).closest('article') as HTMLElement;

describe('the front desk day (FR-FD-03, U7)', () => {
  fixClock();

  it('shows the counters, what needs action and each doctor’s visits', async () => {
    renderApp({ path: '/desk', signedInAs: RECEPTIONIST });
    expect(await screen.findByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    const booked = (await screen.findByText('Booked today')).closest('div')!.parentElement!;
    expect(within(booked).getByText('20')).toBeInTheDocument();

    const action = screen.getByRole('region', { name: 'Needs action (5)' });
    expect(within(action).getByText('Karim Sabry')).toBeInTheDocument();
    expect(within(action).getByText(/Unpaid: EGP\s200/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dr. Ahmed Fathy' })).toBeInTheDocument();
    expect(within(await cardOf('Mohamed Adel')).getByText('A-14')).toBeInTheDocument();
  });

  it('checks a patient in from the panel and gives them the next ticket', async () => {
    renderApp({ path: '/desk', signedInAs: RECEPTIONIST });
    await userEvent.click(within(await cardOf('Hassan Ali')).getByRole('button', { name: 'Check in' }));
    const panel = await screen.findByRole('dialog');
    const submit = await within(panel).findByRole('button', { name: 'Check in and print ticket' });
    expect(submit).toBeDisabled();
    await userEvent.click(within(panel).getByRole('checkbox', { name: /ID matches this record/ }));
    await userEvent.click(submit);
    expect(await screen.findByText('Hassan Ali is checked in. Ticket A-17.')).toBeInTheDocument();
    expect(await within(await cardOf('Hassan Ali')).findByText('Waiting for triage')).toBeInTheDocument();
  });

  it('marks a late patient as a no-show', async () => {
    renderApp({ path: '/desk', signedInAs: RECEPTIONIST });
    await userEvent.click(within(await cardOf('Karim Sabry')).getByRole('button', { name: 'More actions for Karim Sabry' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Mark as no-show' }));
    expect(await screen.findByText('Karim Sabry is marked as a no-show.')).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Needs action (4)' })).toBeInTheDocument();
  });

  it('asks an organization-wide manager to pick a branch first', async () => {
    renderApp({ path: '/desk', signedInAs: 'u-hala' });
    expect(await screen.findByText('Choose a branch')).toBeInTheDocument();
  });
});

describe('patients and booking (FR-FD-01/02, FR-APT-03/04)', () => {
  fixClock();

  it('finds a patient from the top bar in any Arabic spelling', async () => {
    renderApp({ path: '/desk', signedInAs: RECEPTIONIST });
    await userEvent.type(await screen.findByRole('searchbox', { name: /Search patients by name/ }), 'فاطمه{Enter}');
    expect(await screen.findByRole('heading', { name: 'فاطمة حسن' })).toBeInTheDocument();
    expect(screen.getByText('1 match')).toBeInTheDocument();
  });

  it('warns about a duplicate, registers a new patient and books them by phone', async () => {
    renderApp({ path: '/desk/patients', signedInAs: RECEPTIONIST });
    const form = (await screen.findByRole('heading', { name: 'Register a new patient' })).closest('section') as HTMLElement;
    const phone = within(form).getByLabelText(/^Mobile number/);
    await userEvent.type(phone, '010 1234 5678');
    expect(await within(form).findByText('These may be patients we already have')).toBeInTheDocument();

    await userEvent.clear(phone);
    await userEvent.type(phone, '0109 999 8888');
    await userEvent.type(within(form).getByLabelText(/^Full name/), 'Laila Samir');
    await userEvent.click(within(form).getByRole('radio', { name: 'Female' }));
    await userEvent.type(within(form).getByLabelText(/^Date of birth/), '1993-04-02');
    await userEvent.click(within(form).getByRole('button', { name: 'Save and book a visit' }));

    expect(await screen.findByText('Laila Samir is registered as MRN-000413.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Book / walk-in' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('radio', { name: /Pediatric consultation/ }));
    await userEvent.click(await screen.findByRole('radio', { name: /Dr\. Laila Hassan/ }));
    const times = (await screen.findByRole('heading', { name: 'Day and time' })).closest('section') as HTMLElement;
    const firstFree = (await within(times).findAllByRole('button', { pressed: false })).find(
      (button) => !(button as HTMLButtonElement).disabled && /\d:\d\d/.test(button.textContent ?? '')
    )!;
    await userEvent.click(firstFree);
    await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(await screen.findByText(/^Booked for .+ Reference CF-/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
  });

  it('checks in a walk-in, who then waits for triage on the queue board', async () => {
    renderApp({ path: '/desk/book?patient=pat-000119&mode=walk-in', signedInAs: RECEPTIONIST });
    await userEvent.click(await screen.findByRole('radio', { name: /Pediatric consultation/ }));
    await userEvent.click(await screen.findByRole('radio', { name: /Dr\. Laila Hassan/ }));
    expect(screen.getByText('2 patients waiting')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('What brings them in'), 'Cough for a week');
    await userEvent.click(screen.getByRole('button', { name: 'Check in and print ticket' }));

    expect(await screen.findByText('Adam Sherif is checked in. Ticket L-17.')).toBeInTheDocument();
    const triage = (await screen.findByRole('heading', { name: 'Waiting for triage' })).closest('section') as HTMLElement;
    expect(await within(triage).findByText('Adam Sherif')).toBeInTheDocument();
    expect(within(triage).getByText('Cough for a week')).toBeInTheDocument();
  });
});
