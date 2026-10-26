import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fixClock } from '@/test/clock';
import { renderApp } from '@/test/render-app';

const RECEPTIONIST = 'u-mona';
const NURSE = 'u-sara';

const column = async (stage: string) => (await screen.findByRole('heading', { name: stage })).closest('section') as HTMLElement;
const cardIn = async (section: HTMLElement, name: string) => (await within(section).findByRole('heading', { name })).closest('article') as HTMLElement;

describe('the queue board (FR-FD-04/05)', () => {
  fixClock();

  it('calls a ready patient in, but never a second one into a busy room', async () => {
    renderApp({ path: '/desk/queue', signedInAs: RECEPTIONIST });
    const ready = await column('Ready for the doctor');
    await userEvent.click(within(await cardIn(ready, 'Mariam Nader')).getByRole('button', { name: 'Call in' }));
    expect(await screen.findByText('Ticket H-07 (Mariam Nader) is called in.')).toBeInTheDocument();
    expect(await within(await column('With the doctor')).findByRole('heading', { name: 'Mariam Nader' })).toBeInTheDocument();

    await userEvent.click(within(await cardIn(ready, 'Sameh Mahmoud')).getByRole('button', { name: 'Call in' }));
    expect(await screen.findByText('The doctor already has a patient in the room.')).toBeInTheDocument();
  });

  it('moves a patient to the front of the line only with a reason', async () => {
    renderApp({ path: '/desk/queue', signedInAs: RECEPTIONIST });
    await userEvent.click(await screen.findByRole('button', { name: 'More actions for ticket L-16' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Move to the front…' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move to the front' }));
    expect(within(dialog).getByText('Give a reason for moving this patient.')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/^Reason/), 'High fever, crying');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move to the front' }));
    expect(await screen.findByText('Ticket L-16 is now first in line.')).toBeInTheDocument();
    const triage = await column('Waiting for triage');
    expect(within(triage).getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Tamer Zaki');
  });

  it('filters the board by doctor', async () => {
    renderApp({ path: '/desk/queue', signedInAs: RECEPTIONIST });
    await userEvent.click(await screen.findByRole('button', { name: 'Dr. Hala Mostafa' }));
    expect(screen.queryByRole('heading', { name: 'Sameh Mahmoud' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mariam Nader' })).toBeInTheDocument();
  });

  it('shows the waiting-room screen with tickets and rooms but no names (FR-FD-06)', async () => {
    renderApp({ path: '/display/br-nc', signedInAs: RECEPTIONIST });
    const ahmed = await screen.findByRole('region', { name: 'Room 204, Dr. Ahmed Fathy' });
    expect(within(ahmed).getByText('A-05')).toBeInTheDocument();
    expect(within(ahmed).getByText('A-08')).toBeInTheDocument();
    expect(screen.queryByText('Nadia Soliman')).not.toBeInTheDocument();
    expect(screen.getByText('3 doctors on duty')).toBeInTheDocument();
  });
});

describe('the nurse station (FR-EMR-02)', () => {
  fixClock();

  it('lists who is next for vitals and the rooms', async () => {
    renderApp({ path: '/nurse', signedInAs: NURSE });
    expect(await screen.findByText('3 patients waiting for vitals')).toBeInTheDocument();
    expect(screen.getByText('Next in line for vitals')).toBeInTheDocument();
    const rooms = screen.getByRole('region', { name: 'Consultation rooms' });
    expect(within(rooms).getByText('Seeing ticket A-05 · 12 min')).toBeInTheDocument();
  });

  it('takes vitals, catches a typo, and sends the patient to the doctor', async () => {
    renderApp({ path: '/nurse', signedInAs: NURSE });
    await userEvent.click(await screen.findByRole('link', { name: 'Start triage for Tamer Zaki' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Tamer Zaki' })).toBeInTheDocument();
    expect(screen.getByText('Moderate allergy: Amoxicillin')).toBeInTheDocument();

    const temperature = screen.getByLabelText('Temperature');
    await userEvent.type(temperature, '384');
    expect(screen.getByText('Check this value: it should be between 30 and 45.')).toBeInTheDocument();
    const send = screen.getByRole('button', { name: /Send to the doctor/ });
    expect(send).toBeDisabled();

    await userEvent.clear(temperature);
    await userEvent.type(temperature, '38.4');
    expect(screen.getByText('High')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Weight'), '20');
    await userEvent.type(screen.getByLabelText('Height'), '110');
    expect(screen.getByText('BMI 16.5 · Underweight')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '4' }));
    expect(send).toBeDisabled(); // allergies not confirmed yet
    await userEvent.click(screen.getByRole('checkbox', { name: /I confirmed the allergies/ }));
    await userEvent.click(send);

    expect(await screen.findByText('Ticket L-16 is ready for Dr. Laila Hassan.')).toBeInTheDocument();
    expect(await screen.findByText('2 patients waiting for vitals')).toBeInTheDocument();
  });
});
